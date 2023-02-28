<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/exercise_question_dao.php" ) ;

/**
 * @input [Request Path]
 *      [0] = Session ID
 *      [1] = Question ID
 * @input [Request Body]. The request can contain one or more of the attributes
 * specified in the example below.
 * {
 *      "totalTimeTaken": 30,
 *      "studyTime": 25,
 *      "reviewTime": 10,
 *      "result": "E",
 *      "marksObtained": 20
 * }
 * @response. The updated mapping record.
 * {
 *      "exerciseId": 700,
 *      "questionId": 63826,
 *      "totalTimeTaken": 30,
 *      "studyTime": 25,
 *      "reviewTime": 10,
 *      "result": "E",
 *      "marksObtained": 20
 * }
 */
class UpdateExerciseQuestionMapAction extends APIAction {

    private $eqDAO = null ;

    function __construct( $logger ) {
        parent::__construct() ;
        $this->logger = $logger ;
        $this->eqDAO = new ExerciseQuestionDAO() ;
        $this->logger->debug( "Created UpdateExerciseQuestionMapAction." ) ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing UpdateExerciseQuestionMapAction" ) ;

        $sessionId  = $request->requestPathComponents[0] ;
        $questionId = $request->requestPathComponents[1] ;

        $this->logger->debug( "  Session ID  = $sessionId" ) ;
        $this->logger->debug( "  Question ID = $questionId" ) ;

        $existingMapping = (object)$this->eqDAO->getMapping( $sessionId, $questionId ) ;
        $updateInfo = $request->requestBody ;

        if( property_exists( $updateInfo, "totalTimeTaken" ) ) {
            $existingMapping->totalTimeTaken = $updateInfo->totalTimeTaken ;
            $this->logger->debug( "  totalTimeTaken = $existingMapping->totalTimeTaken" ) ;
        }
        if( property_exists( $updateInfo, "numAttempts" ) ) {
            $existingMapping->numAttempts = $updateInfo->numAttempts ;
            $this->logger->debug( "  numAttempts = $existingMapping->numAttempts" ) ;
        }
        if( property_exists( $updateInfo, "studyTime" ) ) {
            $existingMapping->studyTime = $updateInfo->studyTime ;
            $this->logger->debug( "  studyTime = $existingMapping->studyTime" ) ;
        }
        if( property_exists( $updateInfo, "attemptTime" ) ) {
            $existingMapping->attemptTime = $updateInfo->attemptTime ;
            $this->logger->debug( "  attemptTime = $existingMapping->attemptTime" ) ;
        }
        if( property_exists( $updateInfo, "reviewTime" ) ) {
            $existingMapping->reviewTime = $updateInfo->reviewTime ;
            $this->logger->debug( "  reviewTime = $existingMapping->reviewTime" ) ;
        }
        if( property_exists( $updateInfo, "pauseTime" ) ) {
            $existingMapping->pauseTime = $updateInfo->pauseTime ;
            $this->logger->debug( "  pauseTime = $existingMapping->pauseTime" ) ;
        }
        if( property_exists( $updateInfo, "marksObtained" ) ) {
            $existingMapping->marksObtained = $updateInfo->marksObtained ;
            $this->logger->debug( "  marksObtained = $existingMapping->marksObtained");
        }
        if( property_exists( $updateInfo, "result" ) ) {
            $existingMapping->result = is_null( $updateInfo->result ) ?
                "" : $updateInfo->result ;
            $this->logger->debug( "  result = $existingMapping->result" ) ;
        }

        $this->eqDAO->updateMapping( $sessionId, $questionId, $existingMapping ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $existingMapping ;
    }
}
?>
