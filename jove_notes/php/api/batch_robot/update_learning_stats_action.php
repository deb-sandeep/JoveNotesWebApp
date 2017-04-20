<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/learning_session_dao.php" ) ;

/**
 * @input [Request Body] 
 *           chapterId
 *           studentName
 *
 * @response
 *           Success
 */
class UpdateLearningStatsAction extends APIAction {

    private $lsDAO  = null ;

    function __construct() {
        parent::__construct() ;
        $this->lsDAO  = new LearningSessionDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing CreateNewSessionAction" ) ;

        $chapterId   = $request->requestBody->chapterId ;
        $studentName = $request->requestBody->studentName ;

        if( $chapterId == NULL ) {
            $response->responseBody = "chapterId not specified." ;
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
        }
        else if( $studentName == NULL ) {
            $response->responseBody = "studentName not specified." ;
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
        }
        else {
            $this->lsDAO->refreshProgressSnapshotOfLatestSession( $studentName, 
                                                                  $chapterId ) ;
            $response->responseCode = APIResponse::SC_OK ;
            $response->responseBody = "Success" ;
        }
    }
}
?>
