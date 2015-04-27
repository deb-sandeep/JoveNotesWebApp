flashCardApp.controller( 'FlashCardController', function( $scope ) {

$scope.userName = userName ;
$scope.pageTitle = '' ;
$scope.alerts = [] ;

$scope.rawData = null ;

$scope.learningStats     = null ;
$scope.difficultyStats   = null ;
$scope.learningCurveData = null ;

$scope.addErrorAlert = function( msgString ) {
	$scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
	$scope.alerts.splice( index, 1 ) ;
};

$scope.processRawData = function( rawData ) {
	$scope.rawData = rawData ;
    $scope.learningStats     = rawData.learningStats ;
    $scope.difficultyStats   = rawData.difficultyStats ;
    $scope.learningCurveData = rawData.learningCurveData ;
}

$scope.renderLearningStatsPie = function( divName ) {

    var vals   = [] ;
    var labels = [] ;
    var colors = [] ;

    if( $scope.learningStats.numCardsNS != 0 ) {
        vals.push( $scope.learningStats.numCardsNS ) ;
        labels.push( "NS-" + $scope.learningStats.numCardsNS ) ;
        colors.push( "#D0D0D0" ) ;
    } 
    if( $scope.learningStats.numCardsL0 != 0 ) {
        vals.push( $scope.learningStats.numCardsL0 ) ;
        labels.push( "L0-" + $scope.learningStats.numCardsL0 ) ;
        colors.push( "#FF0000" ) ;
    } 
    if( $scope.learningStats.numCardsL1 != 0 ) {
        vals.push( $scope.learningStats.numCardsL1 ) ;
        labels.push( "L1-" + $scope.learningStats.numCardsL1 ) ;
        colors.push( "#FF7F2A" ) ;
    }
    if( $scope.learningStats.numCardsL2 != 0 ) {
        vals.push( $scope.learningStats.numCardsL2 ) ;
        labels.push( "L2-" + $scope.learningStats.numCardsL2 ) ;
        colors.push( "#FFFF7F" ) ;
    } 
    if( $scope.learningStats.numCardsL3 != 0 ) {
        vals.push( $scope.learningStats.numCardsL3 ) ;
        labels.push( "L3-" + $scope.learningStats.numCardsL3 ) ;
        colors.push( "#AAFFAA" ) ;
    }
    if( $scope.learningStats.numCardsMastered != 0 ) {
        vals.push( $scope.learningStats.numCardsMastered ) ;
        labels.push( "MAS-" + $scope.learningStats.numCardsMastered ) ;
        colors.push( "#00FF00" ) ;
    }

    var pie = new RGraph.Pie(divName, vals)
        .set('gutter.left', 40 )
        .set('gutter.right', 40 )
        .set('gutter.top', 40 )
        .set('gutter.bottom', 40 )
        .set('strokestyle', 'rgba(0,0,0,0)')
        .set('labels', labels )
        .set('colors', colors )
        .draw();
} ;

$scope.renderDifficultyStatsBar = function( divName ) {

    var vals   = [ 
        $scope.difficultyStats.numVE, 
        $scope.difficultyStats.numE, 
        $scope.difficultyStats.numM, 
        $scope.difficultyStats.numH, 
        $scope.difficultyStats.numVH
    ] ;

    var bar = new RGraph.Bar( {
        id     : divName,
        data   : vals,
        options: {
            labels: [ "VE", "E", "M", "H", "VH" ],
            colors: [ "#07FD00", "#9FF79D", "#FDFFB7", "#FFBF46", "#FF6A4E" ],
            gutter: {
                left   : 30,
                right  : 30,
                top    : 30,
                bottom : 30
            },
            background: {
                grid: true
            }
        }
    })
    .set( 'colors.sequential', true )
    .draw();
} ;

$scope.renderLearningCurveGraph = function( divName ) {

    var mline = new RGraph.Line( {
        id: divName,
        data: $scope.learningCurveData,
        options: {
            Background: {
              grid: false 
            },
            ylabels: {
              count: 4
            },
            colors: [ "#D0D0D0", "#FF0000", "#FF7F2A", "#FFFF7F", "#AAFFAA", "#00FF00" ],
            filled: { self: true },
            linewidth: 0.2,
            tickmarks: false,
        }
    })
    .draw() ;

}

// -----------------------------------------------------------------------------
} ) ;



