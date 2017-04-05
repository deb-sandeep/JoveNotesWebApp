<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/api_bootstrap.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/calendar/get_calendar_data_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/calendar/insert_update_calendar_event_action.php" ) ;

class CalendarAPI extends API {

	function __construct() {
		parent::__construct() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in CalendarAPI" ) ;

		$eventId = $request->getPathComponent( 0 ) ;
		$action  = NULL ;

		if( $eventId == NULL ) {
			$action = new GetCalendarDataAction() ;
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

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in CalendarAPI" ) ;

		$eventId = $request->getPathComponent( 0 ) ;
		$action  = NULL ;

		if( $eventId == NULL ) {
			$action = new InsertUpdateCalendarEventAction() ;
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

	public function doDelete( $request, &$response ) {

		$this->logger->debug( "Executing doPost in CalendarAPI" ) ;

		$eventId = $request->getPathComponent( 0 ) ;
		$action  = NULL ;

		if( $eventId == NULL ) {
            $response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
            $response->responseBody = "Could not associate request to a " .
                                      "server action. $entityName" ;
		}
		else {
			$dao = new CalendarEventDAO() ;
			$dao->delete( $eventId ) ;
	        $response->responseCode = APIResponse::SC_OK ;
	        $response->responseBody = "Successfully deleted" ;
		}
	}
}

?>