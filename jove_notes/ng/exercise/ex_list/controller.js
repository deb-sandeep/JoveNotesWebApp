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
        const crit = $.cookie( 'exListCriteria' );
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
    $scope.$parent.fetchAndProcessSelectedExerciseBanksFromServer( filterCards ) ;
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

$scope.questionNumber = function( question ) {
    let index = question.answer.indexOf( "Chapter:" ) ;
    if( index != -1 ) {
        return question.answer.substring( index ) ;
    }
    return "" ;
}

// ---------------- Private functions ------------------------------------------
function filterCards() {
    console.log( "Filtering cards." ) ;

    $scope.filteredQuestions.length = 0 ;

    for( let i=0; i<$scope.$parent.exerciseBanks[0].questions.length; i++ ) {

        const question = $scope.$parent.exerciseBanks[0].questions[i];

        const curLevel = question.learningStats.currentLevel;
        const numAttempts = question.learningStats.numAttempts;

        for( let j=0; j<$scope.filterCriteria.levelFilters.length; j++ ) {
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
