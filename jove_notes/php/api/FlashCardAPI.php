<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/api/service/practice_card_service.php" ) ;

class FlashCardAPI extends AbstractJoveNotesAPI {

	function __construct() {
		parent::__construct() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in FlashCardAPI" ) ;

		$this->chapterId = $request->requestPathComponents[0] ;
		if( $this->isUserEntitledForFlashCards( $this->chapterId ) ) {

			$pcSvc = new PracticeCardService() ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $pcSvc->getPracticeCardDetailsForChapter( $this->chapterId ) ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "FlashCard for chapter " . 
			                          $request->requestPathComponents[0] ;
		}
	}
}

?>