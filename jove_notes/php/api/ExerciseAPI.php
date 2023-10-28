<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/get_exercise_banks_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/get_exercise_session_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/create_new_session_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/update_exercise_session_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/promote_exercise_question_action.php" ) ;

class ExerciseAPI extends AbstractJoveNotesAPI {

    protected $logger = null ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ExerciseAPI" ) ;

		$action     = NULL ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "POST Request is for entity '$entityName'" ) ;
		if( $entityName == 'NewSession' ) {
			$action = new CreateNewSessionAction() ;
		}
        elseif( $entityName == 'PromoteCard' ) {
            $action = new PromoteExerciseQuestionAction( $this->logger ) ;
        }
        elseif( $entityName == 'UpdateSession' ) {
            $action = new UpdateExerciseSessionAction( $this->logger ) ;
        }
		
		if( $action == NULL ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Could not associate request to a " .
                                      "server action. $entityName" ;
		}
		else {
			$action->execute( $request, $response ) ;
		}
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ExerciseAPI" ) ;

		$action     = NULL ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "GET Request is for entity '$entityName'" ) ;
		if( $entityName == 'ExerciseBanks' ) {
			$action = new GetExerciseBanksAction() ;
		}
        elseif( $entityName == 'ExerciseSession' ) {
            $sessionId = -1 ;
            if( count( $request->requestPathComponents ) == 2 ) {
                $sessionId = $request->getPathComponent( 1 ) ;
            }
            $action = new GetExerciseSessionAction( $sessionId, $this->logger ) ;
        }
		
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