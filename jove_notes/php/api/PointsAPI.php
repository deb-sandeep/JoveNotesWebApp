<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/student_score_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/points/get_redemption_catalog_action.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/points/get_redemption_ledger_action.php" ) ;

class PointsAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;
	private $scoreDAO   = null ;

	function __construct() {
		parent::__construct() ;
		$this->scoreDAO      = new StudentScoreDAO() ;
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
	 *.    endDate=2021-01-22 00:00:00
	 *
	 *     Gets the redemption ledger items which are valid at this point
	 *     in time.
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

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in PointsAPI" ) ;

		$this->requestObj = $request->requestBody ;
		$this->logger->debug( "Request parameters " . json_encode( $this->requestObj ) ) ;

		if( $this->isPassswordValid( $this->requestObj->password ) ) {

			for( $i = 0; $i < $this->requestObj->numTimes; $i++ ) {
				$this->scoreDAO->addPoints( ExecutionContext::getCurrentUserName(),
											$this->requestObj->subject, 
					                        $this->requestObj->points,
					                        $this->requestObj->notes ) ;
			}

			$response->responseCode = APIResponse::SC_OK ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "Incorrect password" ;
		}
	}

	private function isPassswordValid( $password ) {
		// TODO: Temporary. Needs to be made secure.
		return $password == "2314" ;
	}
}

?>