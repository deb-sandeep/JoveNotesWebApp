<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/points_redemption_dao.php" ) ;
require_once( APP_ROOT  . "/php/dao/student_score_dao.php" ) ;

class RedeemPointsAction extends APIAction {

    private $redemptionDAO = null ;
    private $studentScoreDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->redemptionDAO = new PointsRedemptionDAO() ;
        $this->studentScoreDAO = new StudentScoreDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing RedeemPointsAction" ) ;

        $userName = ExecutionContext::getCurrentUserName() ;
        $itemName = $request->requestBody->itemName ;
        $numUnits = $request->requestBody->numUnits ;
        $points   = $request->requestBody->points ;

        $this->logger->debug( "    itemName = " . $itemName ) ;
        $this->logger->debug( "    numUnits = " . $numUnits ) ;
        $this->logger->debug( "    points   = " . $points ) ;

        $this->redemptionDAO->saveRedemption( $userName, $points, $itemName, $numUnits ) ;
        $this->studentScoreDAO->updateTotalPoints( $userName, -1*$points ) ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = null ;
    }
}
?>
