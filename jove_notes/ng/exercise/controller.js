testPaperApp.controller( 'ExerciseController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------
$scope.SESSION_CONFIGURE_STAGE = "SESSION_CONFIGURE_STAGE" ;
$scope.SESSION_EXECUTE_STAGE   = "SESSION_EXECUTE_STAGE" ;
$scope.SESSION_EVALUATE_STAGE  = "SESSION_EVALUATE_STAGE" ;
$scope.SESSION_SUMMARY_STAGE   = "SESSION_SUMMARY_STAGE" ;

$scope.alerts = [] ;

$scope.pageTitle  = '' ;
$scope.userName   = userName ;
$scope.chapterIds = chapterIds ;

$scope.textFormatter   = null ;
$scope.sessionDuration = 0 ;

$scope.exerciseBanks    = [] ;
$scope.exerciseBanksMap = [] ;
$scope.questions        = [] ;

$scope.exerciseSessionId = -1 ;

$scope.durationTillNowInMillis  = 0 ;
$scope.sessionStartTime         = null ;
$scope.sessionEndTime           = null ;
$scope.sessionActive            = false ;

$scope.pauseStartTime = 0 ;
$scope.totalPauseTime = 0 ;

$scope.currentStage = null ;

$scope.fastTrackRequested = false ;

$scope.homHistogram = {} ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing ExerciseController." ) ;

// ---------------- Controller methods -----------------------------------------
$scope.addErrorAlert = function( msgString ) {
    $scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
    $scope.alerts.splice( index, 1 ) ;
};

$scope.purgeAllAlerts = function() {
    $scope.alerts.length = 0 ;
}

$scope.pauseSession = function() {
    $scope.pauseStartTime = new Date().getTime() ;
    $( '#modalResume' ).modal( 'show' ) ;
}

$scope.resumeSession = function() {
    $scope.totalPauseTime += new Date().getTime() - $scope.pauseStartTime ;
    $scope.pauseStartTime = 0 ;

    $( '#modalResume' ).modal( 'hide' ) ;
}

$scope.abortSession = function() {
    bootbox.confirm( "<h3>Are you sure you want to abort this exercise?</h3>" + 
                     "You will not get any credit for the attempted questions.",
        function( okSelected ) {
            if( okSelected ) {
                $window.location.href = "http://" + $window.location.host + 
                                        "/#/Exercises" ;
            }
        }
    ) ;    
}

$scope.fetchAndProcessDataFromServer = function() {

    log.debug( "Fetching flash card data from server. Chapter ids = " + $scope.chapterIds ) ;

    $http.get( "/jove_notes/api/Exercise/ExerciseBanks/" + $scope.chapterIds )
         .success( function( data ){
            log.debug( "Received response from server." ) ;
            processServerData( data ) ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

$scope.getChapterIdsForExercise = function() {
    var ids = [] ;
    for( var i=0; i<$scope.exerciseBanks.length; i++ ) {
        var ex = $scope.exerciseBanks[i] ;
        if( $scope.getSelectedCardsForExercise( ex ) > 0 ) {
            ids.push( ex.chapterDetails.chapterId ) ;
        }
    }
    return ids ;
}

$scope.getTotalSelCards = function( cardLevel ) {
    var totalCards = 0 ;
    for( var i=0; i<$scope.exerciseBanks.length; i++ ) {
        var ex = $scope.exerciseBanks[i] ;
        totalCards += $scope.getSelectedCardsForExercise( ex, cardLevel ) ;
    }
    return totalCards ;
}

$scope.getSelectedCardsForExercise = function( questionBank, cardLevel ) {

    cardLevel = typeof cardLevel !== 'undefined' ? cardLevel : 'Total';

    var totalSelCards = 0 ;
    if( cardLevel == 'NS' ) {
        totalSelCards += ( questionBank._selCfg.ssr.numNSCards ) ;
    }
    else if( cardLevel == 'L0' ) {
        totalSelCards += ( questionBank._selCfg.ssr.numL0Cards + 
                           questionBank._selCfg.nonSSR.numL0Cards ) ;
    }
    else if( cardLevel == 'L1' ) {
        totalSelCards += ( questionBank._selCfg.ssr.numL1Cards + 
                           questionBank._selCfg.nonSSR.numL1Cards ) ;
    }
    else if( cardLevel == 'Total' ) {
        totalSelCards += ( questionBank._selCfg.ssr.numNSCards    + 
                           questionBank._selCfg.ssr.numL0Cards    + 
                           questionBank._selCfg.nonSSR.numL0Cards + 
                           questionBank._selCfg.ssr.numL1Cards    +  
                           questionBank._selCfg.nonSSR.numL1Cards ) ;
    }
    return totalSelCards ;    
}

$scope.startTimer = function() {
    $scope.sessionStartTime = new Date().getTime() ;
    $scope.sessionActive    = true ;
    setTimeout( handleTimerEvent, 1000 ) ;
}

$scope.stopTimer = function() {
    $scope.sessionEndTime = new Date().getTime() ;
    $scope.sessionActive  = false ;
}

$scope.updateHOMHistogram = function( homAttributes ) {

    for( var i=0; i<homAttributes.length; i++ ) {
        var curAttribute = cleanHOMAttribute( homAttributes[i] ) ;
        if( $scope.homHistogram[ curAttribute ] === undefined ) {
            $scope.homHistogram[ curAttribute ] = 1 ;
        }
        else {
            $scope.homHistogram[ curAttribute ] = $scope.homHistogram[ curAttribute ]+1 ;
        }
    }
}

$scope.makeHOMId = function( homName ) {

    var id = homName.replaceAll( " ", "_" ) ;
    id = id.charAt( 0 ).toLowerCase() + id.slice( 1 ) ;
    return id ;
}

// ---------------- Private functions ------------------------------------------
function cleanHOMAttribute( attribute ) {

    var cleanedAttribute = attribute.replaceAll( "_", " " ) ;
    cleanedAttribute = cleanedAttribute.charAt(0).toUpperCase() + cleanedAttribute.slice(1) ;
    return cleanedAttribute ;
}

function processServerData( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }
    else {
        for( var i = 0; i < serverData.length; i++ ) {
            var chapterData = serverData[i] ;
            preProcessChapterData( chapterData ) ;

            $scope.exerciseBanks.push( chapterData ) ;
            $scope.exerciseBanksMap[ chapterData.chapterDetails.chapterId ] = chapterData ;
        } ;
    }
}

function preProcessChapterData( chapterData ) {

    chapterData._textFormatter = new TextFormatter( chapterData.chapterDetails, 
                                                   null ) ;
    chapterData._selCfg = {
        ssr : {
            numNSCards : 0,
            strategyNS : 'Random',
            numL0Cards : 0,
            strategyL0 : 'Random',
            numL1Cards : 0,
            strategyL1 : 'Random'
        },
        nonSSR : {
            numL0Cards : 0,
            strategyL0 : 'Random',
            numL1Cards : 0,
            strategyL1 : 'Random'
        },
    } ;

    var chapterDetails = chapterData.chapterDetails ;
    var textFormatter  = chapterData._textFormatter ;
    var questions      = chapterData.questions ;

    chapterData.deckDetails.progressSnapshot._numSSRMaturedCards = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_NS          = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_L0          = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_L1          = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_L2          = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_L3          = 0 ;
    chapterData.deckDetails.progressSnapshot._numSSR_MAS         = 0 ;

    for( i=0; i<questions.length; i++ ) {

        var question = questions[i] ;

        updateCardLevelCount( chapterData.deckDetails, question ) ;

        question.learningStats._numSecondsInSession  = 0 ;
        question.learningStats._homAttributes = [] ;
        question._chapterDetails = chapterDetails ;
        
        question._difficultyLabel = 
            jnUtil.getDifficultyLevelLabel( question.difficultyLevel ) ;

        question.learningStats._efficiencyLabel = 
            jnUtil.getLearningEfficiencyLabel( question.learningStats.learningEfficiency ) ;

        question.learningStats._absoluteLearningEfficiency = 
            jnUtil.getAbsoluteLearningEfficiency( question.learningStats.temporalScores ) ;

        question.learningStats._averageTimeSpent = 0 ;
        if( question.learningStats.numAttempts != 0 ) {
            question.learningStats._averageTimeSpent = 
                            Math.ceil( question.learningStats.totalTimeSpent / 
                                       question.learningStats.numAttempts ) ;
        }

        question.scriptObj = jnUtil.makeObjectInstanceFromString( 
                                    question.scriptBody,
                                    textFormatter.getChapterScript() ) ;

        associateHandler( chapterDetails, textFormatter, question ) ;
    }
}

function updateCardLevelCount( deckDetails, question ) {

    var ssrThresholdDelta = jnUtil.getSSRThresholdDelta( question ) ;
    question.learningStats._ssrQualified = false ;
    question.learningStats._ssrDelta     = -1 ;

    if( ssrThresholdDelta >= 0 || 
        question.learningStats.currentLevel == 'NS') {

        question.learningStats._ssrQualified = true ;
        question.learningStats._ssrDelta     = ssrThresholdDelta ;

        deckDetails.progressSnapshot._numSSRMaturedCards++ ;

        if( question.learningStats.currentLevel == 'NS' ) {
            deckDetails.progressSnapshot._numSSR_NS++ ;
        }
        else if( question.learningStats.currentLevel == 'L0' ) {
            deckDetails.progressSnapshot._numSSR_L0++ ;
        }
        else if( question.learningStats.currentLevel == 'L1' ) {
            deckDetails.progressSnapshot._numSSR_L1++ ;
        }
        else if( question.learningStats.currentLevel == 'L2' ) {
            deckDetails.progressSnapshot._numSSR_L2++ ;
        }
        else if( question.learningStats.currentLevel == 'L3' ) {
            deckDetails.progressSnapshot._numSSR_L3++ ;
        }
        else if( question.learningStats.currentLevel == 'MAS' ) {
            deckDetails.progressSnapshot._numSSR_MAS++ ;
        }
    }
}

function associateHandler( chapterDetails, textFormatter, question ) {

    var questionType = question.questionType ;

    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        question.handler = new FIBHandler( chapterDetails, question, 
                                           textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        question.handler = new QAHandler( chapterDetails, question, 
                                          textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        question.handler = new TFHandler( chapterDetails, question,
                                          textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        question.handler = new MatchingHandler( chapterDetails, question, 
                                                textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        question.handler = new ImageLabelHandler( chapterDetails, question, 
                                                  textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        question.handler = new SpellBeeHandler( chapterDetails, question, 
                                                textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.MULTI_CHOICE ) {
        question.handler = new MultiChoiceHandler( chapterDetails, question, 
                                                   textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.EXERCISE ) {
        question.handler = new ExerciseHandler( chapterDetails, question, 
                                                textFormatter ) ;
    }
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }

    if( question.handler != null ) {
        question.handler.initialize() ;
    }
}

function handleTimerEvent() {
    if( $scope.sessionActive ) {
        if( $scope.pauseStartTime == 0 ) {
            refreshClocks() ;
            $scope.$broadcast( 'timerEvent' ) ;
            setTimeout( handleTimerEvent, 1000 ) ;
        }
        else {
            setTimeout( handleTimerEvent, 500 ) ;
        }
    }
}

function refreshClocks() {
    $scope.durationTillNowInMillis = new Date().getTime() - 
                                     $scope.sessionStartTime ;

    $scope.sessionDuration = $scope.durationTillNowInMillis - 
                             $scope.totalPauseTime ;
    $scope.$digest() ;
}

// ---------------- End of controller ------------------------------------------
} ) ;
