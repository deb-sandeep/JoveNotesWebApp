remoteFlashCardApp.controller( 'RemoteFlashCardController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var lastMessageId = -1 ;
var messages = [] ;
var waitingForUserAcceptance = false ;
var sessionStartTime = 0 ;
var currentQuestionShowStartTime = 0 ;
var durationTillNowInMillis = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.SCREEN_WAITING_TO_START = "waiting_to_start" ;
$scope.SCREEN_SESSION_SETTINGS = "session_settings" ;
$scope.SCREEN_PRACTICE         = "session_practice" ;
$scope.SCREEN_SESSION_END      = "session_end" ;

$scope.alerts   = [] ;
$scope.userName = userName ;
$scope.pageTitle = null ;

$scope.currentScreen = $scope.SCREEN_WAITING_TO_START ;

$scope.sessionId         = 0 ;
$scope.chapterDetails    = null ;
$scope.difficultyStats   = null ;
$scope.progressSnapshot  = null ;
$scope.learningCurveData = null ;
$scope.studyCriteria     = null ;

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
$scope.bodyDivStyle    = { top : 75 } ;

$scope.showQuestionTrigger = "" ;
$scope.showAnswerTrigger   = "" ;

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

$scope.showAnswer = function() {
    $scope.showAnswerTrigger = $scope.sessionId + ".Answer-" 
                                        + $scope.currentQuestion.questionId ;
}

// ---------------- Private functions ------------------------------------------
function runMesssageFetchPump() {

    $http.get( "/jove_notes/api/RemoteFlashMessage?lastMessageId=" + lastMessageId )
    .success( function( data ){
        if( Array.isArray( data ) ) {
            log.debug( "Received " + data.length + " messages from server." ) ;
            for( var i=0; i<data.length; i++ ) {

                // If we recieve a start_session message, we purge out everything
                // from the mesages queue
                if( data[i].msgType == "start_session" ) {
                    messages.length = 0 ;
                    waitingForUserAcceptance = false ;
                } 

                messages.push( data[i] ) ;
                if( i == data.length -1 ) {
                    lastMessageId = data[ i ].id ;
                    log.debug( "Last message id = " + lastMessageId ) ;
                }
            }
        }
    })
    .error( function( data ){
        log.error( "Error getting remote flash messages." + data ) ;
        $scope.addErrorAlert( "Could not receive remote flash messages." + data ) ;
    }) ;
    setTimeout( runMesssageFetchPump, 1000 ) ;
}

function runMessageProcessPump() {

    if( !waitingForUserAcceptance ) {
        while( messages.length > 0 ) {
            var message = messages.shift() ;
            log.debug( "Processing message." ) ;
            log.debug( "    message id   = " + message.id ) ;
            log.debug( "    message type = " + message.msgType ) ;
            log.debug( "    content      = " + JSON.stringify( message.content ) ) ;

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
                else {
                    throw "Unknown message type " + message.msgType ;
                }
            }
            catch( exception ) {
                log.error( "Error processing message." + exception ) ;
            }
        }
    }
    setTimeout( runMessageProcessPump, 300 ) ;
}

function processStartSessionMessage( message ) {

    $scope.sessionId         = message.sessionId ;
    $scope.chapterDetails    = message.content.chapterDetails ;
    $scope.difficultyStats   = message.content.difficultyStats ;
    $scope.progressSnapshot  = message.content.progressSnapshot ;
    $scope.learningCurveData = message.content.learningCurveData ;
    $scope.studyCriteria     = message.content.studyCriteria ;
    
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
    waitingForUserAcceptance = true ;
}

function processIncomingQuestion( message ) {

    $scope.userScore        = message.content.userScore ;
    $scope.progressSnapshot = message.content.progressSnapshot ;
    $scope.sessionStats     = message.content.sessionStats ;
    $scope.currentQuestion  = message.content.currentQuestion ;
    $scope.answerAlign      = message.content.answerAlign ;

    var questionType = message.content.currentQuestion.questionType ;
    var handler = null ;
    if( questionType == QuestionTypes.prototype.QT_FIB ) {
        handler = new FIBHandler( $scope.chapterDetails, 
                                  $scope.currentQuestion ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_QA ) {
        handler = new QAHandler( $scope.chapterDetails, 
                                 $scope.currentQuestion ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_TF ) {
        handler = new TFHandler( $scope.chapterDetails, 
                                 $scope.currentQuestion ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_MATCHING ) {
        handler = new MatchingHandler( $scope.chapterDetails, 
                                       $scope.currentQuestion ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_IMGLABEL ) {
        handler = new ImageLabelHandler( $scope.chapterDetails, 
                                         $scope.currentQuestion ) ;
    }
    else if( questionType == QuestionTypes.prototype.QT_SPELLBEE ) {
        handler = new SpellBeeHandler( $scope.chapterDetails, 
                                       $scope.currentQuestion ) ;
    }
    else {
        log.error( "Unrecognized question type = " + questionType ) ;
        throw "Unrecognized question type. Can't associate formatter." ;
    }
    $scope.currentQuestion.handler = handler ;

    $scope.showQuestionTrigger = message.sessionId + ".Question-" 
                                 + $scope.currentQuestion.questionId ;
    $scope.showAnswerTrigger   = "" ;
}

function handleTimerEvent() {
    if( $scope.currentScreen == $scope.SCREEN_PRACTICE ) {
        refreshClocks() ;
        setTimeout( handleTimerEvent, 1000 ) ;
    }
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime ;

    $scope.sessionDuration = durationTillNowInMillis ;
    $scope.timePerQuestion = durationTillNowInMillis / 
                             ( $scope.sessionStats.numCardsAnswered + 1 ) ;

    $scope.$digest() ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



