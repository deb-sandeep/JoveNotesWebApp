<?php
require_once( APP_ROOT  . "/php/dao/exercise_session_dao.php" ) ;

/**
 * This action gets the exercise sessions and returns them either as an object
 * (if a specific session is requested) or all the completed sessions (in case
 * session is -1).
 */
class GetExerciseSessionAction extends APIAction {

    private $sessionId = null ;
    private $esDAO = null ;

    function __construct( $sessionId, $logger ) {
        parent::__construct() ;
        $this->sessionId = $sessionId ;
        $this->esDAO = new ExerciseSessionDAO() ;
        $this->logger = $logger ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing GetExerciseSessionAction" ) ;

        $retVal = ( $this->sessionId == -1 ) ?
                    $this->esDAO->getAllCompletedSessions() :
                    $this->esDAO->getSession( $this->sessionId ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $retVal ;
    }
}
?>
