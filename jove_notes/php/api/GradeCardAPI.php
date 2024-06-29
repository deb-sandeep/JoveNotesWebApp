<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_rating_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_rating_ex_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/student_score_dao.php" ) ;

class GradeCardAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;
	private $score = 0 ;
	private $learningEfficiency = 0 ;
	private $absoluteLearningEfficiency = 0 ;

	private $cardRatingDAO   = null ;
    private $cardRatingExDAO = null ;
	private $lsDAO           = null ;
	private $clsDAO          = null ;
	private $scoreDAO        = null ;

	function __construct() {
		parent::__construct() ;
		$this->cardRatingDAO   = new CardRatingDAO() ;
        $this->cardRatingExDAO = new CardRatingExDAO() ;
		$this->lsDAO           = new LearningSessionDAO() ;
		$this->clsDAO          = new CardLearningSummaryDAO() ;
		$this->scoreDAO        = new StudentScoreDAO() ;
	}

	public function doPost( $request, &$response ) {

		$this->logger->debug( "Executing doPost in GradeCardAPI" ) ;

		$this->requestObj = $request->requestBody ;
		$this->logger->debug( "Request parameters " . json_encode( $this->requestObj ) ) ;

		if( $this->isUserEntitledForFlashCards( $this->requestObj->chapterId ) ) {

			$summary = $this->clsDAO->getCardLearningSummary(
										ExecutionContext::getCurrentUserName(), 
										$this->requestObj->cardId ) ;

			$this->computeLearningEfficiency( $summary ) ;
			$this->computeScore( $summary ) ;

			$this->logger->debug( "Score for this rating = " . $this->score ) ;
			$this->logger->debug( "Learning efficiency   = " . $this->learningEfficiency ) ;

			$this->scoreDAO->updateScore( $this->requestObj->chapterId,
				                          ExecutionContext::getCurrentUserName(), 
				                          $this->score ) ;
			$this->saveCardRating() ;
			$this->updateSessionSummary() ;
			$this->updateCardLearningSummary() ;

			$this->logger->debug( "Rating successfully saved" ) ;

			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = array( 
				"score" => $this->score 
			) ;
		}
		else {
			$response->responseCode = APIResponse::SC_ERR_UNAUTHORIZED ;
			$response->responseBody = "User is not authorized to invoke " .
			                          "FlashCard for chapter " . 
			                          $request->requestPathComponents[0] ;
		}
	}

	private function computeLearningEfficiency( $cardLearningSummary ) {

		$temporalRatings = $cardLearningSummary[ "temporal_ratings" ] ;
		$ratings = str_split( $temporalRatings ) ;

		// Strange ways of life in different languages, str_split returns an
		// array of length 1 for null strings :( If left unchecked, for a single
		// rating the learning efficiency will get halved.
		if( count( $ratings ) == 1 && $ratings[0] == "" ) {
			array_shift( $ratings ) ;
		}

        if( $this->requestObj->rating == "APM" ||
            $this->requestObj->rating == "APMNS" ) {

            array_push( $ratings, "E" ) ;
        }
        else {
            array_push( $ratings, $this->requestObj->rating ) ;
        }

		// Calculate the absolute learning efficiency taking into consideration
		// all the temporal ratings.
		$totalRatingScores = 0 ;
		foreach ( $ratings as $rating ) {
			if     ( $rating == 'E' ) $totalRatingScores += 100 ;
			else if( $rating == 'A' ) $totalRatingScores +=  80 ;
			else if( $rating == 'P' ) $totalRatingScores +=  50 ;
			else if( $rating == 'H' ) $totalRatingScores +=   0 ;
		}
		$this->absoluteLearningEfficiency = ceil( $totalRatingScores / count( $ratings ) ) ;

		// Consider only the last four ratings as inputs for computing the current
		// learning efficiency. This implies that if the user is learning really
		// well, he is not being penalized for his earlier mistakes.
		while( count( $ratings ) > 4 ) {
			array_shift( $ratings ) ;
		}

		$totalRatingScores = 0 ;
		foreach ( $ratings as $rating ) {
			if     ( $rating == 'E' ) $totalRatingScores += 100 ;
			else if( $rating == 'A' ) $totalRatingScores +=  80 ;
			else if( $rating == 'P' ) $totalRatingScores +=  50 ;
			else if( $rating == 'H' ) $totalRatingScores +=   0 ;
		}
		$this->learningEfficiency = ceil( $totalRatingScores / count( $ratings ) ) ;
	}

	private function saveCardRating() {

		// Save the card rating only if we are not grading an auto-promote case.
		// This also implies that the time spent for cards which have APMNS ratings
		// are not captured - intended behavior.
		if( $this->requestObj->rating != "APMNS" ) {

			$rating = $this->requestObj->rating ;
			if( $this->requestObj->rating == "APM" ) {
				$rating = "E" ;
			}

			$timeSpent = $this->requestObj->timeTaken ;
			if( $timeSpent < 0 ) {
				$this->logger->warn( "Got a negative time spent. " . 
					                 "Setting it to 30 seconds. Card ID = " . 
					                 $this->requestObj->cardId ) ;
				$timeSpent = 30 ;
			}

			$this->cardRatingDAO->insertRating( 
                $this->requestObj->cardId,
                ExecutionContext::getCurrentUserName(),
                $this->requestObj->sessionId,
                $rating,
                $this->score,
                $timeSpent
            ) ;

            $this->cardRatingExDAO->insertRating(
                $this->requestObj->sessionId,
                $rating,
                $this->score,
                $timeSpent,
                $this->requestObj->nextLevel,
                ExecutionContext::getCurrentUserName(),
                $this->requestObj->cardId
            ) ;
		}
		else {
			$rating = "E" ;
			$timeSpent = 0 ;
			$score = 0 ;

			$this->cardRatingDAO->insertRating( 
										$this->requestObj->cardId, 
										ExecutionContext::getCurrentUserName(), 
										$this->requestObj->sessionId,
										$rating,
										$score,
										$timeSpent ) ;
		}
	}

	private function updateSessionSummary() {

		$incrE  = 0 ; $incrA  = 0 ; $incrP  = 0 ; $incrH  = 0 ;

		$incrNS = 0 ; $incrL0 = 0 ; $incrL1  = 0 ; 
		$incrL2 = 0 ; $incrL3 = 0 ; $incrMAS = 0 ;

		if     ( $this->requestObj->rating === 'E'     ) $incrE = 1 ;
		else if( $this->requestObj->rating === 'A'     ) $incrA = 1 ;
		else if( $this->requestObj->rating === 'P'     ) $incrP = 1 ;
		else if( $this->requestObj->rating === 'H'     ) $incrH = 1 ;
		else if( $this->requestObj->rating === 'APM'   ) $incrE = 1 ;
		else if( $this->requestObj->rating === 'APMNS' ) $incrE = 1 ;

		if      ( $this->requestObj->currentLevel === 'NS'  ) $incrNS  = -1 ;
		else if ( $this->requestObj->currentLevel === 'L0'  ) $incrL0  = -1 ;
		else if ( $this->requestObj->currentLevel === 'L1'  ) $incrL1  = -1 ;
		else if ( $this->requestObj->currentLevel === 'L2'  ) $incrL2  = -1 ;
		else if ( $this->requestObj->currentLevel === 'L3'  ) $incrL3  = -1 ;
		else if ( $this->requestObj->currentLevel === 'MAS' ) $incrMAS = -1 ;

		if      ( $this->requestObj->nextLevel === 'NS'  ) $incrNS  += 1 ;
		else if ( $this->requestObj->nextLevel === 'L0'  ) $incrL0  += 1 ;
		else if ( $this->requestObj->nextLevel === 'L1'  ) $incrL1  += 1 ;
		else if ( $this->requestObj->nextLevel === 'L2'  ) $incrL2  += 1 ;
		else if ( $this->requestObj->nextLevel === 'L3'  ) $incrL3  += 1 ;
		else if ( $this->requestObj->nextLevel === 'MAS' ) $incrMAS += 1 ;

		// If we have an auto promote card without scoring, we consider the
		// time taken to be zero.
		$timeTaken = $this->requestObj->timeTaken ;
		if( $this->requestObj->rating === 'APMNS' ) {
			$timeTaken = 0 ;
		}

		$this->lsDAO->updateSessionStat( $this->requestObj->sessionId,
			                             $timeTaken,
			                             $incrE, $incrA, $incrP, $incrH,
										 $incrNS, $incrL0, $incrL1, 
										 $incrL2, $incrL3, $incrMAS, 
										 $this->score ) ;
	}

	private function updateCardLearningSummary() {

		$rating = $this->requestObj->rating ;
		if( $this->requestObj->rating == "APM" || 
			$this->requestObj->rating == "APMNS" ) {
			$rating = "E" ;
		}

		// If we have an auto promote card without scoring, we consider the
		// time taken to be zero.
		$timeTaken = $this->requestObj->timeTaken ;
		if( $this->requestObj->rating === 'APMNS' ) {
			$timeTaken = 0 ;
		}

		$this->clsDAO->updateSummary( ExecutionContext::getCurrentUserName(),
			                          $this->requestObj->cardId, 
			                          $this->requestObj->nextLevel, 
			                          $rating, 
			                          $this->learningEfficiency,
			                          $this->absoluteLearningEfficiency,
			                          $timeTaken ) ;
	}	

	private function computeScore( $cardLearningSummary ) {

		if( $this->requestObj->rating == "APM" ) {
			$this->computeScoreForAPMScenario( $cardLearningSummary ) ;
		}
		else if( $this->requestObj->rating == "APMNS" ) {
			$this->score = 0 ;
		}
		else {
			$this->computeScoreForNormalScenario( $cardLearningSummary ) ;
		}

		if( $this->score != 0 ) {
			$this->addOvershootRewardOrPenalty() ;
		}

		$this->score = round( $this->score ) ;

		if( property_exists( $this->requestObj, 'skipNegativeGrading' ) ) {
			if( $this->requestObj->skipNegativeGrading == 1 ) {
				if( $this->score < 0 ) {
					$this->score = 0 ;
				}
			}
		}
	}

	private function addOvershootRewardOrPenalty() {

		$overshootPct = $this->requestObj->overshootPct ;
		$penalty = 0 ;

		if( $overshootPct > 0.25 ) {

			if      ( $overshootPct > 1.0 ) { $penalty = $this->score * 0.6 ; }
			else if ( $overshootPct > 0.8 ) { $penalty = $this->score * 0.5 ; }
			else if ( $overshootPct > 0.7 ) { $penalty = $this->score * 0.4 ; }
			else if ( $overshootPct > 0.6 ) { $penalty = $this->score * 0.3 ; }
			else if ( $overshootPct > 0.5 ) { $penalty = $this->score * 0.2 ; }
			else                            { $penalty = $this->score * 0.1 ; }

			if( $this->score < 0 ) {
				$this->score += $penalty ;
			}
			else {
				$this->score -= $penalty ;
			}
		}
		else if( $overshootPct < 0 ) {
			// If student has answered faster than the average time, we should
			// reward him as a percentage of the score earned

			if      ( $overshootPct < -0.5 ) { $penalty = $this->score * 0.25  ; }
			else if ( $overshootPct < -0.4 ) { $penalty = $this->score * 0.2   ; }
			else if ( $overshootPct < -0.3 ) { $penalty = $this->score * 0.15  ; }
			else if ( $overshootPct < -0.2 ) { $penalty = $this->score * 0.1   ; }
			else if ( $overshootPct < -0.1 ) { $penalty = $this->score * 0.05  ; }
			else                             { $penalty = $this->score * 0.025 ; }

			if( $this->score < 0 ) {
				$this->score -= $penalty ;
			}
			else {
				$this->score += $penalty ;
			}
		}
	}

	// $this->requestObj has the following attributes
    // 		chapterId
    // 		sessionId
    // 		cardId
    // 		currentLevel
    // 		nextLevel
    // 		rating
    // 		timeTaken
    // 		numAttempts
    //      overshootPct
    //
    // $cardLearningSummary has the following attributes
	// 		current_level
	// 		num_attempts
	// 		temporal_ratings
	// 		learning_efficiency
	// 		last_attempt_time
	// 		difficulty_level
	//
	// Rules for computing score
	// 1. If numAttempts is 1, score is computed via the scoring matrix -i.e. 
	//    as a factor of rating and current level
	// 
	// 2. If there are more than one attempt in the session, 
	private function computeScoreForNormalScenario( $cardLearningSummary ) {

		$this->logger->debug( "Computing score for normal scenario" ) ;
		$this->logger->debug( "\tcurrentLevel = " . $this->requestObj->currentLevel ) ;
		$this->logger->debug( "\tnextLevel    = " . $this->requestObj->nextLevel ) ;
		$this->logger->debug( "\trating       = " . $this->requestObj->rating ) ;

		if( $this->requestObj->numAttempts == 1 ) {
			$scoreMatrix = array(
			   "E"=>array( "NS"=>  80, "L0"=>  70, "L1"=>  50, "L2"=>  40, "L3"=>  20 ),
			   "A"=>array( "NS"=>  50, "L0"=>  40, "L1"=>  20, "L2"=>  10, "L3"=> -10 ),
			   "P"=>array( "NS"=>  20, "L0"=> -80, "L1"=>-100, "L2"=>-125, "L3"=>-150 ),
			   "H"=>array( "NS"=> -25, "L0"=>-100, "L1"=>-175, "L2"=>-200, "L3"=>-250 )
			) ;

			$arr        = $scoreMatrix[ $this->requestObj->rating ] ;
			$multFactor = $arr[ $this->requestObj->currentLevel ] ;

			$this->score = ceil( ($multFactor/100)*$cardLearningSummary[ "difficulty_level" ] ) ;

            if( $this->requestObj->currentLevel == 'L3' &&
                $this->requestObj->rating == 'H' ) {
                $this->score = min( $this->score, -150 ) ;
            }

			$this->logger->debug( "First attempt - score = $this->score" ) ;
		}
		else {
        	//          E     A      P     H
        	// ---------------------------------
        	// NS : [ 'L1' , 'L1', 'L0',  'L0' ]
        	// L0 : [ 'L1' , 'L0', 'L0',  'L0' ]
        	// L1 : [ 'L2' , 'L1', 'L0',  'L0' ]
        	// L2 : [ 'L3' , 'L1', 'L1',  'L0' ]
        	// L3 : [ 'MAS', 'L0', 'L0',  'L0' ]
        	// ---------------------------------
        	// NS : [  -1,   -1,   0.5,   0.25 ]
        	// L0 : [  -1,    1,   0.5,   0.25 ]
        	// L1 : [  -1,    1,   0.5,   0.25 ]
        	// L2 : [  -1,    1,   0.5,   0.25 ]
        	// L3 : [  -1,    1,   0.5,   0.25 ]
			//

			// If the rating is E, we don't give any score - no short term memory
			// advantage. However, if the rating is not E, then there is an 
			// associated penalty as a function of the difficulty level and 
			// the number of attempts till now.
			$this->score = 0 ;
			if( $this->requestObj->rating != "E" ) {

				$this->logger->debug( "Current rating not E, applying penalty" ) ;
				$jump = $this->getLevelJump( $this->requestObj->currentLevel, 
					                         $this->requestObj->nextLevel ) ;

				$this->logger->debug( "Rating for attempt = " . 
					                  $this->requestObj->numAttempts ) ;
				$this->logger->debug( "Rating jump = $jump" ) ;

				if( $jump <= 0 ) {
					$jump = $jump - 1 ;

					$diffLevel         = $cardLearningSummary[ "difficulty_level" ] ;
					$penaltyPercentage = $this->requestObj->numAttempts * 15 ;

					$this->score = ceil( ($penaltyPercentage/100)*$diffLevel*$jump ) ;
                    $this->score = min( $this->score, -150 ) ;
					
					$this->logger->debug( "Penalty percentage = $penaltyPercentage" ) ;
					$this->logger->debug( "Score = " . $this->score ) ;
				}
			}
		}
	}

	private function computeScoreForAPMScenario( $cardLearningSummary ) {

		$this->logger->debug( "Computing score for APM scenario" ) ;
		$this->logger->debug( "\tcurrentLevel = " . $this->requestObj->currentLevel ) ;
		$this->logger->debug( "\tnextLevel    = " . $this->requestObj->nextLevel ) ;
		$this->logger->debug( "\trating       = " . $this->requestObj->rating ) ;

		$scoreMatrix = array( "NS"=> 80, "L0"=> 60, "L1"=> 50, "L2"=> 40, "L3"=>  30 ) ;

		$multFactor  = $scoreMatrix[ $this->requestObj->currentLevel ] ;
		$this->score = ceil( ($multFactor/100)*$cardLearningSummary[ "difficulty_level" ] ) ;
		$jump        = $this->getLevelJump( $this->requestObj->currentLevel, "MAS" ) ;

		$this->score = ceil( ( $this->score * $jump )/2 ) ;

		$this->logger->debug( "APM score = $this->score" ) ;
	}

	private function getLevelJump( $currentLevel, $nextLevel ) {

		$jumpMatrix = array(
		   "NS" => array( "NS"=> 0, "L0"=>-1, "L1"=> 1, "L2"=> 2, "L3"=> 3, "MAS"=> 4 ),
		   "L0" => array( "NS"=> 0, "L0"=> 0, "L1"=> 1, "L2"=> 2, "L3"=> 3, "MAS"=> 4 ),
		   "L1" => array( "NS"=> 0, "L0"=>-1, "L1"=> 0, "L2"=> 1, "L3"=> 2, "MAS"=> 3 ),
		   "L2" => array( "NS"=> 0, "L0"=>-2, "L1"=>-1, "L2"=> 0, "L3"=> 1, "MAS"=> 2 ),
		   "L3" => array( "NS"=> 0, "L0"=>-4, "L1"=>-2, "L2"=>-1, "L3"=> 0, "MAS"=> 1 )
		) ;

		$arr  = $jumpMatrix[ $currentLevel ] ;
		$jump = $arr[ $nextLevel ] ;
		return $jump ;
	}
}

?>