flashCardApp.controller( 'FlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
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

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var formatter = new QuestionFormatter() ;

// ---------------- Controller variables ---------------------------------------
$scope.userName  = userName ;
$scope.chapterId = chapterId ;

$scope.pageTitle = '' ;
$scope.alerts = [] ;

$scope.studyCriteria = new StudyCriteria() ;
$scope.filterOptions = new UserLearningFilterOptions() ;

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
    var learningStats        = data[1] ;

    $scope.progressStats     = data[2].progressStats ;
    $scope.learningCurveData = data[2].learningCurveData ;

    formatter.createAndInjectFormattedText( chapterData.questions ) ;
    jnUtil.associateLearningStatsToQuestions( 
                                        chapterData.questions, learningStats ) ;

    $scope.chapterData  = chapterData ;
    $scope.pageTitle    = jnUtil.constructPageTitle( data[0] ) ;
}
// ---------------- Private functions ------------------------------------------

// ---------------- End of controller ------------------------------------------
} ) ;



