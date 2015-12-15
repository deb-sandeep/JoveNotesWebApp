<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;

class ResetLevelAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $clsDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->clsDAO = new CardLearningSummaryDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in ResetLevelAPI" ) ;

		$this->requestObj = $request->requestBody ;

		foreach( $this->requestObj->chapterIds as $chapterId ) {
			if( $this->isUserEntitledForFlashCards( $chapterId ) ) {

				$this->clsDAO->resetLevelOfAllCards(
										ExecutionContext::getCurrentUserName(), 
										$chapterId,
										$this->requestObj->level ) ;
			}
		}

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = "Success" ;
	}
}

?>