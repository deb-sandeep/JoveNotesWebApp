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
		$operationType = $request->requestBody->opType ;

		if( $operationType == 'mark_for_review' ) {

			$cardId = $request->requestBody->cardId ;
			$this->markForReview( $cardId ) ;

			$response->responseBody = $this->cardDAO->getPeerCardIds( $cardId ) ;
			$response->responseCode = APIResponse::SC_OK ;
		}
		else if( $operationType == 'mark_reviewed' ) {
			$this->markReviewed( $request->requestBody->noteElementId ) ;
			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = "NE " . $request->requestBody->noteElementId . 
			                          " marked as reviewed." ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_BAD_REQUEST ;
			$response->responseBody = "NE " . $request->requestBody->noteElementId . 
			                          " marked for review." ;
		}
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doPost in NEReviewAPI" ) ;

		$requestedEntity = $request->requestPathComponents[0] ;
		$responseBody    = null ;

		try {
			if( $requestedEntity == "ChapterList" ) {
				$responseBody = $this->createChapterList() ;
			}
			else {
				throw new Exception( "Unknown requested entity $requestedEntity" ) ;
			}
		}
		catch( Exception $e ) {
			$this->logger->error( "Error executing API." . $e->getMessage() ) ;
			APIUtils::writeAPIErrorResponse( APIResponse::SC_ERR_INTERNAL_SERVER_ERROR, 
				                             $e->getMessage() ) ;	
			return ;
		}

		$response->responseCode = APIResponse::SC_OK ;
		$response->responseBody = $responseBody ;

		return ;
	}

	private function createChapterList() {

		$chapterList = array() ;

		$chaptersMap = $this->neDAO->getChapterListOfNoteElementsMarkedForReview() ;

		foreach( $chaptersMap as $chapter ) {

			$chapterGuard = $chapter[ "guard" ] ; 
			if( Authorizer::hasAccess( $chapterGuard, "NOTES" ) ) {
				
				$element = array() ;

				$element[ "chapterId"       ] = $chapter[ "chapter_id"       ]  ;
				$element[ "syllabusName"    ] = $chapter[ "syllabus_name"    ] ;
				$element[ "subjectName"     ] = $chapter[ "subject_name"     ] ;
				$element[ "chapterNum"      ] = $chapter[ "chapter_num"      ] ;
				$element[ "subChapterNum"   ] = $chapter[ "sub_chapter_num"  ] ;
				$element[ "chapterName"     ] = $chapter[ "chapter_name"     ] ;
				$element[ "numReviewItems"  ] = $chapter[ "num_review_items" ] ;

				array_push( $chapterList, $element ) ;
			}
		}

		return $chapterList ;
	}

	private function markForReview( $cardId ) {

		$this->logger->debug( "Marking $cardId and its peers for review" ) ;
		$this->neDAO->markForReview( ExecutionContext::getCurrentUserName(),
			                         $cardId ) ;

	}

	private function markReviewed( $noteElementId ) {

		$this->logger->debug( "Marking $noteElementId as reviewed." ) ;
		$this->neDAO->markReviewed( ExecutionContext::getCurrentUserName(),
			                        $noteElementId ) ;
	}
}
?>