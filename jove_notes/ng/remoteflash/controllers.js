remoteFlashCardApp.controller( 'RemoteFlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil                       = new JoveNotesUtil() ;
var lastMessageId                = -1 ;
var messages                     = [] ;
var waitingForUserAcceptance     = false ;
var sessionStartTime             = 0 ;
var currentQuestionShowStartTime = 0 ;
var durationTillNowInMillis      = 0 ;
var questionTriggerIndex         = 0 ;
var predictedTime                = 0 ;
var avgSelfTime                  = 0 ;

var resumeModalShowTime    = 0 ;
var totalSessionPauseTime  = 0 ;
var totalQuestionPauseTime = 0 ;

var msgPumpDelay = 1000 ;
var msgPumpEmptyCycles = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.SCREEN_WAITING_TO_START = "waiting_to_start" ;
$scope.SCREEN_SESSION_SETTINGS = "session_settings" ;
$scope.SCREEN_PRACTICE         = "session_practice" ;
$scope.SCREEN_SESSION_END      = "session_end" ;

$scope.alerts    = [] ;
$scope.userName  = userName ;
$scope.pageTitle = null ;

$scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;

$scope.sessionId         = 0 ;
$scope.chapterDetails    = null ;
$scope.difficultyStats   = null ;
$scope.progressSnapshot  = null ;
$scope.learningCurveData = null ;
$scope.studyCriteria     = null ;
$scope.textFormatter     = null ;

$scope.sessionStats = {
    numCards         : 0,
    numCardsLeft     : 0,
    numCardsAnswered : 0
} ;

$scope.sessionDuration = 0 ;
$scope.timePerQuestion = 0 ;
$scope.userScore       = 0 ;
$scope.currentQuestion = null ;
$scope.answerAlign     = "center" ;
$scope.bodyDivStyle    = { top : 90 } ;
$scope.ratings         = [] ;

$scope.showQuestionTrigger = "" ;
$scope.showAnswerTrigger   = "" ;

$scope.pointsEarnedInThisSession = 0 ;
$scope.pointsLostInThisSession   = 0 ;
$scope.messageForEndPage         = "" ;

$scope.serverRequestInProgress = false ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing RemoteFlashCardController." ) ;
runMesssageFetchPump() ;
runMessageProcessPump() ;

// ---------------- Controller methods -----------------------------------------
$scope.addErrorAlert = function( msgString ) {
    $scope.alerts.push( { type: 'danger', msg: msgString } ) ;
};

$scope.closeAlert = function(index) {
    $scope.alerts.splice( index, 1 ) ;
};

$scope.resetWaitingForUserAcceptanceFlag = function() {
    log.debug( "Setting waiting for user acceptance flag to false." ) ;
    waitingForUserAcceptance = false ;

    if( $scope.currentScreen == $scope.SCREEN_SESSION_SETTINGS ) {
        $scope.currentScreen = $scope.SCREEN_PRACTICE ;
        sessionStartTime = new Date().getTime() ;
        setTimeout( handleTimerEvent, 1000 ) ;
    }
};

$scope.cancelSessionEndScreen = function() {

    waitingForUserAcceptance = false ;
    $scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;
}

$scope.showAnswer = function() {
    $scope.showAnswerTrigger = $scope.sessionId + ".Answer-" 
                                        + $scope.currentQuestion.questionId ;
}

$scope.increaseFont = function() {
    resizeFont( document.getElementById( "remoteFlashQDiv" ), 1 ) ;
    resizeFont( document.getElementById( "remoteFlashADiv" ), 1 ) ;
}

$scope.decreaseFont = function() {
    resizeFont( document.getElementById( "remoteFlashQDiv" ), -1 ) ;
    resizeFont( document.getElementById( "remoteFlashADiv" ), -1 ) ;
}

// ---------------- Private functions ------------------------------------------
function resizeFont( domElement, magnifier ) {
    var curSize = parseInt( $( domElement ).css( 'font-size' ) ) + magnifier ;
    $( domElement ).css( 'font-size', curSize ) ;
}

function runMesssageFetchPump() {

    var that = this ;

    $scope.serverRequestInProgress = true ;
    $http.get( "/jove_notes/api/RemoteFlashMessage?lastMessageId=" + lastMessageId )
    .success( function( data ){
        $scope.serverRequestInProgress = false ;
        var effectivelyEmptyPayload = true ;

        if( Array.isArray( data ) && (data.length > 0) ) {

            effectivelyEmptyPayload = false ;

            if( data.length == 1 ) {
                if( data[0].msgType == "yet_to_start" ) {
                    effectivelyEmptyPayload = true ;
                }
            }

            if( !effectivelyEmptyPayload ) {
                msgPumpEmptyCycles = 0 ;
            }

            for( var i=0; i<data.length; i++ ) {

                // If we recieve a start_session message, we purge out everything
                // from the mesages queue
                if( data[i].msgType == "start_session" ) {
                    messages.length = 0 ;
                    waitingForUserAcceptance = false ;
                } 

                messages.push( data[i] ) ;
                if( i === ( data.length - 1 ) ) {
                    lastMessageId = data[i].id ;
                }
            }
        }

        if( effectivelyEmptyPayload ) {

            log.debug( "Empty payload. " + msgPumpEmptyCycles ) ;
            msgPumpEmptyCycles++ ;

            if( msgPumpEmptyCycles < 5 ) {
                that.msgPumpDelay = 3000 ;
            }
            else if( msgPumpEmptyCycles >= 5 && msgPumpEmptyCycles < 10 ) {
                that.msgPumpDelay = 5000 ;
            }
            else if( msgPumpEmptyCycles >= 10 && msgPumpEmptyCycles < 50 ) {
                that.msgPumpDelay = 4000 ;
            }
            else {
                that.msgPumpDelay = 7000 ;
            }
        }
        else {
            log.debug( "Payload received at " + msgPumpEmptyCycles ) ;
            that.msgPumpDelay = 3000 ;
        }

        log.debug( "Will invoke pump after " + (that.msgPumpDelay/1000) + " seconds." ) ;
        setTimeout( runMesssageFetchPump, that.msgPumpDelay ) ;
    })
    .error( function( data ){
        log.error( "Error getting remote flash messages." + data ) ;
        $scope.addErrorAlert( "Could not receive remote flash messages." + data ) ;

        log.debug( "Will invoke pump after " + (that.msgPumpDelay/1000) + " seconds." ) ;
        setTimeout( runMesssageFetchPump, that.msgPumpDelay ) ;
    }) ;
}

function runMessageProcessPump() {

    while( messages.length > 0 && !waitingForUserAcceptance ) {

        var message = messages.shift() ;

        try {
            if( message.msgType == "yet_to_start" ) {
                $scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;
            }
            else if( message.msgType == "start_session" ) {
                processStartSessionMessage( message ) ;
            }
            else if( message.msgType == "question" ) {
                processIncomingQuestion( message ) ;
            }
            else if( message.msgType == "answer" ) {
                $scope.showAnswer() ;
            }
            else if( message.msgType == "delta_score" ) {
                processDeltaScoreMessage( message ) ;
            }
            else if( message.msgType == "end_session" ) {
                processEndSessionMessage( message ) ;
            }
            else if( message.msgType == "pause_session" ) {
                pauseSession() ;
            }
            else if( message.msgType == "resume_session" ) {
                resumeSession() ;
            }
            else if( message.msgType == "alert" ) {
                processAlertMessage() ;
            }
            else {
                throw "Unknown message type " + message.msgType ;
            }
        }
        catch( exception ) {
            log.error( "Error processing message." + exception ) ;
        }
    }
    setTimeout( runMessageProcessPump, 300 ) ;
}

function pauseSession() {
    $( '#modalResume' ).modal( 'show' ) ;
    resumeModalShowTime = new Date().getTime() ;
}

function resumeSession() {
    $( '#modalResume' ).modal( 'hide' ) ;
    $( 'body' ).removeClass('modal-open') ;
    $( '.modal-backdrop' ).remove() ;

    if( resumeModalShowTime != 0 ) {
        var pauseTime = new Date().getTime() - resumeModalShowTime ;
        totalSessionPauseTime  += pauseTime ;
        totalQuestionPauseTime += pauseTime ;
    }

    resumeModalShowTime = 0 ;
}

function processEndSessionMessage( message ) {
    
    $scope.chapterDetails    = message.content.chapterDetails ;
    $scope.messageForEndPage = message.content.messageForEndPage ;
    $scope.learningCurveData = message.content.learningCurveData ;
    $scope.progressSnapshot  = message.content.progressSnapshot ;
    $scope.sessionStats      = message.content.sessionStats ;

    jnUtil.renderLearningProgressPie( 'learningStatsPieGraphEnd',
                                      $scope.progressSnapshot ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraphEnd',
                                      $scope.learningCurveData ) ;

    $scope.currentScreen = $scope.SCREEN_SESSION_END ;

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.sessionId,
        chapterId   : $scope.chapterDetails.chapterId,
        msgType     : 'purge_session',
        msgContent  : null
    })
    .error( function( data ){
        var message = "Could not purge messages for this session." ;
        log.error( message ) ;
        log.error( "Server says - " + data ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
    waitingForUserAcceptance = true ;
}

function processDeltaScoreMessage( message ) {

    $scope.userScore += message.content.deltaScore ;
    if( message.content.deltaScore > 0 ) {
        $scope.pointsEarnedInThisSession += message.content.deltaScore ;
    }
    else {
        $scope.pointsLostInThisSession += message.content.deltaScore ;
    }
}

function processStartSessionMessage( message ) {

    $scope.sessionId         = message.sessionId ;
    $scope.userScore         = message.content.userScore ;
    $scope.chapterDetails    = message.content.chapterDetails ;
    $scope.difficultyStats   = message.content.difficultyStats ;
    $scope.progressSnapshot  = message.content.progressSnapshot ;
    $scope.learningCurveData = message.content.learningCurveData ;
    $scope.studyCriteria     = message.content.studyCriteria ;
    $scope.textFormatter     = new TextFormatter( $scope.chapterDetails, null ) ;

    $scope.pointsEarnedInThisSession = 0 ;
    $scope.pointsLostInThisSession   = 0 ;
    
    $scope.studyCriteria.maxCards = 
        ( $scope.studyCriteria.maxCards == 10000 ) ? 
        "Unlimited" : $scope.studyCriteria.maxCards ;

    $scope.studyCriteria.maxTime  = 
        ( $scope.studyCriteria.maxTime == -1 ) ? 
        "Unlimited" : $scope.studyCriteria.maxTime + " minutes" ;

    $scope.studyCriteria.maxNewCards = 
        ( $scope.studyCriteria.maxNewCards == 10000 ) ? 
        "Unlimited" : $scope.studyCriteria.maxNewCards ;

    $scope.pageTitle = jnUtil.constructPageTitle( $scope.chapterDetails ) ;

    jnUtil.renderLearningProgressPie( 'learningStatsPieGraph',
                                      $scope.progressSnapshot ) ;

    jnUtil.renderDifficultyStatsBar ( 'difficultyStatsBarGraph',
                                      $scope.difficultyStats ) ;

    jnUtil.renderLearningCurveGraph ( 'learningCurveGraph',
                                      $scope.learningCurveData ) ;

    $scope.currentScreen = $scope.SCREEN_SESSION_SETTINGS ;

    totalSessionPauseTime  = 0 ;
    totalQuestionPauseTime = 0 ;
    waitingForUserAcceptance = true ;
}

function processIncomingQuestion( message ) {

    $scope.progressSnapshot = message.content.progressSnapshot ;
    $scope.sessionStats     = message.content.sessionStats ;
    $scope.currentQuestion  = message.content.currentQuestion ;
    $scope.answerAlign      = message.content.answerAlign ;
    predictedTime           = message.content.predictedTime ;
    avgSelfTime             = message.content.avgSelfTime ;
    $scope.ratings          = message.content.ratings ;
    $scope.projectedTimeLeft= message.content.projectedTimeLeft ;

    var questionType = message.content.currentQuestion.questionType ;
    var handler = null ;
    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        handler = new FIBHandler( $scope.chapterDetails, $scope.currentQuestion,
                                  $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        handler = new QAHandler( $scope.chapterDetails, $scope.currentQuestion,
                                 $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        handler = new TFHandler( $scope.chapterDetails, $scope.currentQuestion,
                                 $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        handler = new MatchingHandler( $scope.chapterDetails, $scope.currentQuestion,
                                       $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        handler = new ImageLabelHandler( $scope.chapterDetails, $scope.currentQuestion,
                                         $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        handler = new SpellBeeHandler( $scope.chapterDetails, $scope.currentQuestion,
                                       $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.MULTI_CHOICE ) {
        handler = new MultiChoiceHandler( $scope.chapterDetails, $scope.currentQuestion,
                                          $scope.textFormatter ) ;
    }
    else if( questionType == QuestionTypes.prototype.VOICE2TEXT ) {
        handler = new VoiceToTextHandler( $scope.chapterDetails, $scope.currentQuestion, 
                                          $scope.textFormatter ) ;
    }
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }

    $scope.currentQuestion.handler = handler ;
    $scope.currentQuestion.handler.initialize( $scope ) ;

    questionTriggerIndex++ ;

    $scope.showQuestionTrigger = message.sessionId + ".Question-" + questionTriggerIndex ;
    $scope.showAnswerTrigger   = "" ;

    currentQuestionShowStartTime = new Date().getTime() ;
    totalQuestionPauseTime       = 0 ;
    
    renderTimeMarkersForCurrentQuestion() ;
}

function processAlertMessage() {
    jnUtil.playSoundClip( "/lib-app/media/audio/dog_bark.mp3" ) ;
}

function handleTimerEvent() {
    if( $scope.currentScreen == $scope.SCREEN_PRACTICE ) {
        if( resumeModalShowTime == 0 ) {
            refreshClocks() ;
            refreshCardTimeProgressBars() ;
        }
        setTimeout( handleTimerEvent, 1000 ) ;
    }
}

function renderTimeMarkersForCurrentQuestion() {

    var selfAvgTimePct   = (5/9)*avgSelfTime ;
    var predictedTimePct = (5/9)*predictedTime ;

    var mark1 = 0 ; var mark1Class = "" ; var fill1Pct = 0 ;
    var mark2 = 0 ; var mark2Class = "" ; var fill2Pct = 0 ;

    if( selfAvgTimePct == 0 ) { selfAvgTimePct = predictedTimePct ; }

    if( selfAvgTimePct > predictedTimePct ) {
        mark1 = predictedTimePct ;
        mark2 = selfAvgTimePct ;
        mark1Class = "progress-bar progress-bar-info" ;
        mark2Class = "progress-bar progress-bar-warning" ;
    }
    else {
        mark1 = selfAvgTimePct ;
        mark2 = predictedTimePct ;
        mark1Class = "progress-bar progress-bar-warning" ;
        mark2Class = "progress-bar progress-bar-info" ;
    }

    fill1Pct = mark1 - 1 ;
    fill2Pct = mark2 - mark1 -1 ;

    $( "#pb_av_fill1" ).css( "width", fill1Pct + "%" ) ;
    $( "#pb_av_fill2" ).css( "width", fill2Pct + "%" ) ;

    $( "#pb_av_mark1" ).removeClass() ;
    $( "#pb_av_mark2" ).removeClass() ;
    $( "#pb_av_mark1" ).addClass( mark1Class ) ;
    $( "#pb_av_mark2" ).addClass( mark2Class ) ;

    $( "#curr_pb" ).removeClass() ;
    $( "#curr_pb" ).addClass( "progress-bar progress-bar-success" ) ;
}

function refreshCardTimeProgressBars() {

    var delta = Math.ceil(( new Date().getTime() - currentQuestionShowStartTime - totalQuestionPauseTime )/1000) ;

     if( delta > 0 ) {
        var percent = (5/9)*delta ;
        if( percent <= 105 ) {
            $( "#curr_pb" ).css( "width", percent + "%" ) ;
        }

        if( delta > avgSelfTime && 
            delta < (1.5 * avgSelfTime) ) {
            $( "#curr_pb" ).removeClass( "progress-bar-success" ) ;
            $( "#curr_pb" ).addClass( "progress-bar-warning" ) ;
        }
        else if( delta > (1.5*avgSelfTime) ) {
            $( "#curr_pb" ).removeClass( "progress-bar-warning" ) ;
            $( "#curr_pb" ).addClass( "progress-bar-danger" ) ;
        }
    }
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime - totalSessionPauseTime ;

    $scope.sessionDuration = durationTillNowInMillis ;
    $scope.timePerQuestion = durationTillNowInMillis / 
                             ( $scope.sessionStats.numCardsAnswered + 1 ) ;

    $scope.$digest() ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



