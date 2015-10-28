<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/api_bootstrap.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/user_chapter_preferences_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/services/user_preference_service.php" ) ;

class TestPaperSnapshot {

	public $guard ;

	public $chapterId ;
	public $syllabusName ;
	public $subjectName ;
	public $chapterNum ;
	public $subChapterNum ;
	public $chapterName ;
	public $numCards ;

	public $isTestPaperAuthorized ;
	public $isDeleteAuthorized ;
	
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

		$this->isTestPaperAuthorized  = Authorizer::hasAccess( $this->guard, "TEST_PAPER" ) ;
		$this->isDeleteAuthorized     = Authorizer::hasAccess( $this->guard, "DELETE_CHAPTER" ) ;

		$this->isHidden = false ;
	}

	public function isUserEntitled() {
		return $this->isTestPaperAuthorized || 
		       $this->isDeleteAuthorized ;
	}
}

class TestPapersAPI extends API {

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

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in TestPapersAPI" ) ;

		$this->clsDAO->refresh( ExecutionContext::getCurrentUserName() ) ;

		// TODO: From here

		$this->loadAndClassifyRelevantChapters() ;

		if( !empty( $this->chapters ) ) {
			$this->associateProgressSnapshotWithChapters() ;
			$this->associateNumSSRMaturedCardsWithChapters() ;
			$this->associateUserChapterPreferences() ;
		}
		
		$responseObj = $this->constructResponseObj() ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseObj ;
	}

	private function loadAndClassifyRelevantChapters() {

		// TODO - DAO needs to get only the test papers
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

		$preferenceKeys = [ "jove_notes.showHiddenChapters" ] ;

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

		$hiddenChapterPrefs = $this->ucpDAO->getHiddenPreferencesForUser( 
									  ExecutionContext::getCurrentUserName() ) ;

		foreach( $hiddenChapterPrefs as $chapterId => $isHidden ) {

			if( array_key_exists( $chapterId, $this->chapters ) ) {
				if( $isHidden == 1 ) {
					$chapter = &$this->chapters[ $chapterId ] ;
					$chapter->isHidden = true ;
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

		return $responseObj ;
	}

	// =========================================================================

}

?>