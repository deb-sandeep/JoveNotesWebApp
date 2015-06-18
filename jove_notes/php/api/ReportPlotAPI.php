<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_rating_dao.php" ) ;

/**
 * This API can be called in the following modes
 * 
 * 1. GET ReportPlot/Subjects
 *    Returns an array of subject names that this user has studied. 
 *    
 * 2. GET ReportPlot/Score
 *    GET ReportPlot/Time
 *
 *    Gets the report data for score and time entity types. The characteristics
 *    of the returned data will depend upon the following parameters
 *
 */
class ReportPlotAPI extends AbstractJoveNotesAPI {

	private $requestEntity = null ;
	private $cardRatingDAO = null ;

	private $startDate     = null ;
	private $endDate       = null ;
	private $dataFrequency = null ;
	private $subject       = null ;

	function __construct() {
		parent::__construct() ;
		$this->cardRatingDAO = new CardRatingDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->info( "Executing doGet in ReportPlotAPI" ) ;

		try {
			$this->parseRequest( $request ) ;
		}
		catch( Exception $e ) {
			$this->logger->error( "Error parsing API request. " . $e->getMessage() ) ;
			APIUtils::writeAPIErrorResponse( APIResponse::SC_ERR_BAD_REQUEST, $e->getMessage() ) ;
			return ;
		}

		$responseBody = null ;
		try {
			$responseBody = $this->processRequest() ;
			$response->responseCode = APIResponse::SC_OK ;
			$response->responseBody = $responseBody ;
		}
		catch( Exception $e ) {
			$this->logger->error( "Error parsing API request. " . $e->getMessage() ) ;
			APIUtils::writeAPIErrorResponse( 
									APIResponse::SC_ERR_INTERNAL_SERVER_ERROR, 
									$e->getMessage() ) ;
			return ;
		}
	}

	private function parseRequest( $request ) {

		$this->logger->info( "Parsing request parameters." ) ;

		if( count( $request->requestPathComponents ) == 0 ) {
			throw new Exception( "Entity [Subjects|Score|Time] not specified." ) ;
		}
		else{
			$this->requestEntity = $request->requestPathComponents[0] ;
			if( !( $this->requestEntity == 'Subjects' || 
				   $this->requestEntity == 'Score' ||
				   $this->requestEntity == 'Time' ) ) {

				throw new Exception( "Invalid entity '$this->requestEntity' specified." ) ;
			}
			else {
				if( $this->requestEntity != 'Subjects' ) {

					$this->startDate = $request->parametersMap[ 'startDate' ] ;
					$this->logger->info( "Parameter[ startDate ] = $this->startDate" ) ;

					$this->endDate = $request->parametersMap[ 'endDate' ] ;
					$this->logger->info( "Parameter[ endDate ] = $this->endDate" ) ;

					$this->dataFrequency = $request->parametersMap[ 'dataFrequency' ] ;
					$this->logger->info( "Parameter[ dataFrequency ] = $this->dataFrequency" ) ;

					$this->subject = $request->parametersMap[ 'subject' ] ;
					$this->logger->info( "Parameter[ subject ] = $this->subject" ) ;
				}
			}
		}
	}

	private function processRequest() {

		$this->logger->info( "Processing request for entity $this->requestEntity" ) ;
		if( $this->requestEntity == 'Subjects' ) {
			return $this->cardRatingDAO->getDistinctSubjectNames(
				                      ExecutionContext::getCurrentUserName() ) ;
		}
		else if( $this->requestEntity == 'Score' ) {
			return $this->getScoreResponse() ;
		}
		else if( $this->requestEntity == 'Time' ) {
			throw new Exception( "Time entity report data yet to be implemented." ) ;
		}
	}

	private function getScoreResponse() {

		$priorScore = $this->cardRatingDAO->getCumulativeScorePriorToDate(
			              				ExecutionContext::getCurrentUserName(), 
			              				$this->startDate ) ;

		$scoreMap = $this->cardRatingDAO->getCumulativeScores(
										ExecutionContext::getCurrentUserName(),
										$this->subject,
										$this->dataFrequency,
										$this->startDate,
										$this->endDate ) ;

		$this->logger->info( "Score data " . json_encode( $scoreMap ) ) ;

		$labels = array() ;
		$scores = array() ;

    	foreach( $scoreMap as $label => $score ) {
    		array_push( $scores, $score ) ;
    		if( $this->dataFrequency != 'intraday' ) {
	    		array_push( $labels, $label ) ;
    		}
    	}

		$respObj = array() ;

		$respObj[ "priorScore" ] = $priorScore ;
		$respObj[ "scores"     ] = $scores ;
		$respObj[ "labels"     ] = $labels ;

		return $respObj ;
	}
}

?>