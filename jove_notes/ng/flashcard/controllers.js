flashCardApp.controller( 'FlashCardController', function( $scope ) {
// -----------------------------------------------------------------------------
function StudyCriteria() {
    
    this.maxCards    = -1 ;
    this.maxTime     = -1 ;
    this.maxNewCards = -1 ;

    this.currentLevelFilters       = [ "NS", "L0", "L1", "L2", "L3"            ] ;
    this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
    this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH"            ] ;

    this.strategy = "SSR" ;
    this.push     = false ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'studyCriteria-' + $scope.chapterId, this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'studyCriteria-' + $scope.chapterId ) ;
        if( typeof crit != 'undefined' ) {
            this.maxCards    = crit.maxCards ;
            this.maxTime     = crit.maxTime ;
            this.maxNewCards = crit.maxNewCards ;

            this.currentLevelFilters       = crit.currentLevelFilters ;
            this.learningEfficiencyFilters = crit.learningEfficiencyFilters ;
            this.difficultyFilters         = crit.difficultyFilters ;

            this.strategy = crit.strategy ;
            this.push     = crit.push ;
        } ;
    }
}

function FilterCriteria() {

    this.currentLevelOptions = [ 
        { id : "NS",  name : "Not started" },
        { id : "L0",  name : "Level 0" },
        { id : "L1",  name : "Level 1" },
        { id : "L2",  name : "Level 2" },
        { id : "L3",  name : "Level 3" },
    ] ;

    this.learningEfficiencyOptions = [
        { id : "A1", name : "A1" },
        { id : "A2", name : "A2" },
        { id : "B1", name : "B1" },
        { id : "B2", name : "B2" },
        { id : "C1", name : "C1" },
        { id : "C2", name : "C2" },
        { id : "D" , name : "D"  }
    ] ;

    this.difficultyOptions = [
        { id : "VE", name : "Very easy" },
        { id : "E",  name : "Easy" },
        { id : "M",  name : "Moderate" },
        { id : "H",  name : "Hard" },
        { id : "VH", name : "Very hard" }
    ] ;
}

// -----------------------------------------------------------------------------
$scope.userName  = userName ;
$scope.chapterId = chapterId ;

$scope.pageTitle = 'The title will come from one of the child (route element) controllers.' ;
$scope.alerts = [] ;

$scope.studyCriteria  = new StudyCriteria() ;
$scope.filterCriteria = new FilterCriteria() ;

$scope.rawData = null ;

$scope.learningStats     = null ;
$scope.difficultyStats   = null ;
$scope.learningCurveData = null ;

// -----------------------------------------------------------------------------
$scope.studyCriteria.deserialize() ;

// -----------------------------------------------------------------------------
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
        .set('gutter.left',   30 )
        .set('gutter.right',  30 )
        .set('gutter.top',    30 )
        .set('gutter.bottom', 30 )
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



