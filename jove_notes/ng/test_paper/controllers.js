testPaperApp.controller( 'TestPaperController', function( $scope, $http, $location, $anchorScroll ) {
// ---------------- Constants and inner class definition -----------------------
$scope.STATE_YET_TO_START = 0 ;
$scope.STATE_STARTED      = 1 ;
$scope.STATE_COMPLETED    = 2 ;
$scope.STATE_PAUSED       = 3 ;

// ---------------- Local variables --------------------------------------------
var jnUtil                   = new JoveNotesUtil() ;
var durationTillNowInMillis  = 0 ;
var sessionStartTime         = null ;
var sessionEndTime           = null ;
var pauseStartTime           = 0 ;
var totalPauseTime           = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts = [] ;

$scope.userName  = userName ;
$scope.chapterId = chapterId ;

$scope.pageTitle = '' ;

$scope.sessionId              = sessionId ;
$scope.chapterDetails         = null ;
$scope.numCardsInDeck         = 0 ;
$scope.difficultyStats        = null ;
$scope.progressSnapshot       = null ;
$scope.difficultyTimeAverages = null ;
$scope.questions              = null ;

$scope.sessionStats = {
    numCards            : 0,
    numCardsLeft        : 0,
    numCardsAnswered    : 0,
    numCardsNotReviewed : 0,
    numWrong            : 0,
    numPartiallyCorrect : 0,
    numCorrect          : 0
} ;

$scope.textFormatter = null ;

$scope.sessionState = 0 ;
$scope.sessionDuration = 0 ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing TestPaperController." ) ;
fetchAndProcessDataFromServer() ;

// -------------Scope watch functions ------------------------------------------

// ---------------- Controller methods -----------------------------------------
$scope.scrollTo = function( id ) {
  $location.hash( id ) ; 
  $anchorScroll() ;
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

$scope.startTest = function() {
    $scope.sessionState = $scope.STATE_STARTED ;
    sessionStartTime = new Date().getTime() ;

    $scope.sessionStats.numCards            = $scope.numCardsInDeck ;
    $scope.sessionStats.numCardsLeft        = $scope.numCardsInDeck ;
    $scope.sessionStats.numCardsAnswered    = 0 ;
    $scope.sessionStats.numCardsNotReviewed = $scope.numCardsInDeck ;
    $scope.sessionStats.numWrong            = $scope.numCardsInDeck ;
    $scope.sessionStats.numPartiallyCorrect = 0 ;
    $scope.sessionStats.numCorrect          = 0 ;

    setTimeout( handleTimerEvent, 100 ) ;
}

$scope.attemptQuestion = function( question, action ) {

    if( action == "Attempt" ) {
        question.state.currentState = "IN_ATTEMPT" ;
    }
    else if( action == "Revise" ) {
        question.state.currentState = "IN_REVIEW" ;
    }
    else if( action == "Done" ) {
        question.state.attemptCount++ ;
        question.state.currentState = "PASSIVE" ;

        $scope.sessionStats.numCardsLeft        = 0 ;
        $scope.sessionStats.numCardsAnswered    = 0 ;
        $scope.sessionStats.numCardsNotReviewed = 0 ;
    }


    for( var i=0; i<$scope.questions.length; i++ ) {
        var q = $scope.questions[i] ;
        if( q != question ) {
            if( question.state.currentState == "PASSIVE" ) {
                q.state.currentState = "PASSIVE" ;
            }
            else {
                q.state.currentState = "DORMANT" ;
            }
        }

        if( action == "Done" ) {
            if( q.state.attemptCount == 0 ) {
                $scope.sessionStats.numCardsLeft++ ;
                $scope.sessionStats.numCardsNotReviewed++ ;
            }
            else {
                if( q.state.attemptCount == 1 ) {
                    $scope.sessionStats.numCardsNotReviewed++ ;
                }
                $scope.sessionStats.numCardsAnswered++ ;
            }
        }
    }

    setTimeout( function(){
        $scope.scrollTo( "question-" + question.questionId ) ;
    }, 100 ) ;
}

$scope.endTest = function() {
    $scope.sessionState = $scope.STATE_COMPLETED ;
}

$scope.rateAnswer = function( currentQuestion, rating ) {
    currentQuestion.state.grade = rating ;

    $scope.sessionStats.numWrong            = 0 ;
    $scope.sessionStats.numPartiallyCorrect = 0 ;
    $scope.sessionStats.numCorrect          = 0 ;

    for( var i=0; i<$scope.questions.length; i++ ) {
        var q = $scope.questions[i] ;
        if( q.state.grade == 'C' ) {
            $scope.sessionStats.numCorrect++;
        }
        else if( q.state.grade == 'P' ) {
            $scope.sessionStats.numPartiallyCorrect++;
        }
        else if( q.state.grade == 'I' ){
            $scope.sessionStats.numWrong++;
        }
    }
}

$scope.pauseSession = function() {
    pauseStartTime = new Date().getTime() ;
    $( '#modalResume' ).modal( 'show' ) ;
}

$scope.resumeSession = function() {
    totalPauseTime += new Date().getTime() - pauseStartTime ;
    pauseStartTime = 0 ;

    $( '#modalResume' ).modal( 'hide' ) ;
}

// ---------------- Private functions ------------------------------------------

function fetchAndProcessDataFromServer() {

    log.debug( "Fetching flash card data from server." ) ;

    $http.get( "/jove_notes/api/FlashCard/" + $scope.chapterId )
         .success( function( data ){
            log.debug( "Received response from server." ) ;
            processServerData( data ) ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function processServerData( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }

    $scope.chapterDetails         = serverData.chapterDetails ;
    $scope.numCardsInDeck         = serverData.deckDetails.numCards ;
    $scope.difficultyStats        = serverData.deckDetails.difficultyStats ;
    $scope.progressSnapshot       = serverData.deckDetails.progressSnapshot ;
    $scope.difficultyTimeAverages = serverData.deckDetails.difficultyTimeAverages ;
    $scope.questions              = serverData.questions ;
    $scope.pageTitle              = jnUtil.constructPageTitle( $scope.chapterDetails ) ;
    $scope.textFormatter          = new TextFormatter( $scope.chapterDetails, null ) ;

    preProcessFlashCardQuestions( $scope.questions ) ;
}

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
        question.state = new InteractionState( question ) ;
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

    if( question.handler != null ) {
        question.handler.initialize() ;
    }
}

function handleTimerEvent() {
    if( $scope.sessionState == $scope.STATE_STARTED ) {
        if( pauseStartTime == 0 ) {
            refreshClocks() ;
        }
        setTimeout( handleTimerEvent, 1000 ) ;
    }
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime - totalPauseTime ;
    $scope.sessionDuration = durationTillNowInMillis ;
    $scope.$digest() ;
}


// ---------------- End of controller ------------------------------------------
} ) ;

// =============================================================================
// =============================================================================
function InteractionState( question ) {

    this.question     = question ;
    this.currentState = "PASSIVE" ;
    this.attemptCount = 0 ;
    this.grade        = 'I' ;
}

testPaperApp.controller( 'TestQuestionController', function( $scope ) {

    $scope.STATE_Q_PASSIVE     = "PASSIVE" ;
    $scope.STATE_Q_IN_ATTEMPT  = "IN_ATTEMPT" ;
    $scope.STATE_Q_IN_REVIEW   = "IN_REVIEW"
    $scope.STATE_Q_DORMANT     = "DORMANT" ;

    $scope.getQuestionPanelStyleClass = function() {

        var sessionState  = $scope.$parent.sessionState ;
        var questionState = $scope.currentQuestion.state.currentState ;
        var cls           = "panel panel-" ;

        if( sessionState == $scope.$parent.STATE_STARTED ) {
            if( questionState == $scope.STATE_Q_IN_REVIEW || questionState == $scope.STATE_Q_IN_ATTEMPT ) {
                cls += "info" ;
            }
            else if( questionState == $scope.STATE_Q_PASSIVE ) {
                if( $scope.currentQuestion.state.attemptCount > 0 ) {
                    cls += "success" ;
                }
                else {
                    cls += "default" ;
                }
            }
        }
        else if( sessionState == $scope.$parent.STATE_COMPLETED ) {
            if( $scope.currentQuestion.state.grade == 'C' ) {
                cls += "success" ;
            }
            else if( $scope.currentQuestion.state.grade == 'P' ) {
                cls += "warning" ;
            }
            else if( $scope.currentQuestion.state.grade == 'I' ){
                cls += "danger" ;
            }
        }

        return cls ;
    }

    $scope.getQuestionPanelBodyClass = function() {
        var state = $scope.currentQuestion.state.currentState ;
        var cls   = "panel-body " ;

        if( $scope.$parent.sessionState == $scope.$parent.STATE_COMPLETED ) {
            cls += "check_answer" ;
        }
        else {
            if( state == $scope.STATE_Q_PASSIVE || state == $scope.STATE_Q_DORMANT ) {
                cls += "passive_question" ;
            }
            else if( state == $scope.STATE_Q_IN_REVIEW || state == $scope.STATE_Q_IN_ATTEMPT ) {
                cls += "active_question" ;
            }
        }

        return cls ;
    }

    $scope.getStateChangeActionBtnClass = function() {

        var question = $scope.currentQuestion ;
        var state    = question.state.currentState ;

        if( state == $scope.STATE_Q_PASSIVE ) {

            if( question.state.attemptCount == 0 ) {
                return "btn btn-warning btn-sm" ;
            }
            else if( question.state.attemptCount == 1 ) {
                return "btn btn-info btn-sm" ;
            }
            return "btn btn-success btn-sm" ;
        }
        else if( state == $scope.STATE_Q_IN_REVIEW || 
                 state == $scope.STATE_Q_IN_ATTEMPT ) {
            return "btn btn-success btn-sm" ;
        }
    }

    $scope.getStateChangeActionCaption = function() {

        var question = $scope.currentQuestion ;
        var state    = question.state.currentState ;

        if( state == $scope.STATE_Q_PASSIVE ) {
            return ( question.state.attemptCount == 0 ) ? "Attempt" : "Revise" ;
        }
        else if( state == $scope.STATE_Q_IN_REVIEW || 
                 state == $scope.STATE_Q_IN_ATTEMPT ) {
            return "Done" ;
        }
        return "ERROR" ;
    }
}) ;
