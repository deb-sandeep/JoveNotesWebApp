<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/user_chapter_preferences_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/services/user_preference_service.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_preparedness_request_queue_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_preparedness_dao.php" ) ;

class ChapterProgressSnapshot {

	public $guard ;

	public $chapterId ;
	public $syllabusName ;
	public $subjectName ;
	public $chapterNum ;
	public $subChapterNum ;
	public $chapterName ;
    public $notesCompleted ;
	public $numCards ;

	public $isNotesAuthorized ;
	public $isFlashcardAuthorized ;
	public $isStatisticsAuthorized ;
	public $isDeleteAuthorized ;
	
	public $notStartedCards ;
	public $nrCards ;
	public $l0Cards ;
	public $l1Cards ;
	public $l2Cards ;
	public $l3Cards ;
	public $masteredCards ;
	public $numSSRMaturedCards ;
	public $isHidden ;
    public $isCurrentFocus ;
	public $isDeselected ;
	public $isInSyllabus ;
	public $preparednessScore ;
	public $retentionScore ;
	public $pctSectionsActive ;

	function __construct( $meta ) {

		$this->guard         = $meta[ "guard"           ] ;
		$this->chapterId     = $meta[ "chapter_id"      ] ;
		$this->syllabusName  = $meta[ "syllabus_name"   ] ;
		$this->subjectName   = $meta[ "subject_name"    ] ;
		$this->chapterNum    = $meta[ "chapter_num"     ] ;
		$this->subChapterNum = $meta[ "sub_chapter_num" ] ;
		$this->chapterName   = $meta[ "chapter_name"    ] ;
        $this->notesCompleted= $meta[ "notes_completed" ] ;
		$this->numCards      = $meta[ "num_cards"       ] ;

		$this->isNotesAuthorized      = Authorizer::hasAccess( $this->guard, "NOTES" ) ;
		$this->isFlashcardAuthorized  = Authorizer::hasAccess( $this->guard, "FLASH_CARD" ) ;
		$this->isStatisticsAuthorized = Authorizer::hasAccess( $this->guard, "CHAPTER_STATS" ) ;
		$this->isDeleteAuthorized     = Authorizer::hasAccess( $this->guard, "DELETE_CHAPTER" ) ;

		$this->notStartedCards    = 0 ;
		$this->nrCards            = 0 ;
		$this->l0Cards            = 0 ;
		$this->l1Cards            = 0 ;
		$this->l2Cards            = 0 ;
		$this->l3Cards            = 0 ;
		$this->masteredCards      = 0 ;
		$this->numSSRMaturedCards = 0 ;
		$this->isHidden           = false ;
        $this->isCurrentFocus     = false ;
		$this->isDeselected       = true ;
		$this->isInSyllabus       = false ;
		$this->preparednessScore  = 0 ;
		$this->retentionScore     = 0 ;
		$this->pctSectionsActive  = 0 ;
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
	private $cpDAO ;
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
		$this->cpDAO                 = new ChapterPreparednessDAO() ;
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
        else if( $action == "update_current_focus" ) {
            $this->ucpDAO->updateCurrentFocusPreference( ExecutionContext::getCurrentUserName(),
                                                         $request->requestBody->chapterId,
                                                         $request->requestBody->isCurrentFocus ) ;
            $response->responseCode = APIResponse::SC_OK ;
            $response->responseBody = "Success" ;
        }
		else if( $action == "update_visibility_batch" ) {
			$this->ucpDAO->updateVisibilityInBatch( ExecutionContext::getCurrentUserName(),
				                                   $request->requestBody->visibilityData ) ;
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
		else if( $action == "update_in_syllabus" ) {
			$this->ucpDAO->updateInSyllabusPreference( ExecutionContext::getCurrentUserName(),
												   $request->requestBody->chapterIds,
				                                   $request->requestBody->selectionState ) ;
			if( $request->requestBody->selectionState ) {
				$dao = new ChapterPreparednessRequestQueueDAO() ;
				$dao->insertRequests( ExecutionContext::getCurrentUserName(),
					                  $request->requestBody->chapterIds ) ;
			}

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "Success" ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
			$response->responseBody = "Unknown action $action" ;
		}
	}

	public function doGet( $request, &$response ): void {

		$this->logger->debug( "Executing doGet in ProgressSnapshotAPI" ) ;

		$this->clsDAO->refresh( ExecutionContext::getCurrentUserName() ) ;

		$chapterType = $request->getParameter( "chapterType", "cards" ) ;

		$this->loadAndClassifyRelevantChapters( $chapterType ) ;

		if( !empty( $this->chapters ) ) {
			$this->associateProgressSnapshotWithChapters() ;
			$this->associateNumSSRMaturedCardsWithChapters() ;
			$this->associateNumResurrectedCardsWithChapters() ;
			$this->associateUserChapterPreferences() ;
			$this->associateChapterPreparedness() ;
			$this->associateActiveSectionPercentage() ;
		}
		
		$responseObj = $this->constructResponseObj() ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseObj ;
	}

	// Set the responseBody to the output of this function if we want to send 
	// back a prefabricated reference JSON.
	private function getReferenceOutput() {
		return file_get_contents( DOCUMENT_ROOT . 
			         "/apps/jove_notes/api_test_data/progress_snapshot.json" ) ;
	}

	private function loadAndClassifyRelevantChapters( $chapterType ) {

		$showHiddenChPref = $this->getShowHiddenChapterPref( $chapterType ) ;

		if( $showHiddenChPref == "true" ) {
			$chapterMeta = $this->chapterDAO->getAllChaptersMetaData( $chapterType ) ;
		}
		else {
			$chapterMeta = $this->chapterDAO->getNonHiddenChaptersMetaData( 
									  $chapterType,
				                      ExecutionContext::getCurrentUserName() ) ;
		}

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

	private function getShowHiddenChapterPref( $chapterType ) {

		$prefKey = ( $chapterType == "cards" ) ? 
		           "jove_notes.showHiddenChapters" :
		           "jove_notes.showHiddenExercises" ;

		return $this->upSvc->getUserPreference( $prefKey ) ;
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
		                    "jove_notes.showOnlySelectedRows",
		                    "jove_notes.showHiddenExercises",
		                    "jove_notes.syllabusMerged",
                            "jove_notes.showOnlyCurrentFocus" ] ;

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

	private function associateNumResurrectedCardsWithChapters() {

		$nrCounts = $this->clsDAO->getChapterWiseResurrectedCardsCounts( 
										ExecutionContext::getCurrentUserName(), 
										$this->selectedChapterIdList ) ;
		foreach( $nrCounts as $nrRow ) {

			$chapterId = $nrRow[ "chapter_id" ] ;
			$nrCount   = $nrRow[ "nr_count" ] ;

			$chapter = &$this->chapters[ $chapterId ] ;

			$chapter->nrCards = $nrCount ;
			$chapter->notStartedCards -= $nrCount ;
		}
	}

	private function associateNumSSRMaturedCardsWithChapters() {

		$chapterMaturedCardsMap = $this->clsDAO->getChapterWiseSSRMaturedCards( 
									  ExecutionContext::getCurrentUserName(),
									  $this->selectedChapterIdList ) ;

		foreach( $chapterMaturedCardsMap as $chapterRow ) {

			$chapterId = $chapterRow[ "chapter_id" ] ;
			$count     = $chapterRow[ "num_ssr_matured_cards" ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {

				$chapter = &$this->chapters[ $chapterId ] ;
				$chapter->numSSRMaturedCards = $count ;
			}
		}
	}

	private function associateUserChapterPreferences(): void {

		$preferences = $this->ucpDAO->getChapterPreferencesForUser( 
									  ExecutionContext::getCurrentUserName(),
									  $this->selectedChapterIdList ) ;

		foreach( $preferences as $pref ) {

			$chapterId      = $pref[ "chapter_id"       ] ;
			$isHidden       = $pref[ "is_hidden"        ] ;
            $isCurrentFocus = $pref[ "is_current_focus" ] ;
			$isDeselected   = $pref[ "is_deselected"    ] ;
			$isInSyllabus   = $pref[ "is_in_syllabus"   ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {
				$chapter = &$this->chapters[ $chapterId ] ;
				if( $isHidden == 1 ) {
					$chapter->isHidden = true ;
				}
                if( $isCurrentFocus == 1 ) {
                    $chapter->isCurrentFocus = true ;
                }
				if( $isInSyllabus == 1 ) {
					$chapter->isInSyllabus = true ;
				}
				$chapter->isDeselected = $isDeselected == 1 ? true : false ;
			}
		}
	}

	private function associateChapterPreparedness() {

		$prepValues = $this->cpDAO->getPreparednessValuesForUser(
			                          ExecutionContext::getCurrentUserName() ) ;

		foreach( $prepValues as $preparedness ) {

			$chapterId = $preparedness[ "chapter_id"         ] ;
			$prepValue = $preparedness[ "preparedness_score" ] ;
			$retention = $preparedness[ "retention_score" ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {
				$chapter = &$this->chapters[ $chapterId ] ;
				$chapter->preparednessScore = $prepValue ;
				$chapter->retentionScore = $retention ;
			}
		}
	}

	private function associateActiveSectionPercentage() {

		$activeSectionPercentages = $this->chapterDAO
		                                 ->getChapterActiveSectionPctForChapters( $this->selectedChapterIdList ) ;

		foreach( $activeSectionPercentages as $pctRow ) {

			$chapterId      = $pctRow[ "chapter_id"          ] ;
			$pctSecActive   = $pctRow[ "sections_active_pct" ] ;

			if( array_key_exists( $chapterId, $this->chapters ) ) {
				$chapter = &$this->chapters[ $chapterId ] ;
				$chapter->pctSectionsActive = $pctSecActive ;
			}
		}
	}

	private function &constructChapterResponseObj( $chapter ) {

		$responseObj = array() ;

		$responseObj[ "chapterId"              ] = $chapter->chapterId ;
		$responseObj[ "chapterNum"             ] = $chapter->chapterNum ;
		$responseObj[ "subChapterNum"          ] = $chapter->subChapterNum ;
		$responseObj[ "chapterName"            ] = $chapter->chapterName ;
        $responseObj[ "notesCompleted"         ] = $chapter->notesCompleted ;
		$responseObj[ "isNotesAuthorized"      ] = $chapter->isNotesAuthorized ;
		$responseObj[ "isFlashcardAuthorized"  ] = $chapter->isFlashcardAuthorized ;
		$responseObj[ "isStatisticsAuthorized" ] = $chapter->isStatisticsAuthorized ;
		$responseObj[ "isDeleteAuthorized"     ] = $chapter->isDeleteAuthorized ;
		$responseObj[ "totalCards"             ] = $chapter->numCards ;
		$responseObj[ "notStartedCards"        ] = $chapter->notStartedCards ;
		$responseObj[ "nrCards"                ] = $chapter->nrCards ;
		$responseObj[ "l0Cards"                ] = $chapter->l0Cards ;
		$responseObj[ "l1Cards"                ] = $chapter->l1Cards ;
		$responseObj[ "l2Cards"                ] = $chapter->l2Cards ;
		$responseObj[ "l3Cards"                ] = $chapter->l3Cards ;
		$responseObj[ "masteredCards"          ] = $chapter->masteredCards ;
		$responseObj[ "numSSRMaturedCards"     ] = $chapter->numSSRMaturedCards ;
		$responseObj[ "isHidden"               ] = $chapter->isHidden ;
        $responseObj[ "isCurrentFocus"         ] = $chapter->isCurrentFocus ;
		$responseObj[ "isDeselected"           ] = $chapter->isDeselected ;
		$responseObj[ "isInSyllabus"           ] = $chapter->isInSyllabus ;
		$responseObj[ "preparednessScore"      ] = $chapter->preparednessScore ;
		$responseObj[ "retentionScore"         ] = $chapter->retentionScore ;
		$responseObj[ "pctSectionsActive"      ] = $chapter->pctSectionsActive ;

		return $responseObj ;
	}

	// =========================================================================

}

?>