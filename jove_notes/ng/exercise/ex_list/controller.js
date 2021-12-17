testPaperApp.controller( 'ExerciseListController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

    this.useAbsoluteEfficiency     = false ;
    this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
    this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
    this.levelFilters              = [ "NS", "L0" ] ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'notesCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'notesCriteria' ) ;
        if( typeof crit != 'undefined' ) {
            log.debug( "Deserialized filter criteria." ) ;
            this.useAbsoluteEfficiency     = crit.useAbsoluteEfficiency ;
            this.learningEfficiencyFilters = crit.learningEfficiencyFilters ;
            this.difficultyFilters         = crit.difficultyFilters ;
            this.levelFilters              = crit.levelFilters ;
        } ;
    }

    this.setDefaultCriteria = function() {
        this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
        this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
        this.levelFilters              = [ "NS", "L0" ] ;
    }
}

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.showFilterForm = false ;
$scope.filterCriteria = new FilterCriteria() ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseListController." ) ;
    $scope.$parent.fetchAndProcessDataFromServer() ;
}

// ---------------- Controller methods -----------------------------------------
$scope.toggleFilterForm = function() {
    $scope.showFilterForm = !$scope.showFilterForm ;
}


$scope.applyFilter = function() {
    $scope.filterCriteria.serialize() ;
    $scope.toggleFilterForm() ;
    processNotesElements() ;
}

$scope.cancelFilter = function() {
    $scope.showFilterForm = false ;
    $scope.filterCriteria.deserialize() ;
}

// ---------------- Private functions ------------------------------------------

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;