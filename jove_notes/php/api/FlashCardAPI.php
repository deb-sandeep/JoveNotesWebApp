<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_dao.php" ) ;

class FlashCardAPI extends AbstractJoveNotesAPI {

	private $cardDAO = null ;

	function __construct() {
		parent::__construct() ;
		$this->cardDAO = new CardDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in FlashCardAPI" ) ;

		if( $this->isUserEntitledForFlashCards( $request->requestPathComponents[0] ) ) {

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $this->constructResponseBody() ;
			// $response->responseBody = $this->getReferenceOutput() ;
		}
	}

	private function constructResponseBody() {

		$respObj = array() ;

		$respObj[ "chapterDetails" ] = $this->chapterDetail ;
		$respObj[ "deckDetails"    ] = $this->constructDeckDetails() ;
		$respObj[ "questions"      ] = $this->constructQuestions() ;

		return $respObj ;
	}

	private function constructDeckDetails() {

		$deckDetailsObj = array() ;

		$deckDetailsObj[ "numCards"          ] = $this->numCards ;
		$deckDetailsObj[ "difficultyStats"   ] = $this->constructDifficultyStats() ;
		$deckDetailsObj[ "progressSnapshot"  ] = $this->constructProgressSnapshot() ;
		$deckDetailsObj[ "learningCurveData" ] = $this->constructLearningCurveData() ;

		return $deckDetailsObj ;
	}

	private function constructDifficultyStats() {

		$difficultyStatsObj = array() ;

		$difficultyStatsObj[ "numVE" ] = $this->num_VE ;
		$difficultyStatsObj[ "numE"  ] = $this->num_E  ;
		$difficultyStatsObj[ "numM"  ] = $this->num_M  ;
		$difficultyStatsObj[ "numH"  ] = $this->num_H  ;
		$difficultyStatsObj[ "numVH" ] = $this->num_VH ;

		return $difficultyStatsObj ;

	}

	private function constructProgressSnapshot() {

		$progressSnapshotObj = array() ;

		$progressSnapshotObj[ "numNS"  ] = 20 ;
		$progressSnapshotObj[ "numL0"  ] = 20 ;
		$progressSnapshotObj[ "numL1"  ] = 10 ;
		$progressSnapshotObj[ "numL2"  ] = 10 ;
		$progressSnapshotObj[ "numL3"  ] = 20 ;
		$progressSnapshotObj[ "numMAS" ] = 20 ;

		return $progressSnapshotObj ;

	}

	private function constructLearningCurveData() {

		$learningCurveDataObj = array() ;

	    array_push( $learningCurveDataObj, array( 100,   0,   0,  0,  0,   0 ) ) ;
	    array_push( $learningCurveDataObj, array(  50,  10,  40,  0,  0,   0 ) ) ;
	    array_push( $learningCurveDataObj, array(  30,   5,  10, 55,  0,   0 ) ) ;
	    array_push( $learningCurveDataObj, array(  10,  10,  20, 40, 20,   0 ) ) ;
	    array_push( $learningCurveDataObj, array(   0,   5,   0, 50, 30,  15 ) ) ;
	    array_push( $learningCurveDataObj, array(   0,   0,   0, 10, 50,  40 ) ) ;
	    array_push( $learningCurveDataObj, array(   0,   0,   0,  0, 30,  70 ) ) ;
	    array_push( $learningCurveDataObj, array(   0,   0,   0,  0,  0, 100 ) ) ;

		return $learningCurveDataObj ;
	}

	private function constructQuestions() {

		$questions = array() ;

		$cards = $this->cardDAO->getAllCards( $this->chapterId ) ;
		if( $cards != null ) {
			if( gettype( $cards ) == "array" ) {
				foreach( $cards as $card ) {
					array_push( $questions, $this->constructQuestion( $card ) ) ;
				}
			}
			else {
				array_push( $questions, $this->constructQuestion( $card ) ) ;
			}
		}
		return $questions ;
	}

	private function constructQuestion( $card ) {

		$quesiton = array() ;

		$question[ "questionId"      ] = $card[ "card_id" ] ;
		$question[ "questionType"    ] = $card[ "card_type" ] ;
		$question[ "difficultyLevel" ] = $card[ "difficulty_level" ] ;

		$this->injectCardContent( $question, $card[ "content" ] ) ;

		$question[ "learningStats" ] = $this->constructLearningStats() ;

		return $question ;
	}

	private function injectCardContent( &$element, $content ) {

		$this->logger->debug( "Extracting from content " . $content ) ;
		$contentArr = json_decode( $content, true ) ;
		foreach( $contentArr as $key => $value ) {
			$element[ $key ] = $value ;
		}
	}

	private function constructLearningStats() {

		$learningStats = array() ;

		$learningStats[ "numAttempts"        ] = 2 ;
		$learningStats[ "learningEfficiency" ] = 95 ;
		$learningStats[ "currentLevel"       ] = "L2" ;
		$learningStats[ "temporalScores"     ] = array( "H", "A", "P", "E", "E" ) ;
		$learningStats[ "lastAttemptTime"    ] = 24352352435 ;

		return $learningStats ;
	}

	// Set the responseBody to the output of this function if we want to send 
	// back a prefabricated reference JSON.
	private function getReferenceOutput() {
		return file_get_contents( DOCUMENT_ROOT . 
			       "/apps/jove_notes/api_test_data/flashcard/flashcard_reference.json" ) ;
	}

}

?>