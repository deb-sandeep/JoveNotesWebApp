<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/api/api.php" ) ;

class ChapterNotesAPI extends API {

	function __construct() {
		parent::__construct() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ChapterNotesAPI" ) ;
		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = file_get_contents( DOCUMENT_ROOT . 
			          "/apps/jove_notes/api_test_data/chapter_notes.json" ) ;
	}
}

?>