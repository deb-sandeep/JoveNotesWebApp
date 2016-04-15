<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/exercise_hom_dao.php" ) ;

class HOMAPI extends AbstractJoveNotesAPI {

	private $homDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->homDAO  = new ExerciseHOMDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in HOMAPI" ) ;

		$this->homDAO->insertHOMAttributes( ExecutionContext::getCurrentUserName(), 
			                                $request->requestBody->cardId,
			                                $request->requestBody->sessionId,
			                                $request->requestBody->homAttributes ) ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = "Success" ;
	}
}

?>