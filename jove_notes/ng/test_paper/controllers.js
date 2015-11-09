testPaperApp.controller( 'TestPaperController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------
$scope.STATE_YET_TO_START = 0 ;
$scope.STATE_STARTED      = 1 ;
$scope.STATE_COMPLETED    = 2 ;

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

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
    numCards         : 0,
    numCardsLeft     : 0,
    numCardsAnswered : 0
} ;

$scope.sessionDuration = 0 ;
$scope.timePerQuestion = 0 ;

$scope.textFormatter = null ;

$scope.sessionState = 0 ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing TestPaperController." ) ;
fetchAndProcessDataFromServer() ;

// -------------Scope watch functions ------------------------------------------

// ---------------- Controller methods -----------------------------------------
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
    }
}

$scope.endTest = function() {
    $scope.sessionState = $scope.STATE_COMPLETED ;
}

$scope.rateAnswer = function( currentQuestion, rating ) {
    currentQuestion.state.grade = rating ;
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

// ---------------- End of controller ------------------------------------------
} ) ;

// =============================================================================
// =============================================================================
function InteractionState( question ) {

    this.question     = question ;
    this.currentState = "PASSIVE" ;
    this.attemptCount = 0 ;
    this.grade        = 'N' ;
}

testPaperApp.controller( 'TestQuestionController', function( $scope ) {

    $scope.STATE_Q_PASSIVE     = "PASSIVE" ;
    $scope.STATE_Q_IN_ATTEMPT  = "IN_ATTEMPT" ;
    $scope.STATE_Q_IN_REVIEW   = "IN_REVIEW"
    $scope.STATE_Q_DORMANT     = "DORMANT" ;

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
            else if( state == $scope.IN_REVIEW || state == $scope.STATE_IN_ATTEMPT ) {
                cls += "active_question" ;
            }
        }

        return cls ;
    }

    $scope.getStateChangeActionBtnClass = function() {

        var question = $scope.currentQuestion ;
        var state    = question.state.currentState ;

        if( state == $scope.STATE_Q_PASSIVE ) {
            return ( question.state.attemptCount == 0 ) ? 
                    "btn btn-warning btn-sm" : 
                    "btn btn-info btn-sm" ;
        }
        else if( state == $scope.STATE_Q_IN_REVIEW || state == $scope.STATE_Q_IN_ATTEMPT ) {
            return "btn btn-success btn-sm" ;
        }
    }

    $scope.getStateChangeActionCaption = function() {

        var question = $scope.currentQuestion ;
        var state    = question.state.currentState ;

        if( state == $scope.STATE_Q_PASSIVE ) {
            return ( question.state.attemptCount == 0 ) ? "Attempt" : "Revise" ;
        }
        else if( state == $scope.STATE_Q_IN_REVIEW || state == $scope.STATE_Q_IN_ATTEMPT ) {
            return "Done" ;
        }
        return "ERROR" ;
    }
}) ;
