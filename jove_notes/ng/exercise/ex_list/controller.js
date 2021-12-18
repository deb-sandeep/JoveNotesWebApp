testPaperApp.controller( 'ExerciseListController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

    this.levelFilters      = [ "L0" ] ;
    this.numAttemptFilter  = "1" ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'exListCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'exListCriteria' ) ;
        if( typeof crit != 'undefined' ) {
            log.debug( "Deserialized exercise list filter criteria." ) ;
            this.levelFilters      = crit.levelFilters ;
            this.numAttemptFilters = crit.numAttemptFilters ;
        } ;
    }

    this.setDefaultCriteria = function() {
        this.levelFilters      = [ "L0" ] ;
        this.numAttemptFilters = "1" ;
    }
}

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.showFilterForm = false ;
$scope.filterCriteria = new FilterCriteria() ;
$scope.filterOptions  = new ExerciseFilterOptions() ;

$scope.filteredQuestions = [] ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseListController." ) ;
    $scope.filterCriteria.deserialize() ;
    $scope.$parent.fetchExerciseListingFromServer( filterCards ) ;
}

// ---------------- Controller methods -----------------------------------------
$scope.toggleFilterForm = function() {
    $scope.showFilterForm = !$scope.showFilterForm ;
}


$scope.applyFilter = function() {
    $scope.filterCriteria.serialize() ;
    $scope.toggleFilterForm() ;
    filterCards() ;
}

$scope.cancelFilter = function() {
    $scope.showFilterForm = false ;
    $scope.filterCriteria.deserialize() ;
}

// ---------------- Private functions ------------------------------------------
function filterCards() {
    console.log( "Filtering cards." ) ;

    $scope.filteredQuestions.length = 0 ;

    for( i=0; i<$scope.$parent.exerciseBanks[0].questions.length; i++ ) {

        var question = $scope.$parent.exerciseBanks[0].questions[i] ;

        var curLevel    = question.learningStats.currentLevel ;
        var numAttempts = question.learningStats.numAttempts ;

        for( j=0; j<$scope.filterCriteria.levelFilters.length; j++ ) {
            if( $scope.filterCriteria.levelFilters[j] == curLevel ) {
                if( numAttempts >= $scope.filterCriteria.numAttemptFilter ) {
                    $scope.filteredQuestions.push( question ) ;
                }
            }
        }
    }
}

// ---------------- Server calls -----------------------------------------------


// ---------------- End of controller ------------------------------------------
} ) ;