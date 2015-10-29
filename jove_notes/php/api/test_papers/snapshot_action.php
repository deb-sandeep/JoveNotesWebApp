<?php
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

class SnapshotAction extends APIAction {

	private $syllabusMap ;
	private $chapters ;
	private $selectedChapterIdList ;

	private $chapterDAO ;
	private $clsDAO ;
	private $ucpDAO ;

	private $upSvc ;

	function __construct() {

		parent::__construct() ;

		$this->syllabusMap           = array() ;
		$this->chapters              = array() ;
		$this->selectedChapterIdList = array() ;

		$this->chapterDAO = new ChapterDAO() ;
		$this->clsDAO     = new CardLearningSummaryDAO() ;
		$this->ucpDAO     = new UserChapterPrefsDAO() ;

		$this->upSvc = new UserPreferenceService() ;
	}

	public function execute( $request, &$response ) {

		$this->logger->debug( "Executing SnapshotAction" ) ;

		$this->loadAndClassifyRelevantChapters() ;

		if( !empty( $this->chapters ) ) {
			$this->associateUserChapterPreferences() ;
		}
		
		$responseObj = $this->constructResponseObj() ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseObj ;
	}

	private function loadAndClassifyRelevantChapters() {

		$chapterMeta = $this->chapterDAO->getTestChaptersMetaData() ;
		foreach( $chapterMeta as $meta ) {

			$testPaper = null ;
			$testPaper = new TestPaperSnapshot( $meta ) ;

			if( $testPaper->isUserEntitled() ) {

				$this->chapters[ $testPaper->chapterId ] = $testPaper ;
				array_push( $this->selectedChapterIdList, $testPaper->chapterId ) ;

				if( !array_key_exists( $testPaper->syllabusName, $this->syllabusMap ) ) {
					$this->syllabusMap[ $testPaper->syllabusName ] = array() ;
				}
				$subjectMap = &$this->syllabusMap[ $testPaper->syllabusName ] ;

				if( !array_key_exists( $testPaper->subjectName, $subjectMap ) ) {
					$subjectMap[ $testPaper->subjectName ] = array() ;
				}
				$testPapersArray = &$subjectMap[ $testPaper->subjectName ] ;

				array_push( $testPapersArray, $testPaper ) ;
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

		$preferenceKeys = [ "jove_notes.showHiddenTestPapers" ] ;

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

	private function &constructChapterResponseObj( $chapter ) {

		$responseObj = array() ;

		$responseObj[ "chapterId"              ] = $chapter->chapterId ;
		$responseObj[ "chapterNum"             ] = $chapter->chapterNum ;
		$responseObj[ "subChapterNum"          ] = $chapter->subChapterNum ;
		$responseObj[ "chapterName"            ] = $chapter->chapterName ;
		$responseObj[ "isDeleteAuthorized"     ] = $chapter->isDeleteAuthorized ;
		$responseObj[ "totalCards"             ] = $chapter->numCards ;
		$responseObj[ "isHidden"               ] = $chapter->isHidden ;

		return $responseObj ;
	}
}
?>