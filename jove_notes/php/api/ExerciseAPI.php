<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/get_exercise_banks_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/exercise/create_new_session_action.php" ) ;

class ExerciseAPI extends AbstractJoveNotesAPI {

	function __construct() {
		parent::__construct() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ExerciseAPI" ) ;

		$action     = NULL ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "POST Request is for entity '$entityName'" ) ;
		if( $entityName == 'NewSession' ) {
			$action = new CreateNewSessionAction() ;
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