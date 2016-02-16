testPaperApp.controller( 'ExerciseListController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseListController." ) ;
    $scope.$parent.fetchAndProcessDataFromServer() ;
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;