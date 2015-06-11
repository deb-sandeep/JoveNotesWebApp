<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/notes_element_dao.php" ) ;

class ChapterNotesAPI extends AbstractJoveNotesAPI {

	private $neDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->neDAO = new NotesElementDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in ChapterNotesAPI" ) ;

		if( $this->isUserEntitledForNotes( $request->requestPathComponents[0] ) ) {

			$respBody = array() ;
			$respBody[ "chapterDetails" ] = $this->chapterDetail ;
			$respBody[ "notesElements"  ] = $this->constructNotesElements() ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $respBody ;
			// $response->responseBody = $this->getReferenceOutput() ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "ChapterNotes for chapter " . 
			                          $request->requestPathComponents[0] ;
		}
	}

	private function constructNotesElements() {

		$notesElements = array() ;

		$neDataArray = $this->neDAO->getNoteElements( ExecutionContext::getCurrentUserName(),
			                                          $this->chapterId ) ;
		foreach( $neDataArray as $neData ) {
			array_push( $notesElements, $this->constructNotesElement( $neData ) ) ;
		}

		return $notesElements ;
	}

	private function constructNotesElement( $neData ) {

		$element = array() ;

		$element[ "noteElementId"   ] = $neData[ "notes_element_id" ] ;
		$element[ "elementType"     ] = $neData[ "element_type" ] ;
		$element[ "difficultyLevel" ] = $neData[ "difficulty_level" ] ;
		$element[ "learningStats"   ] = array( "learningEfficiency" => $neData[ "learning_efficiency" ] ) ;

		$this->injectNEContent( $element, $neData[ "content" ] ) ;

		return $element ;
	}

	private function injectNEContent( &$element, $content ) {

		$this->logger->debug( "Extracting from content " . $content ) ;
		$contentArr = json_decode( $content, true ) ;
		foreach( $contentArr as $key => $value ) {
			$element[ $key ] = $value ;
		}
	}

	// Set the responseBody to the output of this function if we want to send 
	// back a prefabricated reference JSON.
	private function getReferenceOutput() {
		return file_get_contents( DOCUMENT_ROOT . 
			       "/apps/jove_notes/api_test_data/notes/chapter_notes.json" ) ;
	}

}

?>