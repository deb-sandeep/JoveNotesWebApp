<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/api/api.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/utils/execution_context.php" ) ;

class GreetingsAPI extends API {

	function __construct() {
		parent::__construct() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in GreetingsAPI" ) ;
		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = array( "message" => "Hello " . 
			                             $request->requestBody->{ "name" } . 
			                             " from " . ExecutionContext::getCurrentUserName() ) ;
	}
}

?>