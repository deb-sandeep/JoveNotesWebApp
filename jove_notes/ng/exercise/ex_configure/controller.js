testPaperApp.controller( 'ExerciseConfigController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------
$scope.selChapterId   = 0 ;
$scope.selChapterData = null ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseConfigController." ) ;
    $scope.$parent.pageTitle = "Configure Exercise" ;
    $scope.$parent.fetchAndProcessDataFromServer() ;
}

// -------------Scope watch and event functions --------------------------------
$scope.$on( 'onRenderComplete', function( scope ){
    paintProgressBars() ;
} ) ;

// ---------------- Controller methods -----------------------------------------
$scope.getRowClass = function( chapterId ) {
    if( $scope.selChapterId == chapterId ) 
        return "selected-row" ;
    return "" ;
}

$scope.configureExercise = function( chapterId ) {
    log.debug( "Configuring exercise - " + chapterId ) ;

    $scope.selChapterId   = chapterId ;
    $scope.selChapterData = $scope.$parent.exerciseBanksMap[ chapterId ] ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                      $scope.selChapterData.deckDetails.learningCurveData ) ;
}

// ---------------- Private functions ------------------------------------------
function paintProgressBars() {

    for( var i=0; i<$scope.exerciseBanks.length; i++ ) {
        var chapterData = $scope.exerciseBanks[i] ;
        drawProgressBar( "canvas-" + chapterData.chapterDetails.chapterId, 
                         chapterData.questions.length,
                         chapterData.deckDetails.notStartedCards,
                         chapterData.deckDetails.l0Cards,
                         chapterData.deckDetails.l1Cards,
                         chapterData.deckDetails.l2Cards,
                         chapterData.deckDetails.l3Cards,
                         chapterData.deckDetails.masteredCards
                        ) ;
    }
}

function drawProgressBar( canvasId, total, vN, v0, v1, v2, v3, v4 ) {

    var c = document.getElementById( canvasId ) ;
    var ctx = c.getContext( "2d" ) ;

    var widths = [] ;

    widths[0] = Math.round( ( vN/total )*c.width ) ;
    widths[1] = Math.round( ( v0/total )*c.width ) ;
    widths[2] = Math.round( ( v1/total )*c.width ) ;
    widths[3] = Math.round( ( v2/total )*c.width ) ;
    widths[4] = Math.round( ( v3/total )*c.width ) ;
    widths[5] = Math.round( ( v4/total )*c.width ) ;

    var colors = [ "#D0D0D0", "#FF0000", "#FF7F2A", 
                   "#FFFF7F", "#AAFFAA", "#00FF00" ] ;

    var curX = 0 ;
    for( var i=0; i<6; i++ )  {
        ctx.fillStyle = colors[i] ;
        ctx.fillRect( curX, 0, widths[i], c.height ) ;
        curX += widths[i] ;
    }
}

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;