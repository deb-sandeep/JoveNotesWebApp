<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/calendar_event_dao.php" ) ;

/**
 * @input [Request Body] 
 *           nothing
 *
 * @response
 *    [{ 
 *      'type'          : 'Exam' ;
 *      'subject'       : 'Literature' ;
 *      'title'         : 'English Literature' ;
 *      'startsAt'      : new Date(2017,3,6) ;
 *      'color.primary' : '#e3bc08' ;
 *    },{ 
 *      'type'          : 'General' ;
 *      'subject'       : null ;
 *      'title'         : 'Some reminder' ;
 *      'startsAt'      : new Date(2017,3,7) ;
 *      'color.primary' : '#e3bc09' ;
 *    }]
 */
class GetCalendarDataAction extends APIAction {

    private $ceDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->ceDAO = new CalendarEventDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing GetCalendarDataAction" ) ;

        $userName = ExecutionContext::getCurrentUserName() ;
        $retVal = array() ;

        $retVal[ 'possibleSubjects' ] = $this->ceDAO->getPossibleSubjects( $userName ) ;
        $retVal[ 'events' ]           = $this->ceDAO->getAllEvents( $userName ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $retVal ;
    }
}
?>
