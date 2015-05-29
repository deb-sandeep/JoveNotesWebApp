<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/remote_flash_queue_dao.php" ) ;

class RemoteFlashMessageAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;

	private $queueDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->queueDAO = new RemoteFlashQueueDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in RemoteFlashMessageAPI" ) ;

		$this->requestObj = $request->requestBody ;
		$this->logger->debug( "Request parameters " . json_encode( $this->requestObj ) ) ;

		if( $this->isUserEntitledForFlashCards( $this->requestObj->chapterId ) ) {

			$this->queueDAO->addMessage( ExecutionContext::getCurrentUserName(), 
				                         $this->requestObj->msgType,
				                         $this->requestObj->msgContent ) ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = array() ;
		}
	}
}

?>