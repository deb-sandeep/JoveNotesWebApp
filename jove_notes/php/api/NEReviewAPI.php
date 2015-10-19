<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/notes_element_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_dao.php" ) ;

class NEReviewAPI extends AbstractJoveNotesAPI {

	private $neDAO = null ;
	private $cardDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->neDAO = new NotesElementDAO() ;
		$this->cardDAO = new CardDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in NEReviewAPI" ) ;
		$cardId = $request->requestBody->cardId ;

		$this->logger->debug( "Marking $cardId and its peers for review" ) ;
		$this->neDAO->markForReview( ExecutionContext::getCurrentUserName(),
			                         $cardId ) ;

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $this->cardDAO->getPeerCardIds( $cardId ) ;
	}
}
?>