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

	if( $scope.$parent.studyCriteria.push ) {
		pushSessionEndMessage() ;
	}
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------
function pushSessionEndMessage() {

	// There is a reason I pass chapter details - This is in case the selection
	// criteria does not select any cards, the session can go straight to end
	// screen - without a start session. In this case, the remote client would
	// not have any clue of the chapter details and hence won't be able to purge
	// the queue.
	$http.post( '/jove_notes/api/RemoteFlashMessage', { 
		sessionId   : $scope.$parent.sessionId,
		chapterId   : $scope.$parent.chapterId,
		msgType     : 'end_session',
		msgContent  : {
			chapterDetails    : $scope.$parent.chapterDetails,
			learningCurveData : $scope.$parent.learningCurveData,
			progressSnapshot  : $scope.$parent.progressSnapshot,
			messageForEndPage : $scope.$parent.messageForEndPage,
			sessionStats      : $scope.$parent.sessionStats
		}
	})
	.error( function( data ){
		var message = "Could not push end session message to remote." ;
		log.error( message ) ;
		log.error( "Server says - " + data ) ;
        $scope.addErrorAlert( message ) ;
	}) ;
}

function checkInvalidLoad() {
	if( $scope.$parent.progressSnapshot == null ) {
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
                                      $scope.$parent.progressSnapshot ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                                      $scope.$parent.learningCurveData ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;