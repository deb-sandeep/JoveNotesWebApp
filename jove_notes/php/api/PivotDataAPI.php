<?php
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/api/abstract_jove_notes_api.php" ) ;
require_once( APP_ROOT      . "/php/dao/card_rating_dao.php" ) ;

/**
 * This API can be called in the following modes
 * 
 * GET PivotData/Time
 * GET PivotData/NumQuestions
 *
 * Returns the following data in for the current student as an array of arrays.
 * Each child array has the following elements.
 *
 * [0] - Date - String [dd-mm-YY]
 * [1] - Subject name
 * [2] - Chapter name [<chapter number>.<sub chapter number> - <chapter name>]
 * [3] - value - Integer (can be either num seconds or num questions based on
 *       type of entity requested.)
 */
class PivotDataAPI extends AbstractJoveNotesAPI {

	private $cardRatingDAO = null ;

	private $requestEntity = null ;

	private $startDate     = null ;
	private $endDate       = null ;

	function __construct() {
		parent::__construct() ;
		$this->cardRatingDAO = new CardRatingDAO() ;
	}

	public function doGet( $request, &$response ) {

		$this->logger->info( "Executing doGet in PivotDataAPI" ) ;

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
			throw new Exception( "Entity [Time|NumQuestions] not specified." ) ;
		}
		else{
			$this->requestEntity = $request->requestPathComponents[0] ;
			if( !( $this->requestEntity == 'Time'     || 
				   $this->requestEntity == 'NumQuestions' ) ) {

				throw new Exception( "Invalid entity '$this->requestEntity' specified." ) ;
			}
			else {
				if( $this->requestEntity != 'Subjects' ) {

					$this->startDate = $request->parametersMap[ 'startDate' ] ;
					$this->logger->info( "Parameter[ startDate ] = $this->startDate" ) ;

					$this->endDate = $request->parametersMap[ 'endDate' ] ;
					$this->logger->info( "Parameter[ endDate ] = $this->endDate" ) ;
				}
			}
		}
	}

	private function processRequest() {

		$this->logger->info( "Processing request for entity $this->requestEntity" ) ;
		if( $this->requestEntity == 'Time' ) {
			return $this->getTimeResponse() ;
		}
		else if( $this->requestEntity == 'NumQuestions' ) {
			return $this->getNumQuestionsResponse() ;
		}
	}

	private function getTimeResponse() {

		$pivotRS = $this->cardRatingDAO->getPivotDataForTime(
			              				ExecutionContext::getCurrentUserName(), 
			              				$this->startDate,
			              				$this->endDate ) ;

		return $this->constructResponse( $pivotRS ) ;
	}

	private function getNumQuestionsResponse() {

		$pivotRS = $this->cardRatingDAO->getPivotDataForNumQuestions(
			              				ExecutionContext::getCurrentUserName(), 
			              				$this->startDate,
			              				$this->endDate ) ;

		return $this->constructResponse( $pivotRS ) ;
	}

	private function constructResponse( &$pivotRS ) {

		$respObj = array() ;

    	foreach( $pivotRS as $row ) {

			$rowValues  = array() ;
    		array_push( $rowValues, $row[ "date"         ] ) ;
    		array_push( $rowValues, $row[ "subject_name" ] ) ;
    		array_push( $rowValues, $row[ "chapter_name" ] ) ;
    		array_push( $rowValues, $row[ "value"        ] ) ;

    		array_push( $respObj, $rowValues ) ;
    	}


		return $respObj ;
	}
}

?>