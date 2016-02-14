testPaperApp.controller( 'ExerciseSummaryController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseSummaryController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }
    $scope.$parent.pageTitle = "Performance Summary" ;
}

// ---------------- Controller methods -----------------------------------------
$scope.returnToDashboard = function() {
    window.location.href = "/apps/jove_notes/ng/exercise/index.php" ;
}

$scope.getTotalScore = function() {
    var totalScore = 0 ;
    for( var i=0; i < $scope.$parent.questions.length; i++ ) {
        var q = $scope.$parent.questions[i] ;
        totalScore += q._sessionVars.scoreEarned ;
    }
    return totalScore ;
}

// ---------------- Private functions ------------------------------------------
function checkInvalidLoad() {
    if( $scope.$parent.currentStage != $scope.$parent.SESSION_SUMMARY_STAGE ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;