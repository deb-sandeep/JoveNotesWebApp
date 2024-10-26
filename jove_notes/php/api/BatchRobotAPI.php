<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/api/api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/batch_robot/update_learning_stats_action.php" ) ;

class BatchRobotAPI extends API {

    function __construct() {
        parent::__construct() ;
    }

    // -------------------------------------------------------------------------
    // GET request processing
    // -------------------------------------------------------------------------
    public function doGet( $request, &$response ) {

        $this->logger->debug( "Executing doGet in BatchRobotAPI" ) ;
        $this->checkAuthorization() ;
        $response->responseCode = APIResponse::SC_ERR_NOT_IMPLEMENTED ;
        $response->responseBody = "Not implemented" ;
    }

    // -------------------------------------------------------------------------
    // POST request processing
    // -------------------------------------------------------------------------
    public function doPost( $request, &$response ) {

        $this->logger->debug( "Executing doPost in " ) ;
        $this->checkAuthorization() ;

        $action     = NULL ;
        $entityName = $request->getPathComponent( 0 ) ;

        $this->logger->info( "POST Request is for entity '$entityName'" ) ;
        if( $entityName == 'UpdateLearningStats' ) {
            $action = new UpdateLearningStatsAction() ;
        }        

        $this->executeAction( $action, $request, $response ) ;        
    }

    // -------------------------------------------------------------------------
    // PUT request processing
    // -------------------------------------------------------------------------
    public function doPut( $request, &$response ) {

        $this->logger->debug( "Executing doPut in BatchRobotAPI" ) ;
        $this->checkAuthorization() ;

        $response->responseCode = APIResponse::SC_ERR_NOT_IMPLEMENTED ;
        $response->responseBody = "Not implemented" ;
    }

    // -------------------------------------------------------------------------
    // DELETE request processing
    // -------------------------------------------------------------------------
    public function doDelete( $request, &$response ) {

        $this->logger->debug( "Executing doDelete in BatchRobotAPI" ) ;
        $this->checkAuthorization() ;

        $response->responseCode = APIResponse::SC_ERR_NOT_IMPLEMENTED ;
        $response->responseBody = "Not implemented" ;
    }

    // -------------------------------------------------------------------------
    private function checkAuthorization() {
        if( !Authorizer::isUserInRole( "JN_BATCH_ROBOT" ) ) {
            throw new Exception( "User is not a JoveNotes batch robot." ) ;        
        }
    }

    private function executeAction( $action, $request, &$response ) {

        if( $action == NULL ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Could not associate request to a " .
                                      "server action. $entityName" ;
        }
        else {
            $action->execute( $request, $response ) ;
        }
    }
}

?>