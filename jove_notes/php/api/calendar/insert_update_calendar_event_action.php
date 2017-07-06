<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/calendar_event_dao.php" ) ;

class InsertUpdateCalendarEventAction extends APIAction {

    private $ceDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->ceDAO = new CalendarEventDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing InsertUpdateCalendarEventAction" ) ;

        $userName   = ExecutionContext::getCurrentUserName() ;
        $requestObj = $request->requestBody ;
        $retVal     = array() ;

        if( $requestObj->id == -1 ) {
            $id = $this->ceDAO->insert( $userName, $requestObj ) ;
            array_push( $retVal, $id ) ;
        }
        else {
            $this->ceDAO->update( $userName, $requestObj ) ;
            array_push( $retVal, $requestObj->id ) ;
        }

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $retVal ;
    }
}
?>
