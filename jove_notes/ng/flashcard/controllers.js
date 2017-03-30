flashCardApp.controller( 'FlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
function StudyCriteria() {
    
    this.maxCards       = 10000 ;
    this.maxTime        = -1 ;
    this.maxNewCards    = 10000 ;

    this.currentLevelFilters       = [] ;
    this.learningEfficiencyFilters = [] ;
    this.difficultyFilters         = [] ;
    this.cardTypeFilters           = [] ;

    this.strategy      = "SSR" ;
    this.push          = false ;
    this.assistedStudy = false ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'studyCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'studyCriteria' ) ;
        if( typeof crit != 'undefined' ) {
            this.maxCards       = crit.maxCards ;
            this.maxTime        = crit.maxTime ;
            this.maxNewCards    = crit.maxNewCards ;
            this.strategy       = crit.strategy ;
            this.push           = crit.push ;
            this.assistedStudy  = crit.assistedStudy ;
        } ;
    }

    this.matchesFilter = function( question ) {

        var currentLevel = question.learningStats.currentLevel ;
        var lrnEffLabel  = question.learningStats.efficiencyLabel ;
        var diffLabel    = question.difficultyLabel ;
        var elementType  = question.elementType ;

        var currentLevelFilters = this.currentLevelFilters ;
        var lrnEffLabelFilters  = this.learningEfficiencyFilters ;
        var diffLabelFilters    = this.difficultyFilters ;
        var cardTypeFilters     = this.cardTypeFilters ;

        if( cardTypeFilters.indexOf( elementType ) != -1 ) {
            if( currentLevelFilters.indexOf( currentLevel ) != -1 ) {
                if( lrnEffLabelFilters.indexOf( lrnEffLabel ) != -1 ) {
                    if( diffLabelFilters.indexOf( diffLabel ) != -1 ) {
                        return true ;
                    }
                }
            }
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
$scope.chapterIdsForNextSessions = null ;

if( chapterIdsForNextSessions != null ) {
    $scope.chapterIdsForNextSessions = chapterIdsForNextSessions.join() ;
}

$scope.pageTitle = '' ;

$scope.studyCriteria = new StudyCriteria() ;
$scope.filterOptions = {
    currentLevelOptions       : [], 
    learningEfficiencyOptions : [],
    difficultyOptions         : [],
    cardTypeOptions           : []
} ;

$scope.sessionId              = sessionId ;
$scope.chapterDetails         = null ;
$scope.numCardsInDeck         = 0 ;
$scope.difficultyStats        = null ;
$scope.progressSnapshot       = null ;
$scope.difficultyTimeAverages = null ;
$scope.learningCurveData      = null ;
$scope.questions              = null ;

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

$scope.assistedStudyCBDisabled = false ;

$scope.textFormatter = null ;

$scope.currentHistogram    = null ;
$scope.totalCards          = 0 ;
$scope.projectedDuration   = 0 ;

$scope.studyStrategies = [
    new SSR_StudyStrategy(),
    new NuHard_StudyStrategy(),
    new NuEasy_StudyStrategy(),
    new Recency_StudyStrategy(),
    new BottomUpL0_StudyStrategy(),
    new BottomUpL1_StudyStrategy(),
    new BottomUpL2_StudyStrategy(),
    new BottomUpL3_StudyStrategy(),
] ;

$scope.selectedStudyStrategy = null ;
$scope.filteredCards = [] ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing FlashCardController." ) ;

$scope.studyCriteria.deserialize() ;

// -------------Scope watch functions ------------------------------------------
$scope.initialDigestProcess = true ;
$scope.$watch( 'studyCriteria.push', function( newValue, oldValue ){
    if( $scope.initialDigestProcess ) {
        $scope.initialDigestProcess = false ;
    }
    else {
        $scope.studyCriteria.assistedStudy = newValue ;
        $scope.assistedStudyCBDisabled = ( newValue == true ) ;
    }
}) ;

$scope.$watch( 'studyCriteria.strategy', function( newVal, oldVal ){
    refreshStudyStrategy( newVal, false ) ;
} ) ;

$scope.$watchGroup( ['studyCriteria.currentLevelFilters',
                     'studyCriteria.learningEfficiencyFilters',
                     'studyCriteria.difficultyFilters',
                     'studyCriteria.cardTypeFilters',
                     'studyCriteria.maxCards',
                     'studyCriteria.maxNewCards'], 
                    function( newVals, oldVals ) {

    handleFilterChange() ;
} ) ;

// ---------------- Controller methods -----------------------------------------
$scope.resumeSession = function() {
    $scope.$broadcast( 'resumeSession.button.click' ) ;
}

$scope.addErrorAlert = function( msgString ) {
    $scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
    $scope.alerts.splice( index, 1 ) ;
};

$scope.purgeAllAlerts = function() {
    log.debug( "Purging all alerts" ) ;
    $scope.alerts.length = 0 ;
}

$scope.processServerData = function( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }

    $scope.chapterDetails         = serverData.chapterDetails ;
    $scope.numCardsInDeck         = serverData.deckDetails.numCards ;
    $scope.difficultyStats        = serverData.deckDetails.difficultyStats ;
    $scope.progressSnapshot       = serverData.deckDetails.progressSnapshot ;
    $scope.difficultyTimeAverages = serverData.deckDetails.difficultyTimeAverages ;
    $scope.learningCurveData      = serverData.deckDetails.learningCurveData ;
    $scope.questions              = serverData.questions ;
    $scope.pageTitle              = jnUtil.constructPageTitle( $scope.chapterDetails ) ;
    $scope.textFormatter          = new TextFormatter( $scope.chapterDetails, null ) ;

    preProcessFlashCardQuestions( $scope.questions ) ;
    refreshStudyStrategy( $scope.studyCriteria.strategy, true ) ;
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

        question.learningStats.absoluteLearningEfficiency = 
            jnUtil.getAbsoluteLearningEfficiency( question.learningStats.temporalScores ) ;

        question.learningStats.recencyInDays = jnUtil.getRecencyInDays( question ) ;

        question.learningStats.averageTimeSpent = 0 ;
        if( question.learningStats.numAttempts != 0 ) {
            question.learningStats.averageTimeSpent = Math.ceil( question.learningStats.totalTimeSpent / 
                                                                 question.learningStats.numAttempts ) ;
        }

        question.scriptObj = jnUtil.makeObjectInstanceFromString( 
                                    question.scriptBody,
                                    $scope.textFormatter.getChapterScript() ) ;

        associateHandler( question ) ;
        processTestDataHints( question ) ;

        for( var j=0; j<$scope.studyStrategies.length; j++ ) {
            $scope.studyStrategies[j].offer( question ) ;
        }
    }
}

function associateHandler( question ) {

    var questionType = question.questionType ;

    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        question.handler = new FIBHandler( $scope.chapterDetails, question, 
                                           $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        question.handler = new QAHandler( $scope.chapterDetails, question, 
                                          $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        question.handler = new TFHandler( $scope.chapterDetails, question,
                                          $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        question.handler = new MatchingHandler( $scope.chapterDetails, question, 
                                                $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        question.handler = new ImageLabelHandler( $scope.chapterDetails, question, 
                                                  $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        question.handler = new SpellBeeHandler( $scope.chapterDetails, question, 
                                                $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.MULTI_CHOICE ) {
        question.handler = new MultiChoiceHandler( $scope.chapterDetails, question, 
                                                   $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.VOICE2TEXT ) {
        question.handler = new VoiceToTextHandler( $scope.chapterDetails, question, 
                                                   $scope.textFormatter ) ;
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

function refreshStudyStrategy( strategyId, forceInitialize ) {

    var studyStrategy = lookupStudyStrategy( strategyId ) ;
    if( forceInitialize ) {
        studyStrategy.initialize() ;
        studyStrategy.sortQuestions() ;
    }
    else {
        if( !studyStrategy.initialized ) {
            studyStrategy.initialize() ;
            studyStrategy.sortQuestions() ;
        }
    }

    $scope.selectedStudyStrategy = studyStrategy ;

    refreshCardFilterOptions() ;
    handleFilterChange() ;
}

function lookupStudyStrategy( strategyId ) {
    var strategy = null ;
    for( var i=0; i<$scope.studyStrategies.length; i++ ) {
        if( $scope.studyStrategies[i].id == strategyId ) {
            strategy = $scope.studyStrategies[i] ;
            break ;
        }
    }
    return strategy ;
}

function refreshCardFilterOptions() {

    $scope.currentHistogram = $scope.selectedStudyStrategy.histograms ;
    $scope.totalCards = $scope.selectedStudyStrategy.questions.length ;
    $scope.filterOptions = $scope.selectedStudyStrategy.filterOptions ;

    refreshStudyCriteriaFilter( $scope.filterOptions.cardTypeOptions,
                                $scope.studyCriteria.cardTypeFilters ) ;
    
    refreshStudyCriteriaFilter( $scope.filterOptions.currentLevelOptions,
                                $scope.studyCriteria.currentLevelFilters ) ;
    
    refreshStudyCriteriaFilter( $scope.filterOptions.difficultyOptions,
                                $scope.studyCriteria.difficultyFilters ) ;
    
    refreshStudyCriteriaFilter( $scope.filterOptions.learningEfficiencyOptions,
                                $scope.studyCriteria.learningEfficiencyFilters ) ;
}

function refreshStudyCriteriaFilter( filterOptions, filterCriteria ) {
    filterCriteria.length = 0 ;
    for( var i=0; i<filterOptions.length; i++ ) {
        filterCriteria.push( filterOptions[i].id ) ;
    }
}

function handleFilterChange() {
    $scope.filteredCards = $scope.selectedStudyStrategy
                                 .getFilteredCards( $scope.studyCriteria ) ;
    $scope.totalCards = $scope.filteredCards.length ;
    computeProjectedDuration( $scope.filteredCards ) ;
    updateSelectedCardStatistics( $scope.filteredCards ) ;
}

function computeProjectedDuration( questions ) {

    $scope.projectedDuration = 0 ;
    for( var i = 0; i < questions.length; i++ ) {
        var q = questions[i] ;
        var avgTime = q.learningStats.averageTimeSpent ;
        if( avgTime == 0 ) {
            avgTime = 30 ;
        }

        $scope.projectedDuration += avgTime ;
    }
    // Convert it into millis as duration decorator takes millis as input
    $scope.projectedDuration *= 1000 ;
}

function updateSelectedCardStatistics( questions ) {

    var statsGenerator = new CardStatistics( questions ) ;
    statsGenerator.computeStatistics() ;

    jnUtil.renderBarChart( "selCardEffStatsChart",     statsGenerator.nuStatistics ) ;
    jnUtil.renderBarChart( "selCardLevelStatsChart",   statsGenerator.levelStatistics ) ;
    jnUtil.renderBarChart( "selCardRecencyStatsChart", statsGenerator.recencyStatistics ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



