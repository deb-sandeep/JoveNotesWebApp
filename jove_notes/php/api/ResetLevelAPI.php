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
		$this->lsDAO  = new LearningSessionDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->info( "Executing doPost in ResetLevelAPI" ) ;

		$this->requestObj = $request->requestBody ;

		foreach( $this->requestObj->chapterIds as $chapterId ) {
			if( $this->isUserEntitledForFlashCards( $chapterId ) ) {

				if( $this->requestObj->entityType == 'Chapter' ) {
					$this->clsDAO->resetLevelOfAllCards(
										ExecutionContext::getCurrentUserName(), 
										$chapterId,
										$this->requestObj->level ) ;
				}
				else if( $this->requestObj->entityType == 'Exercise' ) {
					$this->clsDAO->activateDifficultExerciseCards(
										ExecutionContext::getCurrentUserName(), 
										$chapterId ) ;
				}
				else {
					$response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
					$response->responseBody = "Bad entity type " . 
					                          $this->requestObj->entityType ;
					return ;
				}

				$this->lsDAO->refreshProgressSnapshotOfLatestSession( 
										ExecutionContext::getCurrentUserName(), 
										$chapterId ) ;
			}
		}

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = "Success" ;
	}
}

?>