<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/exercise_question_dao.php" ) ;

/**
 * @input [Request Body]
 *  sessionId = int. The identifier for the exercise session
 *  questionIds = [int]. Array of question included in this exercise
 *
 * @response
 * [{
 *    'questionId' : <int>,
 *    'exMappingId' : <int>
 * },
 * ...
 * ]
 */
class CreateExerciseQuestionMapAction extends APIAction {

    private $eqDAO = null ;

    function __construct( $logger ) {
        parent::__construct() ;
        $this->logger = $logger ;
        $this->eqDAO = new ExerciseQuestionDAO() ;
        $this->logger->debug( "Created CreateExerciseQuestionMapAction." ) ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing CreateExerciseQuestionMapAction" ) ;

        $sessionId = $request->requestBody->sessionId ;
        $questionIds = $request->requestBody->questionIds ;

        // An associative array which keeps mappings of question id to
        // exercise question mapping ids.
        $retVal = array() ;

        foreach( $questionIds as $qId ) {

            $this->logger->debug( "Question id = " . $qId ) ;

            $qMappingId = $this->eqDAO->createMapping( $sessionId, $qId ) ;
            $this->logger->debug( "Mapping id = " . $qMappingId ) ;

            $mapping = array() ;
            $mapping[ 'questionId' ] = $qId ;
            $mapping[ 'exMappingId'] = $qMappingId ;

            $retVal[] = $mapping;
        }

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $retVal ;
    }
}
?>
