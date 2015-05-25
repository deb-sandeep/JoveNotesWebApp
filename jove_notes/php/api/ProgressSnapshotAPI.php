<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/api_bootstrap.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;

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
	
	public $notStartedCards ;
	public $l0Cards ;
	public $l1Cards ;
	public $l2Cards ;
	public $l3Cards ;
	public $masteredCards ;

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

		$this->notStartedCards = 0 ;
		$this->l0Cards         = 0 ;
		$this->l1Cards         = 0 ;
		$this->l2Cards         = 0 ;
		$this->l3Cards         = 0 ;
		$this->masteredCards   = 0 ;
	}

	public function isUserEntitled() {
		return $this->isNotesAuthorized || 
		       $this->isFlashcardAuthorized ||
		       $this->isStatisticsAuthorized ;
	}
}

class ProgressSnapshotAPI extends API {

	private $syllabusMap ;
	private $chapters ;

	function __construct() {
		parent::__construct() ;
		$this->syllabusMap = array() ;
		$this->chapters = array() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ProgressSnapshotAPI" ) ;

		$this->loadAndClassifyRelevantChapters() ;
		$responseObj = $this->constructResponseObj() ;

		$response->responseCode = APIResponse::SC_OK ;
		// $response->responseBody = file_get_contents( DOCUMENT_ROOT . 
		// 	          "/apps/jove_notes/api_test_data/progress_snapshot.json" ) ;
		$response->responseBody = $responseObj ;
	}

	private function loadAndClassifyRelevantChapters() {

		$chapterDAO = new ChapterDAO() ;
		$chapterMeta = $chapterDAO->getChaptersMetaData() ;

		foreach( $chapterMeta as $meta ) {

			$chapter = new ChapterProgressSnapshot( $meta ) ;

			if( $chapter->isUserEntitled() ) {

				array_push( $this->chapters, $chapter ) ;

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

		$responseArray = array() ;

		foreach( $this->syllabusMap as $syllabusName => $subMap ) {
			$syllabusObj = array() ;
			$syllabusObj[ "syllabusName" ] = $syllabusName ;
			$syllabusObj[ "subjects"     ] = $this->constructSubjectResponseObj( $subMap ) ;
			array_push( $responseArray, $syllabusObj ) ;
		}
		return $responseArray ;
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
		$responseObj[ "isNotesAuthorized"      ] = $chapter->isNotesAuthorized ;
		$responseObj[ "isFlashcardAuthorized"  ] = $chapter->isFlashcardAuthorized ;
		$responseObj[ "isStatisticsAuthorized" ] = $chapter->isStatisticsAuthorized ;
		$responseObj[ "totalCards"             ] = $chapter->numCards ;
		$responseObj[ "notStartedCards"        ] = $chapter->notStartedCards ;
		$responseObj[ "l0Cards"                ] = $chapter->l0Cards ;
		$responseObj[ "l1Cards"                ] = $chapter->l1Cards ;
		$responseObj[ "l2Cards"                ] = $chapter->l2Cards ;
		$responseObj[ "l3Cards"                ] = $chapter->l3Cards ;
		$responseObj[ "masteredCards"          ] = $chapter->masteredCards ;

		return $responseObj ;
	}
}

?>