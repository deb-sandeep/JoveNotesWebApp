flashCardApp.controller( 'FlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
function StudyCriteria() {
    
    this.maxCards            = 10000 ;
    this.maxTime             = -1 ;
    this.maxResurrectedCards = 10000 ;
    this.maxNewCards         = 10000 ;

    this.currentLevelFilters       = [] ;
    this.learningEfficiencyFilters = [] ;
    this.difficultyFilters         = [] ;
    this.cardTypeFilters           = [] ;
    this.sectionFilters            = [] ;

    this.strategy               = "SSR" ;
    this.sortType               = "Default" ;
    this.push                   = false ;
    this.assistedStudy          = false ;
    this.excludeMarkedForReview = true ;
    this.engageFatigueBuster    = true ;
    this.excludeLT24HrsAttempts = true ;
    this.skipNegativeGrading    = false ;
    this.forceAPMControls       = false ;
    this.selectNSCards          = true ;
    this.selectL0Cards          = true ;
    this.selectL1Cards          = true ;
    this.selectL2Cards          = true ;
    this.selectL3Cards          = true ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'studyCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        const crit = $.cookie('studyCriteria');
        if( typeof crit != 'undefined' ) {
            this.maxCards               = crit.maxCards ;
            this.maxTime                = crit.maxTime ;
            this.maxResurrectedCards    = crit.maxResurrectedCards ;
            this.maxNewCards            = crit.maxNewCards ;
            this.strategy               = crit.strategy ;
            this.sortType               = crit.sortType ;
            this.excludeLT24HrsAttempts = crit.excludeLT24HrsAttempts ;
            this.push                   = crit.push ;
            this.assistedStudy          = crit.assistedStudy ;
            this.excludeMarkedForReview = crit.excludeMarkedForReview ;
            this.engageFatigueBuster    = crit.engageFatigueBuster ;
            this.skipNegativeGrading    = crit.skipNegativeGrading ;
            this.forceAPMControls       = crit.forceAPMControls ;
            this.selectNSCards          = crit.selectNSCards ;
            this.selectL0Cards          = crit.selectL0Cards ;
            this.selectL1Cards          = crit.selectL1Cards ;
            this.selectL2Cards          = crit.selectL2Cards ;
            this.selectL3Cards          = crit.selectL3Cards ;
        }
    }

    this.getMaxCards = function() {
        return this.parseInt( this.maxCards, 10000 ) ;
    }

    this.getMaxTime = function() {
        return this.parseInt( this.maxTime, -1 ) ;
    }

    this.getMaxResurrectedCards = function() {
        return this.parseInt( this.maxResurrectedCards, 10000 ) ;
    }

    this.getMaxNewCards = function() {
        return this.parseInt( this.maxNewCards, 10000 ) ;
    }

    this.parseInt = function( strVal, fallbackValue ) {

        let retVal = strVal ;
        if( typeof retVal === 'string' ) {
            let intVal = parseInt( strVal ) ;
            retVal = isNaN( intVal ) ? fallbackValue : intVal ;
        }
        else if( typeof retVal !== 'number' ) {
            retVal = NaN ;
        }
        return retVal ;
    }

    this.matchesFilter = function( question ) {

        const currentLevel  = question.learningStats.currentLevel;
        const lrnEffLabel   = question.learningStats.efficiencyLabel ;
        const recencyInDays = question.learningStats.recencyInDays ;
        const diffLabel     = question.difficultyLabel ;
        const elementType   = question.elementType ;

        const currentLevelFilters = this.currentLevelFilters ;
        const lrnEffLabelFilters  = this.learningEfficiencyFilters ;
        const diffLabelFilters    = this.difficultyFilters ;
        const cardTypeFilters     = this.cardTypeFilters ;

        if( this.excludeMarkedForReview && question.markedForReview===1 ) {
            return false ;
        }

        if( this.excludeLT24HrsAttempts && recencyInDays < 1 ) {
            return false ;
        }

        let filteredBySelectedSections = false ;
        if( this.sectionFilters.length > 0 ) {
            if( question.section != null ) {
                filteredBySelectedSections = true ;
                for( let i=0; i<this.sectionFilters.length; i++ ) {
                    let selSec = this.sectionFilters[i] ;
                    if( selSec.section === question.section ) {
                        filteredBySelectedSections = false ;
                        break ;
                    }
                }
            }
        }

        if( filteredBySelectedSections ) {
            return false ;
        }

        if( cardTypeFilters.indexOf( elementType ) !== -1 ) {
            if( currentLevelFilters.indexOf( currentLevel ) !== -1 ) {
                if( lrnEffLabelFilters.indexOf( lrnEffLabel ) !== -1 ) {
                    if( diffLabelFilters.indexOf( diffLabel ) !== -1 ) {

                        if( ( this.selectNSCards && currentLevel === 'NS' ) ||
                            ( this.selectL0Cards && currentLevel === 'L0' ) ||
                            ( this.selectL1Cards && currentLevel === 'L1' ) ||
                            ( this.selectL2Cards && currentLevel === 'L2' ) ||
                            ( this.selectL3Cards && currentLevel === 'L3' ) )
                            return true ;
                    }
                }
            }
        }

        return false ;
    }
}

// ---------------- Local variables --------------------------------------------
    const jnUtil = new JoveNotesUtil();

// ---------------- Controller variables ---------------------------------------
$scope.alerts = [] ;

$scope.userName  = userName ;
$scope.chapterId = chapterId ;
$scope.chapterIdsForNextSessions = null ;
$scope.numPendingChapters = 0 ;

if( chapterIdsForNextSessions != null ) {
    $scope.numPendingChapters = chapterIdsForNextSessions.length ;
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
$scope.todayStudyDuration = 0 ;
$scope.curSessionDuration = 0 ;

$scope.messageForEndPage = "Session Ended." ;

$scope.assistedStudyCBDisabled = false ;

$scope.textFormatter = null ;

$scope.currentHistogram    = null ;
$scope.totalCards          = 0 ;
$scope.projectedDuration   = 0 ;

$scope.studyStrategies = [
    new SSR_StudyStrategy(),
    //new RNPT_StudyStrategy(),
    //new RNPTQA_StudyStrategy(),
    new NPT_StudyStrategy(),
    new NPTQA_StudyStrategy(),
    new PT_StudyStrategy(),
    new PTObj_StudyStrategy(),
    new BottomUpL0_StudyStrategy(),
    new BottomUpL1_StudyStrategy(),
    new BottomUpL2_StudyStrategy(),
    new BottomUpL3_StudyStrategy(),
] ;

$scope.sortChoices = [
   "Default",
   "Random",
   "Num Attempts (Asc)",
   "Level (Asc)",
   "Level (Desc)",
   "Recency",
   "Efficiency (Asc)",
   "Efficiency (Desc)",
   "Retention"
] ;

$scope.selectedStudyStrategy = null ;
$scope.filteredCards = [] ;

// ---------------- Main logic for the controller ------------------------------
$scope.studyCriteria.deserialize() ;

// -------------Scope watch functions ------------------------------------------
$scope.initialDigestProcess = true ;

fetchTodayStudyDuration() ;

$scope.$watch( 'studyCriteria.push', function( newValue, oldValue ){
    if( $scope.initialDigestProcess ) {
        $scope.initialDigestProcess = false ;
    }
    else {
        $scope.studyCriteria.assistedStudy = newValue ;
        $scope.assistedStudyCBDisabled = ( newValue === true ) ;
    }
}) ;

$scope.$watch( 'studyCriteria.strategy', function( newVal, oldVal ){
    refreshStudyStrategy( newVal, false ) ;
} ) ;

$scope.$watchGroup( ['studyCriteria.currentLevelFilters',
                     'studyCriteria.learningEfficiencyFilters',
                     'studyCriteria.difficultyFilters',
                     'studyCriteria.cardTypeFilters',
                     'studyCriteria.sectionFilters',
                     'studyCriteria.maxCards',
                     'studyCriteria.sortType',
                     'studyCriteria.maxResurrectedCards',
                     'studyCriteria.maxNewCards',
                     'studyCriteria.excludeMarkedForReview',
                     'studyCriteria.selectNSCards',
                     'studyCriteria.selectL0Cards',
                     'studyCriteria.selectL1Cards',
                     'studyCriteria.selectL2Cards',
                     'studyCriteria.selectL3Cards',
                     'studyCriteria.excludeLT24HrsAttempts'],
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

    preProcessFlashCardQuestions( $scope.chapterDetails, $scope.questions ) ;
    refreshStudyStrategy( $scope.studyCriteria.strategy, true ) ;
}

$scope.selectAllSections = function() {

    if( $scope.chapterDetails != null && 
        $scope.chapterDetails.sections.length>0 ) {

        $scope.studyCriteria.sectionFilters.length = 0 ;
        
        for( let i=0; i<$scope.chapterDetails.sections.length; i++ ) {
            const section = $scope.chapterDetails.sections[i];
            section.selected = 1 ;
            $scope.studyCriteria.sectionFilters.push( section ) ;
        }

        $scope.sectionFilterChanged() ;
        handleFilterChange() ;
    }
}

$scope.sectionFilterChanged = function() {

    for( var i=0; i<$scope.chapterDetails.sections.length; i++ ) {

        var masterSec = $scope.chapterDetails.sections[i] ;
        var selected = false ;

        for( var j=0; j<$scope.studyCriteria.sectionFilters.length; j++ ) {

            var selSec = $scope.studyCriteria.sectionFilters[j] ;
            if( masterSec.section === selSec.section ) {
                selected = true ;
            }
        }
        masterSec.selected = selected ? 1 : 0 ;
    }

    $http.post( '/jove_notes/api/ChapterSection/' + $scope.chapterDetails.chapterId, 
                $scope.chapterDetails.sections ) 
    .success( function( data ){
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

// ---------------- Private functions ------------------------------------------
function fetchTodayStudyDuration() {

    console.log( "Fetching today study time." ) ;
    $http.get( '/jove_notes/api/PivotData/TodayTime', {
        params : {
            'startDate' : null, 
            'endDate'   : null
        }
    })
    .success( function( data ){
        $scope.todayStudyDuration = data * 1000 ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

function preProcessFlashCardQuestions( chapterDetails, questions ) {

    for( i=0; i<questions.length; i++ ) {

        const question = questions[i];

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
        if( question.learningStats.numAttempts !== 0 ) {
            question.learningStats.averageTimeSpent = Math.ceil( question.learningStats.totalTimeSpent / 
                                                                 question.learningStats.numAttempts ) ;
        }

        question.learningStats.fatiguePotential = jnUtil.computeFatiguePotential( question ) ;

        question.scriptObj = jnUtil.makeObjectInstanceFromString( 
                                    question.scriptBody,
                                    $scope.textFormatter.getChapterScript() ) ;

        associateHandler( question ) ;
        processTestDataHints( question ) ;

        for( let j=0; j<$scope.studyStrategies.length; j++ ) {
            $scope.studyStrategies[j].offer( chapterDetails, question ) ;
        }
    }
}

function associateHandler( question ) {

    var questionType = question.questionType ;

    if( questionType === QuestionTypes.prototype.QT_FIB ) {
        question.handler = new FIBHandler( $scope.chapterDetails, question, 
                                           $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.QT_QA ) {
        question.handler = new QAHandler( $scope.chapterDetails, question, 
                                          $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.QT_TF ) {
        question.handler = new TFHandler( $scope.chapterDetails, question,
                                          $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.QT_MATCHING ) {
        question.handler = new MatchingHandler( $scope.chapterDetails, question, 
                                                $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.QT_IMGLABEL ) {
        question.handler = new ImageLabelHandler( $scope.chapterDetails, question, 
                                                  $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.QT_SPELLBEE ) {
        question.handler = new SpellBeeHandler( $scope.chapterDetails, question, 
                                                $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.MULTI_CHOICE ) {
        question.handler = new MultiChoiceHandler( $scope.chapterDetails, question, 
                                                   $scope.textFormatter ) ;
    }
    else if( questionType === QuestionTypes.prototype.VOICE2TEXT ) {
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
        const numMillisLag = question.learningStats._testLATLag * 24 * 60 * 60 * 1000;
        question.learningStats.lastAttemptTime = new Date().getTime() + numMillisLag ;
    }
}

function refreshStudyStrategy( strategyId, forceInitialize ) {

    const studyStrategy = lookupStudyStrategy(strategyId);
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
        if( $scope.studyStrategies[i].id === strategyId ) {
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

    refreshSectionFilters() ;
}

function refreshSectionFilters() {

    if( $scope.chapterDetails != null ) {
        $scope.studyCriteria.sectionFilters.length = 0 ;
        for( var i=0; i<$scope.chapterDetails.sections.length; i++ ) {
            const section = $scope.chapterDetails.sections[i];
            if( section.selected === 1 ) {
                $scope.studyCriteria.sectionFilters.push( section ) ;
            }
        }
    }
}

function refreshStudyCriteriaFilter( filterOptions, filterCriteria ) {
    filterCriteria.length = 0 ;
    for( let i=0; i<filterOptions.length; i++ ) {
        filterCriteria.push( filterOptions[i].id ) ;
    }
}

function handleFilterChange() {
    $scope.filteredCards = $scope.selectedStudyStrategy
                                 .getFilteredCards( $scope.studyCriteria ) ;
    $scope.totalCards = $scope.filteredCards.length ;
    $scope.studyCriteria.serialize() ;

    computeProjectedDuration( $scope.filteredCards ) ;
    updateSelectedCardStatistics( $scope.filteredCards ) ;
}

function computeProjectedDuration( questions ) {

    $scope.projectedDuration = 0 ;
    for( let i = 0; i < questions.length; i++ ) {
        const q = questions[i];
        let avgTime = q.learningStats.averageTimeSpent;
        if( avgTime <= 0 ) {
            avgTime = 30 ;
        }

        $scope.projectedDuration += avgTime ;
    }
    // Convert it into millis as duration decorator takes millis as input
    $scope.projectedDuration *= 1000 ;
}

function updateSelectedCardStatistics( questions ) {

    const statsGenerator = new CardStatistics( questions );
    statsGenerator.computeStatistics() ;

    jnUtil.renderBarChart( "selCardEffStatsChart",     statsGenerator.nuStatistics ) ;
    jnUtil.renderBarChart( "selCardLevelStatsChart",   statsGenerator.levelStatistics ) ;
    jnUtil.renderBarChart( "selCardRecencyStatsChart", statsGenerator.recencyStatistics ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



