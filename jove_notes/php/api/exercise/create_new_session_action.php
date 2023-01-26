<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/exercise_session_dao.php" ) ;

/**
 * @input [Request Body] 
 *           chapterIds = <Array of chapters associated with this exercise session>
 *
 * @response
 *    {
 *        'sessionId' : <int, learning session id>,
 *        'exChapterSessionIdMap' : {
 *            '<chapter id>' : <learning session id for chapter>,
 *            ...
 *        }
 *    }
 */
class CreateNewSessionAction extends APIAction {

    private $esDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->esDAO = new ExerciseSessionDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing CreateNewSessionAction" ) ;

        $chapterIds = $request->requestBody->chapterIds ;
        
        if( empty( $chapterIds ) ) {
            $response->responseBody = "No chapters specified. Can't create session" ;
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
        }
        else {
            $sessionIds = $this->esDAO->createNewSession( 
                                         ExecutionContext::getCurrentUserName(), 
                                         $chapterIds ) ;

            $response->responseBody = $sessionIds ;
            $response->responseCode = APIResponse::SC_OK ;
        }
    }
}
?>
