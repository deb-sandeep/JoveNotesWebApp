<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/learning_session_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/card_learning_summary_dao.php" ) ;

/**
 * @input [Request Body]. The request can contain one or more of the attributes
 * specified in the example below.
 *
 * {
 *      'cardId'         : <int>,
 *      'chapterId'      : <int>
 * }
 */
class PromoteExerciseQuestionAction extends APIAction {

    private $clsDAO = null ;
    private $lsDAO = null ;

    function __construct( $logger ) {
        parent::__construct() ;
        $this->logger = $logger ;
        $this->lsDAO = new LearningSessionDAO() ;
        $this->clsDAO = new CardLearningSummaryDAO() ;

        $this->logger->debug( "Created PromoteExerciseQuestionAction." ) ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing PromoteExerciseQuestionAction" ) ;

        $updateInfo = $request->requestBody ;
        if( $updateInfo == null ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Missing request post body." ;
        }
        elseif( !property_exists( $updateInfo, "cardId" ) ||
                !property_exists( $updateInfo, "chapterId" ) ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Missing cardId or chapterId in request body" ;
        }
        else {
            $cardId = $updateInfo->cardId ;
            $chapterId = $updateInfo->chapterId ;
            $userId = ExecutionContext::getCurrentUserName() ;

            $this->logger->debug( "  Promoting card = $cardId for user = $userId" ) ;

            $this->clsDAO->promoteCardToMAS( $userId, $cardId ) ;
            $this->lsDAO->refreshProgressSnapshotOfLatestSession( $userId, $chapterId ) ;

            $response->responseCode = APIResponse::SC_OK ;
            $response->responseBody = "Card promoted." ;
        }
    }
}
?>
