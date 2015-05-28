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

    this.setDefaultCriteria = function() {
        this.currentLevelFilters       = [ "L0", "L1", "L2", "L3"                  ] ;
        this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
        this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH"            ] ;
    }

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
        var lrnEffLabel  = question.learningStats.efficiencyLabel ;
        var diffLabel    = question.difficultyLabel ;

        var currentLevelFilters = this.currentLevelFilters ;
        var lrnEffLabelFilters  = this.learningEfficiencyFilters ;
        var diffLabelFilters    = this.difficultyFilters ;

        if( currentLevelFilters.indexOf( currentLevel ) != -1 ) {
            if( lrnEffLabelFilters.indexOf( lrnEffLabel ) != -1 ) {
                if( diffLabelFilters.indexOf( diffLabel ) != -1 ) {
                    return true ;
                }
                else {
                    log.debug( "\t\tRejecting Q" + question.questionId + 
                               " : Difficulty level filter mismatch. " + diffLabel ) ;
                }
            }
            else {
                log.debug( "\t\tRejecting Q" + question.questionId + 
                           " : Learning efficiency filter mismatch. " + lrnEffLabel ) ;
            }
        }
        else {
            log.debug( "\t\tRejecting Q" + question.questionId + 
                       " : Current level filter mismatch. " + currentLevel ) ;
        }
        return false ;
    }
}

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts = [] ;

$scope.userName  = userName ;
$scope.chapterId = chapterId ;

$scope.pageTitle = '' ;

$scope.studyCriteria = new StudyCriteria() ;
$scope.filterOptions = new CardsFilterOptions() ;

$scope.chapterDetails    = null ;
$scope.numCardsInDeck    = 0 ;
$scope.difficultyStats   = null ;
$scope.progressSnapshot  = null ;
$scope.learningCurveData = null ;
$scope.questions         = null ;

$scope.pointsEarnedInThisSession = 0 ;
$scope.pointsLostInThisSession = 0 ;

$scope.sessionStats = {
    numCards         : 0,
    numCardsLeft     : 0,
    numCardsAnswered : 0
} ;

$scope.sessionDuration = 0 ;
$scope.timePerQuestion = 0 ;

$scope.messageForEndPage = "Session Ended." ;

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

$scope.processServerData = function( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }
    
    $scope.chapterDetails    = serverData.chapterDetails ;
    $scope.numCardsInDeck    = serverData.deckDetails.numCards ;
    $scope.difficultyStats   = serverData.deckDetails.difficultyStats ;
    $scope.progressSnapshot  = serverData.deckDetails.progressSnapshot ;
    $scope.learningCurveData = serverData.deckDetails.learningCurveData ;
    $scope.questions         = serverData.questions ;

    $scope.pageTitle = jnUtil.constructPageTitle( $scope.chapterDetails ) ;

    preProcessFlashCardQuestions( $scope.questions ) ;
}
// ---------------- Private functions ------------------------------------------

function preProcessFlashCardQuestions( questions ) {

    for( i=0; i<questions.length; i++ ) {

        var question = questions[i] ;

        question.learningStats.numAttemptsInSession = 0 ;
        question.learningStats.numSecondsInSession  = 0 ;
        
        question.difficultyLabel = 
            jnUtil.getDifficultyLevelLabel( question.difficultyLevel ) ;

        question.learningStats.efficiencyLabel = 
            jnUtil.getLearningEfficiencyLabel( question.learningStats.learningEfficiency ) ;

        associateHandler( question ) ;
        processTestDataHints( question ) ;
    }
}

function associateHandler( question ) {

    var questionType = question.questionType ;

    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        question.handler = new FIBHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        question.handler = new QAHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        question.handler = new TFHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        question.handler = new MatchingHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        question.handler = new ImageLabelHandler( $scope.chapterDetails, question ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        question.handler = new SpellBeeHandler( $scope.chapterDetails, question ) ;
    }
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }
}

function processTestDataHints( question ) {

    if( question.learningStats.hasOwnProperty( '_testLATLag' ) ) {
        var numMillisLag = question.learningStats._testLATLag * 24 * 60 * 60 * 1000 ;
        question.learningStats.lastAttemptTime = new Date().getTime() + numMillisLag ;
    }
}

// ---------------- End of controller ------------------------------------------
} ) ;



