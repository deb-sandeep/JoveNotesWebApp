flashCardApp.controller( 'EndPageController', function( $scope, $http, $routeParams, $location ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------
$scope.learningEfficiency = "" ;

// ---------------- Main logic for the controller ------------------------------
{
	log.debug( "Executing EndPageController." ) ;
	if( checkInvalidLoad() ) {
		log.debug( "Invalid refresh detected. Returning to start page." ) ;
		return ;
	}

	$scope.learningEfficiency = computeLearningEfficiency() ;
	renderGraphs() ;
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------
function checkInvalidLoad() {
	if( $scope.$parent.progressStats == null ) {
		$location.path( "/StartPage" ) ;
		return true ;
	}
	return false ;
}

function computeLearningEfficiency() {

	var numQChosen        = $scope.$parent.sessionStats.numCards - 
	                        $scope.$parent.sessionStats.numCardsLeft ;
	var numCardsAttempted = $scope.$parent.sessionStats.numCardsAnswered ;

	var efficiency = 0 ;

	if( numCardsAttempted > 0 ) {
		efficiency = ( numQChosen * 100 )/numCardsAttempted ;
	}

	return jnUtil.getLearningEfficiencyLabel( efficiency ) ;
}

function renderGraphs() {

    log.debug( "Rendering graphs." ) ;
    jnUtil.renderLearningProgressPie( 'learningStatsPieGraph',
                                      $scope.$parent.progressStats ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                                      $scope.$parent.learningCurveData ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;