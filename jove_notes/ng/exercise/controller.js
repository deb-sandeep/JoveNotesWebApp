testPaperApp.controller( 'ExerciseController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var jnUtil                   = new JoveNotesUtil() ;
var durationTillNowInMillis  = 0 ;
var sessionStartTime         = null ;
var sessionEndTime           = null ;
var pauseStartTime           = 0 ;
var totalPauseTime           = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts = [] ;

$scope.userName   = userName ;
$scope.chapterIds = chapterIds ;

$scope.pageTitle       = '' ;
$scope.textFormatter   = null ;
$scope.sessionDuration = 0 ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing ExerciseController." ) ;
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

$scope.startExercise = function() {
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

    log.debug( "Fetching flash card data from server. Chapter ids = " + $scope.chapterIds ) ;

    /*
    $http.get( "/jove_notes/api/FlashCard/" + $scope.chapterId )
         .success( function( data ){
            log.debug( "Received response from server." ) ;
            processServerData( data ) ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
    */
}

function processServerData( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }
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
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime - totalPauseTime ;
    $scope.sessionDuration = durationTillNowInMillis ;
    $scope.$digest() ;
}


// ---------------- End of controller ------------------------------------------
} ) ;
