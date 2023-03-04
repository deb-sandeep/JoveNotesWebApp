<?php
require_once( APP_ROOT  . "/php/dao/exercise_session_dao.php" ) ;

/**
 * @input [Request Path]
 *      [0] = Session ID
 *
 * @input [Request Body]. The request can contain one or more of the attributes
 * specified in the example below.
 *
 * {
 *      'completed'      : <0 or 1>,
 *      'totalSolveTime' : <int>,
 *      'pauseTime'      : <int>,
 *      'reviewTime'     : <int>,
 *      'studyTime'      : <int>,
 *      'totalQuestions' : <int>,
 *      'numCorrect'     : <int>,
 *      'totalMarks'     : <int>
 * }
 *
 * @response. The updated complete record of the session
 *
 */
class UpdateExerciseSessionAction extends APIAction {

    private $esDAO = null ;

    function __construct( $logger ) {
        parent::__construct() ;
        $this->logger = $logger ;
        $this->esDAO = new ExerciseSessionDAO() ;
        $this->logger->debug( "Created UpdateExerciseSessionAction." ) ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing UpdateExerciseSessionAction" ) ;

        $sessionId  = $request->requestPathComponents[1] ;

        $this->logger->debug( "  Session ID  = $sessionId" ) ;

        $existingRecord = (object)$this->esDAO->getSession( $sessionId ) ;
        $updateInfo = $request->requestBody ;

        if( property_exists( $updateInfo, "completed" ) ) {
            $existingRecord->completed = $updateInfo->completed ;
            $this->logger->debug( "  completed = $existingRecord->completed" ) ;
        }
        if( property_exists( $updateInfo, "totalSolveTime" ) ) {
            $existingRecord->totalSolveTime = round($updateInfo->totalSolveTime) ;
            $this->logger->debug( "  totalSolveTime = $existingRecord->totalSolveTime" ) ;
        }
        if( property_exists( $updateInfo, "pauseTime" ) ) {
            $existingRecord->pauseTime = round($updateInfo->pauseTime) ;
            $this->logger->debug( "  pauseTime = $existingRecord->pauseTime" ) ;
        }
        if( property_exists( $updateInfo, "reviewTime" ) ) {
            $existingRecord->reviewTime = round($updateInfo->reviewTime) ;
            $this->logger->debug( "  reviewTime = $existingRecord->reviewTime" ) ;
        }
        if( property_exists( $updateInfo, "studyTime" ) ) {
            $existingRecord->studyTime = round($updateInfo->studyTime) ;
            $this->logger->debug( "  studyTime = $existingRecord->studyTime" ) ;
        }
        if( property_exists( $updateInfo, "totalQuestions" ) ) {
            $existingRecord->totalQuestions = $updateInfo->totalQuestions ;
            $this->logger->debug( "  totalQuestions = $existingRecord->totalQuestions" ) ;
        }
        if( property_exists( $updateInfo, "numCorrect" ) ) {
            $existingRecord->numCorrect = $updateInfo->numCorrect ;
            $this->logger->debug( "  numCorrect = $existingRecord->numCorrect" ) ;
        }
        if( property_exists( $updateInfo, "totalMarks" ) ) {
            $existingRecord->totalMarks = $updateInfo->totalMarks ;
            $this->logger->debug( "  totalMarks = $existingRecord->totalMarks" ) ;
        }

        $this->esDAO->updateSession( $existingRecord ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $existingRecord ;
    }
}
?>
