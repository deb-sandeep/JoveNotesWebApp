<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/create_exercise_question_map_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/update_exercise_question_map_action.php" ) ;
require_once( APP_ROOT      . "/php/dao/exercise_question_dao.php" ) ;

class ExerciseQuestionAPI extends AbstractJoveNotesAPI {

    private $eqDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
        $this->eqDAO = new ExerciseQuestionDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ". __CLASS__ ) ;

        $action = NULL ;
        if( count($request->requestPathComponents) == 0 ) {
            $action = new CreateExerciseQuestionMapAction( $this->logger ) ;
        }
        elseif ( count($request->requestPathComponents) == 2 ) {
            $action = new UpdateExerciseQuestionMapAction( $this->logger ) ;
        }

        if( $action == NULL ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Could not associate request to a " .
                                      "server action. ExerciseQuestion" ;
        }
        else {
            $action->execute( $request, $response ) ;
        }
	}

    public function doGet( $request, &$response ) {

        $this->logger->debug( "Executing doGet in " . __CLASS__ ) ;

        if( count( $request->requestPathComponents ) == 2 ) {
            $sessionId = $request->getPathComponent( 0 ) ;
            $questionId= $request->getPathComponent( 1 ) ;

            $this->logger->debug( "  Session id $sessionId, questionId $questionId" ) ;

            $exQMapping= $this->eqDAO->getMapping( $sessionId, $questionId ) ;

            $response->responseCode = APIResponse::SC_OK ;
            $response->responseBody = $exQMapping ;
        }
        elseif( count( $request->requestPathComponents ) == 1 ) {

            $sessionId = $request->getPathComponent( 0 ) ;

            $this->logger->debug( "  Session id $sessionId" ) ;

            $allMappings = $this->eqDAO->getAllMappingsForSession( $sessionId ) ;

            $response->responseCode = APIResponse::SC_OK ;
            $response->responseBody = $allMappings ;
        }
        else {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Invalid request. Session id missing." ;
        }
    }
}
?>