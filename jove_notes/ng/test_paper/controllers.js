testPaperApp.controller( 'TestPaperController', function( $scope, $http, $location ) {
// ---------------- Constants and inner class definition -----------------------

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

// ---------------- End of controller ------------------------------------------
} ) ;



