flashCardApp.controller( 'StartPageController', function( $scope, $http, $routeParams ) {
// -----------------------------------------------------------------------------

// ---------------- Local variables --------------------------------------------
var jnUtil    = new JoveNotesUtil() ;
var formatter = new QuestionFormatter() ;

// ---------------- Controller variables ---------------------------------------

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing StartPageController." ) ;
fetchAndProcessDataFromServer() ;

// ---------------- Controller methods -----------------------------------------
$scope.applyLevel = function( level ) {
    alert( level ) ;
}

// ---------------- Private functions ------------------------------------------
function fetchAndProcessDataFromServer() {

    log.debug( "Fetching flash card data from server." ) ;

    $http.get( "/jove_notes/api/FlashCard/" + $scope.$parent.chapterId )
         .success( function( data ){
            log.debug( "Received response from server." ) ;
            $scope.processServerData( data ) ;
            renderGraphs() ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function renderGraphs() {

    log.debug( "Rendering graphs." ) ;
    jnUtil.renderLearningProgressPie( 'learningStatsPieGraph',
                                      $scope.$parent.progressSnapshot ) ;

    jnUtil.renderDifficultyStatsBar ( 'difficultyStatsBarGraph',
                                      $scope.$parent.difficultyStats ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                                      $scope.$parent.learningCurveData ) ;
}
// ---------------- End of controller ------------------------------------------
} ) ;