testPaperApp.controller( 'ExerciseConfigController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
const jnUtil = new JoveNotesUtil();

// ---------------- Controller variables ---------------------------------------
$scope.selChId = 0 ;
$scope.selCh   = null ;

// ---------------- Main logic for the controller ------------------------------
{
    console.log( "Executing ExerciseConfigController." ) ;

    $scope.$parent.pageTitle = "Configure Exercise" ;
    $scope.$parent.currentStage = $scope.$parent.SESSION_CONFIGURE_STAGE ;

    $scope.$parent.fetchAndProcessSelectedExerciseBanksFromServer() ;
}

// -------------Scope watch and event functions --------------------------------
$scope.$on( 'onRenderComplete', function( scope ){
    paintProgressBars() ;
} ) ;

// ---------------- Controller methods -----------------------------------------
$scope.getRowClass = function( chapterId ) {
    if( $scope.selChId == chapterId ) {
        return "selected-row" ;
    }
    return "" ;
}

$scope.addNSProblemIfAvailable = function( chapterId ) {

    console.log( "Adding NS problem for chapterId = " + chapterId ) ;

    $scope.selChId = chapterId ;
    $scope.selCh   = $scope.$parent.exerciseBanksMap[ chapterId ] ;

    if ( ( $scope.selCh.deckDetails.progressSnapshot._numSSR_NS - 
           $scope.selCh._selCfg.ssr.numNSCards ) > 0 ) {
        updateCardSelection( 'ssr', 'NS', 1 ) ;
    }
}

$scope.configureExercise = function( chapterId ) {

    console.log( "Configuring exercise - " + chapterId ) ;

    $scope.selChId = chapterId ;
    $scope.selCh   = $scope.$parent.exerciseBanksMap[ chapterId ] ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                      $scope.selCh.deckDetails.learningCurveData ) ;
}

$scope.incrementCardSelection = function( cardType, cardLevel ) {
    updateCardSelection( cardType, cardLevel, 1 ) ;
}

$scope.decrementCardSelection = function( cardType, cardLevel ) {
    updateCardSelection( cardType, cardLevel, -1 ) ;
}

$scope.executeExercise = function() {
    $scope.$parent.currentStage = $scope.$parent.SESSION_EXECUTE_STAGE ;
    $location.path( "/ExecuteExercise" ) ;
}

// ---------------- Private functions ------------------------------------------

function updateCardSelection( cardType, cardLevel, increment ) {

    const selConfig = (cardType == 'ssr') ?
                       $scope.selCh._selCfg.ssr :
                       $scope.selCh._selCfg.nonSSR ;

    if( cardLevel == 'NS' ) {
        selConfig.numNSCards += increment ;
    }
    else if( cardLevel == 'L0' ) {
        selConfig.numL0Cards += increment ;        
    }
    else if( cardLevel == 'L1' ) {
        selConfig.numL1Cards += increment ;
    }
}

function paintProgressBars() {

    for( let i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {
        const ex = $scope.exerciseBanks[i] ;
        drawProgressBar( 
            "canvas-" + ex.chapterDetails.chapterId, 
            ex.deckDetails.numCards,
            ex.deckDetails.progressSnapshot.numNS,
            ex.deckDetails.progressSnapshot.numL0,
            ex.deckDetails.progressSnapshot.numL1,
            ex.deckDetails.progressSnapshot.numL2,
            ex.deckDetails.progressSnapshot.numL3,
            ex.deckDetails.progressSnapshot.numMAS
        ) ;
    }
}

function drawProgressBar( canvasId, total, vN, v0, v1, v2, v3, v4 ) {

    const c = document.getElementById( canvasId );
    const ctx = c.getContext( "2d" );

    const widths = [];

    widths[0] = Math.round( ( vN/total )*c.width ) ;
    widths[1] = Math.round( ( v0/total )*c.width ) ;
    widths[2] = Math.round( ( v1/total )*c.width ) ;
    widths[3] = Math.round( ( v2/total )*c.width ) ;
    widths[4] = Math.round( ( v3/total )*c.width ) ;
    widths[5] = Math.round( ( v4/total )*c.width ) ;

    const colors = ["#D0D0D0", "#FF0000", "#FF7F2A",
                    "#FFFF7F", "#AAFFAA", "#00FF00"];
    let curX = 0;
    for( let i=0; i<6; i++ )  {
        ctx.fillStyle = colors[i] ;
        ctx.fillRect( curX, 0, widths[i], c.height ) ;
        curX += widths[i] ;
    }
}

// ---------------- Server calls -----------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;