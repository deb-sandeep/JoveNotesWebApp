<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/student_score_dao.php" ) ;

class PointsAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;
	private $scoreDAO   = null ;

	function __construct() {
		parent::__construct() ;
		$this->scoreDAO      = new StudentScoreDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in PointsAPI" ) ;

		$this->requestObj = $request->requestBody ;
		$this->logger->debug( "Request parameters " . json_encode( $this->requestObj ) ) ;

		if( $this->isPassswordValid( $this->requestObj->password ) ) {

			$this->scoreDAO->addPoints( ExecutionContext::getCurrentUserName(),
										$this->requestObj->subject, 
				                        $this->requestObj->points,
				                        $this->requestObj->notes ) ;

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