flashCardApp.controller( 'FlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
function StudyCriteria() {
    
    this.maxCards    = 10000 ;
    this.maxTime     = -1 ;
    this.maxNewCards = 10000 ;

    this.currentLevelFilters       = [] ;
    this.learningEfficiencyFilters = [] ;
    this.difficultyFilters         = [] ;
    this.cardTypeFilters           = [] ;

    this.strategy      = "SSR" ;
    this.push          = false ;
    this.assistedStudy = false ;

    this.showSSRCountsInFilter = true ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'studyCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'studyCriteria' ) ;
        if( typeof crit != 'undefined' ) {
            this.maxCards    = crit.maxCards ;
            this.maxTime     = crit.maxTime ;
            this.maxNewCards = crit.maxNewCards ;

            this.strategy      = crit.strategy ;
            this.push          = crit.push ;
            this.assistedStudy = crit.assistedStudy ;
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
        }
        else {
            log.debug( "\t\tRejecting Q" + question.questionId + 
                       " : Card type filter mismatch. " + elementType ) ;
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

$scope.histogram = {
    all : {
        typeHistogram       : [],
        levelHistogram      : [],
        difficultyHistogram : [],
        efficiencyHistogram : []
    },
    ssr : {
        typeHistogram       : [],
        levelHistogram      : [],
        difficultyHistogram : [],
        efficiencyHistogram : []
    }
}

$scope.currentHistogram = $scope.histogram.all ;
$scope.numSSRCards = 0 ;
$scope.numNonMasteredCards = 0 ;

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

$scope.$watch( 'studyCriteria.showSSRCountsInFilter', function( newVal, oldVal ){

    log.debug( "changed, value = " + $scope.studyCriteria.showSSRCountsInFilter ) ;

    if( $scope.studyCriteria.showSSRCountsInFilter ) {
        $scope.currentHistogram = $scope.histogram.ssr ;
    }
    else {
        $scope.currentHistogram = $scope.histogram.all ;
    }
    refreshCardFilterOptions() ;
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
    refreshCardFilterOptions() ;
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
        collateNonMasteredCardHistogramCount( question ) ;
        collateSSRCardHistogramCount( question ) ;
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
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }
}

function collateNonMasteredCardHistogramCount( question ) {

    if( question.learningStats.currentLevel == "MAS" ) return ;

    $scope.numNonMasteredCards++ ;
    collateHistogramCount( question, $scope.histogram.all ) ;
}

function collateSSRCardHistogramCount( question ) {

    var thresholdDelta = jnUtil.getSSRThresholdDelta( question ) ;
    if( thresholdDelta < 0 && question.learningStats.currentLevel != 'NS' ) return ;

    $scope.numSSRCards++ ;
    collateHistogramCount( question, $scope.histogram.ssr ) ;
}

function collateHistogramCount( question, histCluster ) {

    var cardParentType  = question.elementType ;
    var difficultyLabel = question.difficultyLabel ;
    var currentLevel    = question.learningStats.currentLevel ;
    var efficiencyLabel = question.learningStats.efficiencyLabel ;

    if( histCluster.typeHistogram.hasOwnProperty( cardParentType ) ) {
        histCluster.typeHistogram[ cardParentType ]++ ;
    }
    else {
        histCluster.typeHistogram[ cardParentType ] = 1 ;
    }

    if( histCluster.levelHistogram.hasOwnProperty( currentLevel ) ) {
        histCluster.levelHistogram[ currentLevel ]++ ;
    }
    else {
        histCluster.levelHistogram[ currentLevel ] = 1 ;
    }

    if( histCluster.difficultyHistogram.hasOwnProperty( difficultyLabel ) ) {
        histCluster.difficultyHistogram[ difficultyLabel ]++ ;
    }
    else {
        histCluster.difficultyHistogram[ difficultyLabel ] = 1 ;
    }

    if( histCluster.efficiencyHistogram.hasOwnProperty( efficiencyLabel ) ) {
        histCluster.efficiencyHistogram[ efficiencyLabel ]++ ;
    }
    else {
        histCluster.efficiencyHistogram[ efficiencyLabel ] = 1 ;
    }
}

function processTestDataHints( question ) {

    if( question.learningStats.hasOwnProperty( '_testLATLag' ) ) {
        var numMillisLag = question.learningStats._testLATLag * 24 * 60 * 60 * 1000 ;
        question.learningStats.lastAttemptTime = new Date().getTime() + numMillisLag ;
    }
}

function refreshCardFilterOptions() {

    prepareCardTypeFilterOptions() ;
    prepareCardLevelOptions() ;
    prepareCardDifficultyOptions() ;
    prepareCardEfficiencyOptions() ;
}

function prepareCardTypeFilterOptions() {

    var optionText = [] ;

    optionText[ "word_meaning"    ] = "Word Meaning" ;
    optionText[ "question_answer" ] = "Question Answer" ;
    optionText[ "fib"             ] = "Fill in the blanks" ;
    optionText[ "definition"      ] = "Definition" ;
    optionText[ "character"       ] = "Character" ;
    optionText[ "matching"        ] = "Matching" ;
    optionText[ "event"           ] = "Event" ;
    optionText[ "true_false"      ] = "True False" ;
    optionText[ "chem_equation"   ] = "Chemical Equation" ;
    optionText[ "chem_compound"   ] = "Chemical Compound" ;
    optionText[ "spellbee"        ] = "Spellbee" ;
    optionText[ "image_label"     ] = "Image label" ;
    optionText[ "equation"        ] = "Equation" ;
    optionText[ "rtc"             ] = "Reference to context" ;
    optionText[ "multi_choice"    ] = "Multiple choice" ;  

    populateFilterOptions( $scope.currentHistogram.typeHistogram, optionText, 
                           $scope.filterOptions.cardTypeOptions,
                           $scope.studyCriteria.cardTypeFilters ) ;
}

function prepareCardLevelOptions() {

    var optionText = [] ;

    optionText[ "NS" ] = "Not Started" ;
    optionText[ "L0" ] = "Level 0" ;
    optionText[ "L1" ] = "Level 1" ;
    optionText[ "L2" ] = "Level 2" ;
    optionText[ "L3" ] = "Level 3" ;

    populateFilterOptions( $scope.currentHistogram.levelHistogram, optionText,
                           $scope.filterOptions.currentLevelOptions,
                           $scope.studyCriteria.currentLevelFilters ) ;
}

function prepareCardDifficultyOptions() {

    var optionText = [] ;

    optionText[ "VE" ] = "Very easy" ;
    optionText[ "E"  ] = "Easy" ;
    optionText[ "M"  ] = "Moderate" ;
    optionText[ "H"  ] = "Hard" ;
    optionText[ "VH" ] = "Very hard" ;

    populateFilterOptions( $scope.currentHistogram.difficultyHistogram, optionText,
                           $scope.filterOptions.difficultyOptions,
                           $scope.studyCriteria.difficultyFilters ) ;
}

function prepareCardEfficiencyOptions() {

    var optionText = [] ;

    optionText[ "A1" ] = "A1" ;
    optionText[ "A2" ] = "A2" ;
    optionText[ "B1" ] = "B1" ;
    optionText[ "B2" ] = "B2" ;
    optionText[ "C1" ] = "C1" ;
    optionText[ "C2" ] = "C2" ;
    optionText[ "D"  ] = "D" ;

    populateFilterOptions( $scope.currentHistogram.efficiencyHistogram, optionText,
                           $scope.filterOptions.learningEfficiencyOptions,
                           $scope.studyCriteria.learningEfficiencyFilters ) ;
}

function populateFilterOptions( histogram, keyNameMapping, filterOptions, 
                                filterCriteria ) {

    filterOptions.length = 0 ;
    filterCriteria.length = 0 ;

    for( var key in histogram ) {

        if( histogram.hasOwnProperty( key ) ) {

            var count = histogram[ key ] ;
            if( count > 0 ) {

                var name = 'Unknown Element' ;
                if( keyNameMapping.hasOwnProperty( key ) ) {
                    name = keyNameMapping[ key ] ;
                }

                var str = "" + count ;
                var pad = "000" ;
                str = pad.substring( 0, pad.length - str.length ) + str ;
                str = str + " - " + name ;

                filterOptions.push( {
                    id : key,
                    name : str,
                    count : count
                }) ;

                filterCriteria.push( key ) ;
            }
        }
    }

    filterOptions.sort( function( a, b ){ 
        return b.count - a.count ; 
    } ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



