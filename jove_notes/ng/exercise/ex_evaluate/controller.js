testPaperApp.controller( 'ExerciseEvaluationController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.statusMessage = "Rate each question as per performance." ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseEvaluationController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }
    $scope.$parent.pageTitle = "Evaluate Exercise" ;
}

// ---------------- Controller methods -----------------------------------------
$scope.rateSolution = function( rating, question ) {
    question._sessionVars.rating = rating ;
}

// ---------------- Private functions ------------------------------------------
function checkInvalidLoad() {
    if( $scope.$parent.currentStage != $scope.$parent.SESSION_EVALUATE_STAGE ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;