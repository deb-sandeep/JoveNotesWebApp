flashCardApp.controller( 'StartPageController', function( $scope, $http, $routeParams ) {
// -----------------------------------------------------------------------------

$scope.$parent.pageTitle = "Flash Card Start Page" ;

fetchAndProcessDataFromServer() ;

// -----------------------------------------------------------------------------
$scope.applyLevel = function( level ) {
    alert( level ) ;
}

// -----------------------------------------------------------------------------
function fetchAndProcessDataFromServer() {

    $http.get( "/jove_notes/api/FlashCard/231" )
         .success( function( data ){
            $scope.processRawData( data ) ;
            renderGraphs() ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function renderGraphs() {

    $scope.renderLearningStatsPie( 'learningStatsPieGraph' ) ;
    $scope.renderDifficultyStatsBar( 'difficultyStatsBarGraph' ) ;
    $scope.renderLearningCurveGraph( 'learningCurveGraph' ) ;
}

// -----------------------------------------------------------------------------
} ) ;