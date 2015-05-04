flashCardApp.controller( 'FlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
function StudyCriteria() {
    
    this.maxCards    = 10000 ;
    this.maxTime     = -1 ;
    this.maxNewCards = 10000 ;

    this.currentLevelFilters       = [ "L0", "L1", "L2", "L3"                  ] ;
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

    this.matchesFilter = function( question ) {

        var currentLevel = question.learningStats.currentLevel ;
        var lrnEffLabel  = question.learningEfficiencyLabel ;
        var diffLabel    = question.difficultyLevelLabel ;

        var currentLevelFilters = this.currentLevelFilters ;
        var lrnEffLabelFilters  = this.learningEfficiencyFilters ;
        var diffLabelFilters    = this.difficultyFilters ;

        if( currentLevelFilters.indexOf( currentLevel ) != -1 ) {
            if( lrnEffLabelFilters.indexOf( lrnEffLabel ) != -1 ) {
                if( diffLabelFilters.indexOf( diffLabel ) != -1 ) {
                    return true ;
                }
            }
        }
        return false ;
    }
}

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var formatter = new QuestionFormatter() ;

// ---------------- Controller variables ---------------------------------------
$scope.userName  = userName ;
$scope.chapterId = chapterId ;

$scope.pageTitle = '' ;
$scope.alerts = [] ;

$scope.studyCriteria = new StudyCriteria() ;
$scope.filterOptions = new CardsFilterOptions() ;

$scope.chapterData       = null ;
$scope.progressStats     = null ;
$scope.learningCurveData = null ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing FlashCardController." ) ;
$scope.studyCriteria.deserialize() ;

// ---------------- Controller methods -----------------------------------------
$scope.addErrorAlert = function( msgString ) {
    $scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
    $scope.alerts.splice( index, 1 ) ;
};

$scope.processServerData = function( data ) {

    if( typeof data === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + data ) ;
        return ;
    }
    
    // We don't assign them to the scope variables directly since we are about
    // to amalgamate them. We don't want watchers kicking in before the data
    // merge.
    var chapterData          = data[0] ;
    var learningStats        = data[1].learningStats ;

    $scope.progressStats     = data[1].progressStats ;
    $scope.learningCurveData = data[1].learningCurveData ;

    formatter.createAndInjectFormattedText( chapterData.questions ) ;
    jnUtil.associateLearningStatsToQuestions( 
                                        chapterData.questions, learningStats ) ;

    $scope.chapterData  = chapterData ;
    $scope.pageTitle    = jnUtil.constructPageTitle( data[0] ) ;
}
// ---------------- Private functions ------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;



