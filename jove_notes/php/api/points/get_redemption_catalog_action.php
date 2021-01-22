<?php
require_once( APP_ROOT  . "/php/api/service/practice_card_service.php" ) ;
require_once( APP_ROOT  . "/php/dao/student_score_dao.php" ) ;
require_once( APP_ROOT  . "/php/dao/points_redemption_dao.php" ) ;

class GetRedemptionCatalogAction extends APIAction {

    private $redemptionDAO = null ;
    private $studentScoreDAO = null ;

    function __construct() {
        parent::__construct() ;
        $this->redemptionDAO = new PointsRedemptionDAO() ;
        $this->studentScoreDAO = new StudentScoreDAO() ;
    }

    public function execute( $request, &$response ) {

        $this->logger->debug( "Executing GetRedemptionCatalogAction" ) ;

        $userName = ExecutionContext::getCurrentUserName() ;

        $currentPoints = $this->studentScoreDAO->getScore( $userName ) ;
        $catalogEntries = $this->createCatalogEntries( $userName ) ;

        $responseBody = array() ;
        $responseBody[ "points" ] = $currentPoints ;
        $responseBody[ "catalog"] = $catalogEntries ;

        $response->responseCode = APIResponse::SC_OK ;
        $response->responseBody = $responseBody ;
    }

    private function createCatalogEntries( $userName ) {

        $response = array() ;
        $resultSet = $this->redemptionDAO->getRedemptionCatalog( $userName ) ;

        foreach( $resultSet as $tupule ) {

            $element = array() ;

            $element[ "itemName"                 ] = $tupule[ "item_name" ] ;
            $element[ "pointsPerItem"            ] = $tupule[ "points_per_item" ] ;
            $element[ "multipleUnitsAllowed"     ] = $tupule[ "multiple_units_allowed" ] ;
            $element[ "numRedemptionsPerDay"     ] = $tupule[ "num_redemptions_per_day" ] ;
            $element[ "totalRedeemedQtyToday"    ] = $tupule[ "total_redeemed_qty_today" ] ;
            $element[ "totalPointsRedeemedToday" ] = $tupule[ "total_points_redeemed_today" ] ;

            if( $element[ "totalRedeemedQtyToday" ] == null ) {
                $element[ "totalRedeemedQtyToday" ] = 0 ;
            }

            if( $element[ "totalPointsRedeemedToday" ] == null ) {
                $element[ "totalPointsRedeemedToday" ] = 0 ;
            }

            array_push( $response, $element ) ;
        }

        return $response ;
    }
}
?>
