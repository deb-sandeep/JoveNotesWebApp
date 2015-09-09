<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/chapter_dao.php" ) ;

class ChapterAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $chapDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->chapDAO = new ChapterDAO() ;
	}

	public function doDelete( $request, &$response ) {

		$this->logger->debug( "Executing doDelete in ChapterAPI" ) ;

		$chapterId = $request->requestPathComponents[0] ;

		if( $this->isUserEntitledForDelete( $chapterId ) ) {
			$this->logger->warn( "Deleting chapter id = " . $chapterId ) ;

			$this->chapDAO->deleteChapter( $chapterId ) ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "Success" ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "ResetLevel API" ;
		}
	}
}

?>