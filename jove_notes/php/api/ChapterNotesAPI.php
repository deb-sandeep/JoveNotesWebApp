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

			$elementType = $request->parametersMap[ "elementType" ] ;

			$respBody = array() ;
			$respBody[ "chapterDetails" ] = $this->chapterDetail ;
			$respBody[ "notesElements"  ] = $this->constructNotesElements( $elementType ) ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $respBody ;

			// Comment the following two lines and uncomment the above lines
			// to revert to production mode.
			// $response->responseCode = APIResponse::SC_OK ;
			// $response->responseBody = $this->getReferenceOutput() ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "ChapterNotes for chapter " . 
			                          $request->requestPathComponents[0] ;
		}
	}

	private function constructNotesElements( $elementType ) {

		$notesElements = array() ;

		$neDataArray = $this->neDAO->getNoteElements( ExecutionContext::getCurrentUserName(),
			                                          $this->chapterId, $elementType ) ;
		foreach( $neDataArray as $neData ) {
			array_push( $notesElements, $this->constructNotesElement( $neData ) ) ;
		}

		return $notesElements ;
	}

	private function constructNotesElement( $neData ) {

		$element = array() ;
        $curLevels = $neData[ "current_levels" ] ;
        if( $curLevels == null ) { $curLevels = "NS" ; }

		$element[ "noteElementId"   ] = $neData[ "notes_element_id" ] ;
		$element[ "section"         ] = $neData[ "section" ] ;
		$element[ "elementType"     ] = $neData[ "element_type" ] ;
		$element[ "difficultyLevel" ] = $neData[ "difficulty_level" ] ;
		$element[ "evalVars"        ] = $this->encodeEvalVars( $neData[ "eval_vars" ] ) ;
		$element[ "scriptBody"      ] = base64_encode( $neData[ "script_body" ] ?? '' ) ;
		$element[ "inReview"        ] = $neData[ "marked_for_review" ] ;
		$element[ "currentLevels"   ] = explode( ",", $curLevels ) ;
		$element[ "learningStats"   ] = array( 
			"learningEfficiency"    => $neData[ "learning_efficiency" ],
			"absLearningEfficiency" => $neData[ "abs_learning_efficiency" ],
            "numAttempts"           => $neData[ "num_attempts" ]
        ) ;

		$this->injectNEContent( $element, $neData[ "content" ] ) ;

		return $element ;
	}

	private function encodeEvalVars( $data ) {

		$varsArray = null ;
		if( $data != null && strlen( $data ) > 0 && $data != "{}" ) {
			$varsArray = array() ;
			$varsMap = json_decode( $data ) ;
			foreach( $varsMap as $key => $value ) {
				$varsArray[ $key ] = base64_encode( $value ?? '' ) ;
			}
		}
		return $varsArray ;
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
			       "/apps/jove_notes/api_test_data/notes/notes_rtc_ne_sample.json" ) ;
	}

}

?>