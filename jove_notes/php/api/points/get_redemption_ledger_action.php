<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/student_score_dao.php" ) ;

class GetRedemptionLedgerAction extends APIAction {

    private $studentScoreDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->studentScoreDAO = new StudentScoreDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing GetRedemptionLedgerAction" ) ;

        $userName = ExecutionContext::getCurrentUserName() ;
        $startDate = $request->parametersMap[ 'startDate' ] ;
        $endDate = $request->parametersMap[ 'endDate' ] ;

        $responseBody = array() ;
        $responseBody[ "points"  ] = $this->studentScoreDAO->getScore( $userName ) ;
        $responseBody[ "entries" ] = $this->studentScoreDAO->getScoreLedger( 
                                     $userName, $startDate, $endDate ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $responseBody ;
    }
}
?>
