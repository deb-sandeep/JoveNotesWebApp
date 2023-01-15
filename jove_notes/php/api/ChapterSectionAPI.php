<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;

class ChapterSectionAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $chapDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->logger  = Logger::getLogger( __CLASS__ ) ;
		$this->chapDAO = new ChapterDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->info( "Executing doPost in ChapterSectionAPI" ) ;

		$chapterId = $request->requestPathComponents[0] ;

		if( $this->isUserEntitledForNotes( $chapterId ) ) {
			$this->logger->warn( "Updating sections visibility for chapter = " . $chapterId ) ;

			$sections = $request->requestBody ;
	        for( $i=0; $i<count($sections); $i++ ) {
	            $section = $sections[$i] ;
	            $this->logger->debug( "  - " . $section->section . " - " . $section->selected ) ;
	            $this->chapDAO->updateChapterSection( $chapterId, $section->section, $section->selected ) ;
	        }

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "Success" ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "pdate chapter sections API" ;
		}
	}
}

?>