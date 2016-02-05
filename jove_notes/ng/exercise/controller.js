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

$scope.pageTitle  = '' ;
$scope.userName   = userName ;
$scope.chapterIds = chapterIds ;

$scope.textFormatter   = null ;
$scope.sessionDuration = 0 ;

$scope.exerciseBanks = [] ;

// ---------------- Main logic for the controller ------------------------------
log.debug( "Executing ExerciseController." ) ;

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

$scope.fetchAndProcessDataFromServer = function() {

    log.debug( "Fetching flash card data from server. Chapter ids = " + $scope.chapterIds ) ;

    $http.get( "/jove_notes/api/Exercise/ExerciseBanks/" + $scope.chapterIds )
         .success( function( data ){
            log.debug( "Received response from server." + data ) ;
            processServerData( data ) ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

// ---------------- Private functions ------------------------------------------

function processServerData( serverData ) {

    if( typeof serverData === "string" ) {
        $scope.addErrorAlert( "Server returned invalid data. " + serverData ) ;
        return ;
    }
    else {
        for( var i = 0; i < serverData.length; i++ ) {
            var chapterData = serverData[i] ;
            var chapterId   = chapterData.chapterDetails.chapterId ;
            $scope.exerciseBanks[ chapterId ] = chapterData ;
            preProcessChapterData( chapterData ) ;
        } ;
    }
}

function preProcessChapterData( chapterData ) {

    chapterData.textFormatter = new TextFormatter( chapterData.chapterDetails, 
                                                   null ) ;

    var chapterDetails = chapterData.chapterDetails ;
    var textFormatter  = chapterData.textFormatter ;
    var questions      = chapterData.questions ;

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
                                    textFormatter.getChapterScript() ) ;

        associateHandler( chapterDetails, textFormatter, question ) ;
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
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime - totalPauseTime ;
    $scope.sessionDuration = durationTillNowInMillis ;
    $scope.$digest() ;
}


// ---------------- End of controller ------------------------------------------
} ) ;
