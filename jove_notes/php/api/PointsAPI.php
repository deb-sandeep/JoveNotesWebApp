<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/points/get_redemption_catalog_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/points/get_redemption_ledger_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/points/redeem_points_action.php" ) ;

class PointsAPI extends AbstractJoveNotesAPI {

	function __construct() {
		parent::__construct() ;
	}

	/** 
	 * API endpoints 
	 *
	 * /jove_notes/api/Points/RedemptionCatalog
	 *     Gets the redemption catalog items which are valid at this point
	 *     in time.
	 *
	 * /jove_notes/api/Points/RedemptionLedger?
	 *     startDate=2021-01-10 00:00:00&
	 *     endDate=2021-01-22 00:00:00
	 *
	 *     Gets the redemption ledger items for the current user limited to 
	 *     the time period mentioned
	 */
	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in PointsAPI" ) ;

		$action     = NULL ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "GET Request is for entity '$entityName'" ) ;
		if( $entityName == 'RedemptionCatalog' ) {
			$action = new GetRedemptionCatalogAction() ;
		}
		else if( $entityName == 'RedemptionLedger' ) {
			$action = new GetRedemptionLedgerAction() ;
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

	/** 
	 * API endpoints 
	 *
	 * /jove_notes/api/Points/Redeem
	 *     itemName = Name of the redemption item
	 *     numUnits = Number of units
	 */
	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in PointsAPI" ) ;

		$action     = NULL ;
		$entityName = $request->getPathComponent( 0 ) ;

		$this->logger->debug( "POST Request is for entity '$entityName'" ) ;
		if( $entityName == 'Redeem' ) {
			$action = new RedeemPointsAction() ;
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