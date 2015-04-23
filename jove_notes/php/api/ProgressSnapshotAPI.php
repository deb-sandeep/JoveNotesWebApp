<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/api/api.php" ) ;

class ProgressSnapshotAPI extends API {

	function __construct() {
		parent::__construct() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ProgressSnapshotAPI" ) ;
		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = file_get_contents( DOCUMENT_ROOT . 
			          "/apps/jove_notes/api_test_data/progress_snapshot.json" ) ;
	}
}

?>