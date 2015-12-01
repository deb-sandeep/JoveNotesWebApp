flashCardApp.controller( 'StartPageController', function( $scope, $http, $route, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing StartPageController." ) ;
fetchAndProcessDataFromServer() ;

// ---------------- Controller methods -----------------------------------------
$scope.applyLevel = function( level ) {

    log.debug( "Applying level " + level + " to all cards." ) ;

    $http.post( '/jove_notes/api/ResetLevel', { 
        chapterId : chapterId,
        level     : level
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "API call failed. " + data ) ;
        }
        else {
            log.debug( "Level successfully applied to all cards" ) ;
            log.debug( "New session created = " + data.sessionId ) ;
            $scope.$parent.sessionId = data.sessionId ;
            log.debug( "Reloading flash card data." ) ;
            $route.reload() ;
        }
    })
    .error( function( data ){
        $scope.addErrorAlert( "API call failed. " + data ) ;
    }) ;
}

$scope.skipChapter = function() {

    if( $scope.$parent.chapterIdsForNextSessions != null ) {
        window.location.href = "/apps/jove_notes/ng/flashcard/index.php?chapterId=" + 
                               $scope.$parent.chapterIdsForNextSessions ;
    }
    else {
        window.location.href = "/apps/jove_notes/ng/dashboard/index.php" ;
    }
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