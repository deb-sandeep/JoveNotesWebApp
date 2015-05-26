<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/api_bootstrap.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;

class AbstractJoveNotesAPI extends API {

	protected $chapterDAO = null ;

	protected $chapterId     = 0 ;
	protected $chapterDetail = null ;
	protected $chapterGuard  = null ;

	protected $numCards = 0;
	protected $num_VE   = 0;
	protected $num_E    = 0;
	protected $num_M    = 0;
	protected $num_H    = 0;
	protected $num_VH   = 0 ;

	function __construct() {
		parent::__construct() ;
		$this->chapterDAO = new ChapterDAO() ;
	}

	protected function isUserEntitledForNotes( $chapterId ) {
		return $this->isUserEntitled( $chapterId, "NOTES" ) ;
	}

	protected function isUserEntitledForFlashCards( $chapterId ) {
		return $this->isUserEntitled( $chapterId, "FLASH_CARD" ) ;
	}

	private function isUserEntitled( $chapterId, $op ) {

		$this->constructChapterDetails( $chapterId ) ;
		if( !Authorizer::hasAccess( $this->chapterGuard, $op ) ) {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "Unauthorized access." ;
			return false ;
		}
		return true ;
	}

	private function constructChapterDetails( $chapterId ) {

		if( $this->chapterDetail == null ) {

			$this->logger->debug( "Chapter id = $chapterId" ) ;

			$meta = $this->chapterDAO->getChapterMetaData( $chapterId ) ;
			if( $meta == null ) {
				throw new Exception( "Chapter not found" ) ;
			}

			$this->chapterId       = $chapterId ;
			$this->chapterGuard    = $meta[ "guard" ] ;		
			$this->chapterDetail   = array() ;

			$this->chapterDetail[ "chapterId"        ] = $meta[ "chapter_id"      ] ;
			$this->chapterDetail[ "syllabusName"     ] = $meta[ "syllabus_name"   ] ;
			$this->chapterDetail[ "subjectName"      ] = $meta[ "subject_name"    ] ;
			$this->chapterDetail[ "chapterNumber"    ] = $meta[ "chapter_num"     ] ;
			$this->chapterDetail[ "subChapterNumber" ] = $meta[ "sub_chapter_num" ] ;
			$this->chapterDetail[ "chapterName"      ] = $meta[ "chapter_name"    ] ;

			$this->numCards = $meta[ "num_cards" ] ;
			$this->num_VE   = $meta[ "num_VE"   ] ;
			$this->num_E    = $meta[ "num_E"    ] ;
			$this->num_M    = $meta[ "num_M"    ] ;
			$this->num_H    = $meta[ "num_H"    ] ;
			$this->num_VH   = $meta[ "num_VH"    ] ;
		}
	}
}

?>