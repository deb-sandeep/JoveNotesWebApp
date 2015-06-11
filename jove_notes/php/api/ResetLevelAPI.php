<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;

class ResetLevelAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $clsDAO = null ;
	private $lsDAO  = null ;

	function __construct() {
		parent::__construct() ;
		$this->clsDAO = new CardLearningSummaryDAO() ;
		$this->lsDAO = new LearningSessionDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ResetLevelAPI" ) ;

		$this->requestObj = $request->requestBody ;
		$this->logger->debug( "Request parameters " . json_encode( $this->requestObj ) ) ;

		if( $this->isUserEntitledForFlashCards( $this->requestObj->chapterId ) ) {

			$this->clsDAO->resetLevelOfAllCards(
										ExecutionContext::getCurrentUserName(), 
										$this->requestObj->chapterId,
										$this->requestObj->level ) ;

			$sessionId = $this->lsDAO->createNewSession( 
										ExecutionContext::getCurrentUserName(), 
										$this->requestObj->chapterId ) ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = array( 
				"sessionId" => $sessionId
			) ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "ResetLevel API" ;
		}

	}
}

?>