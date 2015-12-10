<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/user_chapter_preferences_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/services/user_preference_service.php" ) ;

class ChapterProgressSnapshot {

	public $guard ;

	public $chapterId ;
	public $syllabusName ;
	public $subjectName ;
	public $chapterNum ;
	public $subChapterNum ;
	public $chapterName ;
	public $numCards ;

	public $isNotesAuthorized ;
	public $isFlashcardAuthorized ;
	public $isStatisticsAuthorized ;
	public $isDeleteAuthorized ;
	
	public $notStartedCards ;
	public $l0Cards ;
	public $l1Cards ;
	public $l2Cards ;
	public $l3Cards ;
	public $masteredCards ;
	public $numSSRMaturedCards ;
	public $isHidden ;

	function __construct( $meta ) {

		$this->guard         = $meta[ "guard"           ] ;
		$this->chapterId     = $meta[ "chapter_id"      ] ;
		$this->syllabusName  = $meta[ "syllabus_name"   ] ;
		$this->subjectName   = $meta[ "subject_name"    ] ;
		$this->chapterNum    = $meta[ "chapter_num"     ] ;
		$this->subChapterNum = $meta[ "sub_chapter_num" ] ;
		$this->chapterName   = $meta[ "chapter_name"    ] ;
		$this->numCards      = $meta[ "num_cards"       ] ;

		$this->isNotesAuthorized      = Authorizer::hasAccess( $this->guard, "NOTES" ) ;
		$this->isFlashcardAuthorized  = Authorizer::hasAccess( $this->guard, "FLASH_CARD" ) ;
		$this->isStatisticsAuthorized = Authorizer::hasAccess( $this->guard, "CHAPTER_STATS" ) ;
		$this->isDeleteAuthorized     = Authorizer::hasAccess( $this->guard, "DELETE_CHAPTER" ) ;

		$this->notStartedCards    = 0 ;
		$this->l0Cards            = 0 ;
		$this->l1Cards            = 0 ;
		$this->l2Cards            = 0 ;
		$this->l3Cards            = 0 ;
		$this->masteredCards      = 0 ;
		$this->numSSRMaturedCards = 0 ;
		$this->isHidden           = false ;
		$this->isDeselected       = false ;
	}

	public function isUserEntitled() {
		return $this->isNotesAuthorized || 
		       $this->isFlashcardAuthorized ||
		       $this->isStatisticsAuthorized || 
		       $this->isDeleteAuthorized ;
	}
}

class ProgressSnapshotAPI extends API {

	private $syllabusMap ;
	private $chapters ;
	private $selectedChapterIdList ;
	private $chapterDAO ;
	private $clsDAO ;
	private $ucpDAO ;
	private $upSvc = NULL ;

	function __construct() {
		parent::__construct() ;
		$this->syllabusMap           = array() ;
		$this->chapters              = array() ;
		$this->selectedChapterIdList = array() ;
		$this->chapterDAO            = new ChapterDAO() ;
		$this->clsDAO                = new CardLearningSummaryDAO() ;
		$this->ucpDAO                = new UserChapterPrefsDAO() ;
		$this->upSvc                 = new UserPreferenceService() ;
	}

	public function doPost( $request, &$response ) {

		$action = $request->requestBody->action ;

		$this->logger->debug( "Executing doPost in ProgressSnapshotAPI" ) ;
		$this->logger->debug( "action = $action" ) ;

		if( $action == "update_visibility" ) {
			$this->ucpDAO->updateHiddenPreference( ExecutionContext::getCurrentUserName(),
												   $request->requestBody->chapterId,
				                                   $request->requestBody->isHidden ) ;
			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "Success" ;
		}
		else if( $action == "update_selection" ) {
			$this->ucpDAO->updateDeselectPreference( ExecutionContext::getCurrentUserName(),
												   $request->requestBody->chapterIds,
				                                   $request->requestBody->selectionState ) ;
			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "Success" ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
			$response->responseBody = "Unknown action $action" ;
		}
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ProgressSnapshotAPI" ) ;

		$this->clsDAO->refresh( ExecutionContext::getCurrentUserName() ) ;

		$this->loadAndClassifyRelevantChapters() ;

		if( !empty( $this->chapters ) ) {
			$this->associateProgressSnapshotWithChapters() ;
			$this->associateNumSSRMaturedCardsWithChapters() ;
			$this->associateUserChapterPreferences() ;
		}
		
		$responseObj = $this->constructResponseObj() ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseObj ;
		//$response->responseBody = $this->getReferenceOutput() ;
	}

	// Set the responseBody to the output of this function if we want to send 
	// back a prefabricated reference JSON.
	private function getReferenceOutput() {
		return file_get_contents( DOCUMENT_ROOT . 
			         "/apps/jove_notes/api_test_data/progress_snapshot.json" ) ;
	}

	private function loadAndClassifyRelevantChapters() {

		$chapterMeta = $this->chapterDAO->getChaptersMetaData() ;

		foreach( $chapterMeta as $meta ) {

			$chapter = null ;
			$chapter = new ChapterProgressSnapshot( $meta ) ;
			if( $chapter->isUserEntitled() ) {

				$this->chapters[ $chapter->chapterId ] = $chapter ;
				array_push( $this->selectedChapterIdList, $chapter->chapterId ) ;

				if( !array_key_exists( $chapter->syllabusName, $this->syllabusMap ) ) {
					$this->syllabusMap[ $chapter->syllabusName ] = array() ;
				}
				$subjectMap = &$this->syllabusMap[ $chapter->syllabusName ] ;

				if( !array_key_exists( $chapter->subjectName, $subjectMap ) ) {
					$subjectMap[ $chapter->subjectName ] = array() ;
				}
				$chapArray = &$subjectMap[ $chapter->subjectName ] ;

				array_push( $chapArray, $chapter ) ;
			}
		}
	}

	private function &constructResponseObj() {

		$responseObj = array() ;
		$responseObj[ "preferences" ] = $this->constructPreferenceResponseObj() ;

		$dashboardContent = array() ;
		foreach( $this->syllabusMap as $syllabusName => $subMap ) {
			$syllabusObj = array() ;
			$syllabusObj[ "syllabusName" ] = $syllabusName ;
			$syllabusObj[ "subjects"     ] = $this->constructSubjectResponseObj( $subMap ) ;
			array_push( $dashboardContent, $syllabusObj ) ;
		}
		$responseObj[ "dashboardContent" ] = $dashboardContent ;

		return $responseObj ;
	}

	private function &constructPreferenceResponseObj() {

		$preferenceKeys = [ "jove_notes.showHiddenChapters", 
		                    "jove_notes.showOnlySelectedRows" ] ;

		$preferences = array() ;
		foreach( $preferenceKeys as $key ) {
			$prefValue = $this->upSvc->getUserPreference( $key ) ;
			$preferences[ $key ] = $prefValue ;
		}
		return $preferences ;
	}

	private function &constructSubjectResponseObj( $subMap ) {

		$responseArray = array() ;

		foreach( $subMap as $subName => $chapObjectArray ) {

			$chapResponseArray = array() ;
			foreach( $chapObjectArray as $chapter ) {
				array_push( $chapResponseArray, $this->constructChapterResponseObj( $chapter ) ) ;
			}

			$subObj = array() ;
			$subObj[ "subjectName" ] = $subName ;
			$subObj[ "chapters"    ] = $chapResponseArray ;
			array_push( $responseArray, $subObj ) ;
		}
		return $responseArray ;
	}

	private function associateProgressSnapshotWithChapters() {

		$levelCounts = $this->clsDAO->getChapterWiseLevelCounts( 
										ExecutionContext::getCurrentUserName(), 
										$this->selectedChapterIdList ) ;

		foreach( $levelCounts as $levelRow ) {

			$chapterId = $levelRow[ "chapter_id" ] ;
			$level     = $levelRow[ "current_level" ] ;
			$count     = $levelRow[ "count" ] ;

			$chapter = &$this->chapters[ $chapterId ] ;

			     if( $level == 'NS'  ) $chapter->notStartedCards = $count ;
			else if( $level == 'L0'  ) $chapter->l0Cards         = $count ;
			else if( $level == 'L1'  ) $chapter->l1Cards         = $count ;
			else if( $level == 'L2'  ) $chapter->l2Cards         = $count ;
			else if( $level == 'L3'  ) $chapter->l3Cards         = $count ;
			else if( $level == 'MAS' ) $chapter->masteredCards   = $count ;
		}
	}

	private function associateNumSSRMaturedCardsWithChapters() {

		$chapterMaturedCardsMap = $this->clsDAO->getChapterWiseSSRMaturedCards( 
									  ExecutionContext::getCurrentUserName() ) ;

		foreach( $chapterMaturedCardsMap as $chapterRow ) {

			$chapterId = $chapterRow[ "chapter_id" ] ;
			$count     = $chapterRow[ "num_ssr_matured_cards" ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {

				$chapter = &$this->chapters[ $chapterId ] ;
				$chapter->numSSRMaturedCards = $count ;
			}
		}
	}

	private function associateUserChapterPreferences() {

		$preferences = $this->ucpDAO->getChapterPreferencesForUser( 
									  ExecutionContext::getCurrentUserName() ) ;

		foreach( $preferences as $pref ) {

			$chapterId    = $pref[ "chapter_id"    ] ;
			$isHidden     = $pref[ "is_hidden"     ] ;
			$isDeselected = $pref[ "is_deselected" ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {
				$chapter = &$this->chapters[ $chapterId ] ;
				if( $isHidden == 1 ) {
					$chapter->isHidden = true ;
				}
				if( $isDeselected == 1 ) {
					$chapter->isDeselected = true ;
				}
			}
		}
	}

	private function &constructChapterResponseObj( $chapter ) {

		$responseObj = array() ;

		$responseObj[ "chapterId"              ] = $chapter->chapterId ;
		$responseObj[ "chapterNum"             ] = $chapter->chapterNum ;
		$responseObj[ "subChapterNum"          ] = $chapter->subChapterNum ;
		$responseObj[ "chapterName"            ] = $chapter->chapterName ;
		$responseObj[ "isNotesAuthorized"      ] = $chapter->isNotesAuthorized ;
		$responseObj[ "isFlashcardAuthorized"  ] = $chapter->isFlashcardAuthorized ;
		$responseObj[ "isStatisticsAuthorized" ] = $chapter->isStatisticsAuthorized ;
		$responseObj[ "isDeleteAuthorized"     ] = $chapter->isDeleteAuthorized ;
		$responseObj[ "totalCards"             ] = $chapter->numCards ;
		$responseObj[ "notStartedCards"        ] = $chapter->notStartedCards ;
		$responseObj[ "l0Cards"                ] = $chapter->l0Cards ;
		$responseObj[ "l1Cards"                ] = $chapter->l1Cards ;
		$responseObj[ "l2Cards"                ] = $chapter->l2Cards ;
		$responseObj[ "l3Cards"                ] = $chapter->l3Cards ;
		$responseObj[ "masteredCards"          ] = $chapter->masteredCards ;
		$responseObj[ "numSSRMaturedCards"     ] = $chapter->numSSRMaturedCards ;
		$responseObj[ "isHidden"               ] = $chapter->isHidden ;
		$responseObj[ "isDeselected"           ] = $chapter->isDeselected ;

		return $responseObj ;
	}

	// =========================================================================

}

?>