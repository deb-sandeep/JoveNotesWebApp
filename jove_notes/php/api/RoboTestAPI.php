<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/api/api.php" ) ;

class RoboTestAPI extends API {

    function __construct() {
        parent::__construct() ;
    }

    // -------------------------------------------------------------------------
    // GET request processing
    // -------------------------------------------------------------------------
    public function doGet( $request, &$response ) {

        $this->logger->debug( "Executing doGet in UserPreferenceAPI" ) ;
        $this->checkAuthorization() ;
        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = "GET Response from dummy API. User is a JN_BATCH_ROBOT" ;
    }

    // -------------------------------------------------------------------------
    // POST request processing
    // -------------------------------------------------------------------------
    public function doPost( $request, &$response ) {

        $this->logger->debug( "Executing doPost in UserPreferenceAPI" ) ;
        $this->checkAuthorization() ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = "POST Response from dummy API" ;
    }

    // -------------------------------------------------------------------------
    // PUT request processing
    // -------------------------------------------------------------------------
    public function doPut( $request, &$response ) {

        $this->logger->debug( "Executing doPut in UserPreferenceAPI" ) ;
        $this->checkAuthorization() ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = "PUT Response from dummy API" ;
    }

    // -------------------------------------------------------------------------
    // DELETE request processing
    // -------------------------------------------------------------------------
    public function doDelete( $request, &$response ) {

        $this->logger->debug( "Executing doDelete in UserPreferenceAPI" ) ;
        $this->checkAuthorization() ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = "DELETE Response from dummy API" ;
    }

    // -------------------------------------------------------------------------
    private function checkAuthorization() {
        if( !Authorizer::isUserInRole( "JN_BATCH_ROBOT" ) ) {
            throw new Exception( "User is not a JoveNotes batch robot." ) ;        
        }
    }
}

?>