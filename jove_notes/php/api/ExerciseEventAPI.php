<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/exercise_event_dao.php" ) ;

class ExerciseEventAPI extends AbstractJoveNotesAPI {

    private $eeDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
        $this->eeDAO = new ExerciseEventDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ". __CLASS__ ) ;

        // {
        //     'exerciseId' : $scope.exerciseSessionId,
        //     'timestamp'  : Date.now(),
        //     'phaseName'  : phaseName,
        //     'eventName'  : eventName,
        //     'eventType'  : eventType,
        //     'questionId' : questionId
        // }
        $event = $request->requestBody ;

        $responseBody = array() ;

        if( $event == NULL ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $responseBody[ "message" ] = "ERROR: ExerciseEvent object not found in request." ;
        }
        else {
            $pk = $this->eeDAO->saveEvent( $event ) ;
            $response->responseCode = APIResponse::SC_OK ;
            $responseBody[ "message" ] = "Success" ;
        }
        $response->responseBody = $responseBody ;
	}

    public function doGet( $request, &$response ) {

        $this->logger->debug( "Executing doGet in " . __CLASS__ ) ;

        $responseBody = array() ;

        if( count( $request->requestPathComponents ) == 1 ) {

            $exerciseId = $request->getPathComponent( 0 ) ;
            $this->logger->debug( "  Session id $exerciseId" ) ;

            $allEvents = $this->eeDAO->getEventsForExercise( $exerciseId ) ;

            $response->responseCode = APIResponse::SC_OK ;
            $responseBody[ "message"    ] = "Success" ;
            $responseBody[ "exerciseId" ] = $exerciseId ;
            $responseBody[ "events"     ] = $allEvents ;
        }
        else {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $responseBody[ "message" ] = "ERROR: Invalid request. Session id missing." ;
        }

        $response->responseBody = $responseBody ;
    }
}
?>