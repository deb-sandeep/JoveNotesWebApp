flashCardApp.controller( 'StartPageController', function( $scope, $http, $route, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing StartPageController." ) ;
fetchAndProcessDataFromServer() ;

// ---------------- Controller methods -----------------------------------------
$scope.skipChapter = function() {

    if( $scope.$parent.chapterIdsForNextSessions != null ) {
        window.location.href = "/apps/jove_notes/ng/flashcard/index.php?firstShow=0&chapterId=" + 
                               $scope.$parent.chapterIdsForNextSessions ;
    }
    else {
        window.location.href = "/apps/jove_notes/ng/dashboard/index.php" ;
    }
}

$scope.shuffleChapter = function() {

    if( $scope.$parent.chapterIdsForNextSessions != null ) {
        window.location.href = "/apps/jove_notes/ng/flashcard/index.php?firstShow=0&chapterId=" + 
                               $scope.$parent.chapterIdsForNextSessions + 
                               "," + $scope.$parent.chapterId ;
    }
    else {
        window.location.href = "/apps/jove_notes/ng/dashboard/index.php" ;
    }
}

$scope.getSectionDisplayClass = function( section ) {
    return (section.selected === 1) ? "selected-section" : "unselected-section" ;
}

// ---------------- Private functions ------------------------------------------
function fetchAndProcessDataFromServer() {

    log.debug( "Fetching flash card data from server." ) ;

    $http.get( "/jove_notes/api/FlashCard/" + $scope.$parent.chapterId )
         .success( function( data ){
            $scope.processServerData( data ) ;
            if( !firstShow && $scope.$parent.totalCards == 0 ) {
                $scope.skipChapter() ;
            }
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
