dashboardApp.controller( 'NotesReviewController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Notes Review Page" ;
$scope.$parent.currentReport = 'Review' ;
$scope.reportTitle           = 'Notes Review' ;

// ---------------- Main logic for the controller ------------------------------

$scope.groups = [
    {
      title: 'Dynamic Group Header - 1',
      content: 'Dynamic Group Body - 1',
      open: false
    },
    {
      title: 'Dynamic Group Header - 2',
      content: 'Dynamic Group Body - 2',
      open: false
    }
];

$scope.accordionTabClicked = function( group, $index ) {
    group.open = !group.open ;
    console.log( "Group [ " + $index + " ] " + group.open ) ;
}

// ---------------- Controller methods -----------------------------------------

// ---------------- Private functions ------------------------------------------

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;
