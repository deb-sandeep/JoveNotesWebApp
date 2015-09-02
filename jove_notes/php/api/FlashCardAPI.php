<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;

class FlashCardAPI extends AbstractJoveNotesAPI {

	private $lsDAO   = null ;
	private $clsDAO  = null ;

	function __construct() {
		parent::__construct() ;
		$this->lsDAO = new LearningSessionDAO() ;
		$this->clsDAO= new CardLearningSummaryDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->debug( "Executing doGet in FlashCardAPI" ) ;

		$this->chapterId = $request->requestPathComponents[0] ;
		if( $this->isUserEntitledForFlashCards( $this->chapterId ) ) {

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $this->constructResponseBody() ;
			// $response->responseBody = $this->getReferenceOutput() ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "FlashCard for chapter " . 
			                          $request->requestPathComponents[0] ;
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

		$this->attachProgressSnapshots( $deckDetailsObj ) ;
		$this->attachDifficultyTimeAverages( $deckDetailsObj ) ;

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

	private function attachProgressSnapshots( &$deckDetailsObj ) {

		$progressSnapshotObj = array() ;
		$learningCurveDataObj = array() ;

		$this->logger->debug( "Getting snapshots for " . 
			                  ExecutionContext::getCurrentUserName() . " and " .
			                  " chapter = " . $this->chapterId ) ;

		$snapshots = $this->lsDAO->getProgressSnapshots( 
										ExecutionContext::getCurrentUserName(),
										$this->chapterId ) ;

		$this->logger->debug( "Successfully obtained snapshots." ) ;

		$numSnapshots = count( $snapshots ) ;
		for( $i=0; $i<$numSnapshots; $i++ ) {

			$pushSnapshot = false ;
			$snapshot = $snapshots[ $i ] ;
			if( $i == $numSnapshots-1 ) {
				$progressSnapshotObj[ "numNS"  ] = $snapshot[ "num_NS" ] ;
				$progressSnapshotObj[ "numL0"  ] = $snapshot[ "num_L0" ] ;
				$progressSnapshotObj[ "numL1"  ] = $snapshot[ "num_L1" ] ;
				$progressSnapshotObj[ "numL2"  ] = $snapshot[ "num_L2" ] ;
				$progressSnapshotObj[ "numL3"  ] = $snapshot[ "num_L3" ] ;
				$progressSnapshotObj[ "numMAS" ] = $snapshot[ "num_MAS" ] ;

				$pushSnapshot = true ;
			}
			else {
				if( $snapshot[ "time_spent" ] > 10 ) {
					$pushSnapshot = true ;
				}
			}

			if( $pushSnapshot ) {
			    array_push( $learningCurveDataObj, 
			    	        array( $snapshot["num_NS"],$snapshot["num_L0"], 
			    	        	   $snapshot["num_L1"],$snapshot["num_L2"], 
			    	        	   $snapshot["num_L3"],$snapshot["num_MAS"] ));
			}
		}
		$deckDetailsObj[ "progressSnapshot"  ] = $progressSnapshotObj ;
		$deckDetailsObj[ "learningCurveData" ] = $learningCurveDataObj ;
	}

	private function attachDifficultyTimeAverages( &$deckDetailsObj ) {

		$diffTimeAverages = array() ;

		$tupules = $this->clsDAO->getDifficultyTimeAveragesForChapter( 
										ExecutionContext::getCurrentUserName(), 
										$this->chapterId ) ;

		for( $i=0; $i < count( $tupules ); $i++ ) {
			$cardType        = $tupules[$i][ "card_type" ] ;
			$difficultyLevel = $tupules[$i][ "difficulty_level" ] ;
			$numAttempts     = $tupules[$i][ "num_attempts" ] ;
			$avgTime         = $tupules[$i][ "avg_time" ] ;
			
			if( !array_key_exists( $cardType, $diffTimeAverages ) ) {
				$diffTimeAverages[ $cardType ] = array() ;
			}
			$values = &$diffTimeAverages[ $cardType ] ;

			array_push( $values, array( $difficultyLevel, $numAttempts, $avgTime ) ) ;
		}
		$deckDetailsObj[ "difficultyTimeAverages" ] = $diffTimeAverages ;
	}

	private function constructQuestions() {

		$questions = array() ;

		$cards = $this->clsDAO->getCardsForUser( ExecutionContext::getCurrentUserName(), 
			                                     $this->chapterId ) ;
		foreach( $cards as $card ){
			array_push( $questions, $this->constructQuestion( $card ) ) ;
		}

		return $questions ;
	}

	private function constructQuestion( $card ) {

		$quesiton = array() ;
		$learningStats = array() ;

		$question[ "questionId"      ] = $card[ "card_id" ] ;
		$question[ "questionType"    ] = $card[ "card_type" ] ;
		$question[ "difficultyLevel" ] = $card[ "difficulty_level" ] ;
		$question[ "scriptBody"      ] = base64_encode( $card[ "script_body" ] ) ;

		$this->injectCardContent( $question, $card[ "content" ] ) ;

		$lastAttemptTime = $card[ "last_attempt_time" ] ;
		if( $lastAttemptTime == null ) {
			$lastAttemptTime = -1 ;
		}
		else {
			$lastAttemptTime = strtotime( $lastAttemptTime ) * 1000 ;
		}

    	$learningStats[ "numAttempts"        ] = $card[ "num_attempts" ] ;
		$learningStats[ "learningEfficiency" ] = $card[ "learning_efficiency" ] ;
		$learningStats[ "currentLevel"       ] = $card[ "current_level" ] ;
		$learningStats[ "temporalScores"     ] = str_split( $card[ "temporal_ratings" ] ) ;
		$learningStats[ "lastAttemptTime"    ] = $lastAttemptTime ;
		$learningStats[ "totalTimeSpent"     ] = $card[ "total_time_spent" ] ;

		$question[ "learningStats" ] = $learningStats ;

		return $question ;
	}

	private function injectCardContent( &$element, $content ) {

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
			       "/apps/jove_notes/api_test_data/flashcard/flashcard_reference.json" ) ;
	}

}

?>