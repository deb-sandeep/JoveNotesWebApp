<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_rating_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_learning_summary_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/student_score_dao.php" ) ;

class GradeCardAPI extends AbstractJoveNotesAPI {

	private $requestObj = null ;
	private $score = 0 ;
	private $learningEfficiency = 0 ;

	private $cardRatingDAO = null ;
	private $lsDAO         = null ;
	private $clsDAO        = null ;
	private $scoreDAO      = null ;

	function __construct() {
		parent::__construct() ;
		$this->cardRatingDAO = new CardRatingDAO() ;
		$this->lsDAO         = new LearningSessionDAO() ;
		$this->clsDAO        = new CardLearningSummaryDAO() ;
		$this->scoreDAO      = new StudentScoreDAO() ;
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

			$this->scoreDAO->updateScore( ExecutionContext::getCurrentUserName(), 
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
	}

	private function computeLearningEfficiency( $cardLearningSummary ) {
		
		$temporalRatings = $cardLearningSummary[ "temporal_ratings" ] ;
		$ratings = str_split( $temporalRatings ) ;
		array_push( $ratings, $this->requestObj->rating ) ;

		$totalRatingScores = 0 ;
		foreach ( $ratings as $rating ) {
			if     ( $rating == 'E' ) $totalRatingScores += 100 ;
			else if( $rating == 'A' ) $totalRatingScores +=  75 ;
			else if( $rating == 'P' ) $totalRatingScores +=  25 ;
			else if( $rating == 'H' ) $totalRatingScores +=   0 ;
		}
		$this->learningEfficiency = ceil( $totalRatingScores / count( $ratings ) ) ;
	}

	private function computeScore( $cardLearningSummary ) {

		if( $this->requestObj->numAttempts > 1 ) {
			$this->score = 0 ;
		}
		else {
			$scoreMatrix = array(
			   "E"=>array( "NS"=>100, "L0"=> 80, "L1"=> 90, "L2"=> 80, "L3"=>  60 ),
			   "A"=>array( "NS"=> 80, "L0"=> 60, "L1"=> 50, "L2"=> 40, "L3"=>  30 ),
			   "P"=>array( "NS"=> 10, "L0"=> -5, "L1"=>-10, "L2"=>-20, "L3"=> -40 ),
			   "H"=>array( "NS"=>  0, "L0"=>-10, "L1"=>-20, "L2"=>-50, "L3"=>-100 )
			) ;

			$arr        = $scoreMatrix[ $this->requestObj->rating ] ;
			$multFactor = $arr[ $cardLearningSummary[ "current_level" ] ] ;

			$this->score = ceil( ($multFactor/100)*$cardLearningSummary[ "difficulty_level" ] ) ;
		}
	}

	private function saveCardRating() {

		$this->cardRatingDAO->insertRating( 
									$this->requestObj->cardId, 
									ExecutionContext::getCurrentUserName(), 
									$this->requestObj->sessionId,
									$this->requestObj->rating,
									$this->score,
									$this->requestObj->timeTaken ) ;
	}

	private function updateSessionSummary() {

		$incrE  = 0 ; $incrA  = 0 ; $incrP  = 0 ; $incrH  = 0 ;

		$incrNS = 0 ; $incrL0 = 0 ; $incrL1  = 0 ; 
		$incrL2 = 0 ; $incrL3 = 0 ; $incrMAS = 0 ;

		if     ( $this->requestObj->rating === 'E' ) $incrE = 1 ;
		else if( $this->requestObj->rating === 'A' ) $incrA = 1 ;
		else if( $this->requestObj->rating === 'P' ) $incrP = 1 ;
		else if( $this->requestObj->rating === 'H' ) $incrH = 1 ;

		if( $this->requestObj->currentLevel === 'NS' ) $incrNS = -1 ;

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

		$this->lsDAO->updateSessionStat( $this->requestObj->sessionId,
			                             $this->requestObj->timeTaken,
			                             $incrE, $incrA, $incrP, $incrH,
										 $incrNS, $incrL0, $incrL1, 
										 $incrL2, $incrL3, $incrMAS, 
										 $this->score ) ;
	}

	private function updateCardLearningSummary() {

		$this->clsDAO->updateSummary( ExecutionContext::getCurrentUserName(),
			                          $this->requestObj->cardId, 
			                          $this->requestObj->nextLevel, 
			                          $this->requestObj->rating, 
			                          $this->learningEfficiency ) ;
	}	
}

?>