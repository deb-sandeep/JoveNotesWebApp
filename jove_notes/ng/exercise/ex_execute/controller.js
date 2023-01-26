testPaperApp.controller( 'ExerciseExecutionController', 
                         function( $scope, $http, $routeParams, $location, $window, $anchorScroll ) {

// ---------------- Constants and inner class definition -----------------------
var STUDY_Q_FADEOUT_TIME = 2000 ;
var STUDY_Q_DEFAULT_SHOW_TIME = 15000 ;

// ---------------- Local variables --------------------------------------------
var currentQuestionAttemptStartTime = 0 ;
var evaluateExerciseRouteChange     = false ;

var curStudyQ = {
    index : 0,
    displayStartTime : 0,
    fastFwdFlag : false
}

// ---------------- Controller variables ---------------------------------------
$scope.CREATING_SESSION_SCREEN = "CreatingSessionScreen" ;
$scope.STUDY_QUESTIONS_SCREEN  = "StudyQuestionsScreen" ;
$scope.SOLVE_PAPER_SCREEN      = "SolvePaperScreen" ;
$scope.ATTEMPT_SCREEN          = "AttemptScreen" ;

$scope.currentScreen = $scope.CREATING_SESSION_SCREEN ;
$scope.statusMessage = "" ;

$scope.currentQuestion = null ;
$scope.timeSpentOnCurrentQuestion = 0 ;

$scope.numQNotStarted  = 0 ;
$scope.numQNotReviewed = 0 ;
$scope.numQDone        = 0 ;

// ---------------- Main logic for the controller ------------------------------
{
    console.log( "Executing ExerciseExecutionController." ) ;

    if( checkInvalidLoad() ) {
        console.log( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }

    $scope.$parent.pageTitle = "Exercise" ;

    // Create a new session at the server. Note that exercise sessions are 
    // different than learning sessions as exercise sessions can contain more
    // than one chapter's learning sessions.
    callExerciseAPIToCreateNewSession( $scope.$parent.getChapterIdsForExercise(), 
                                       0, postSessionCreation ) ;
}

// -------------Scope watch and event functions --------------------------------

$scope.$on( 'onRenderComplete', function( scope ){
    if( $scope.$parent.fastTrackRequested ) {
        showSolvePaperScreen() ;
    }
    else {
        transitionStudyQuestion() ;
    }
} ) ;

$scope.$on( 'timerEvent', function( event, args ){
    if( $scope.currentScreen == $scope.ATTEMPT_SCREEN ) {
        $scope.timeSpentOnCurrentQuestion = 
            $scope.currentQuestion._sessionVars.timeSpent + 
            new Date().getTime() - 
            currentQuestionAttemptStartTime ;
    }
} ) ;

$scope.$on( '$locationChangeStart', function( ev ) {
    if( !evaluateExerciseRouteChange ) {
        ev.preventDefault();
    }
} ) ;

// ---------------- Controller methods -----------------------------------------

$scope.showEvaluateScreen = function() {
    callIfServerAlive( function(){
        evaluateExerciseRouteChange = true ;
        $scope.$parent.currentStage = $scope.$parent.SESSION_EVALUATE_STAGE ;
        $scope.$parent.stopTimer() ;
        $location.path( "/EvaluateExercise" ) ;
        $scope.$apply() ;
    },
    function() {
        $scope.addErrorAlert( "Server seems to be down. Check network " + 
                              "connection and try again." ) ;        
    } ) ;
}

$scope.getQuestionPanelClass = function( question ) {
    var cls = "panel " ;
    if( question._sessionVars.numAttempts == 0 ) {
        cls += "panel-danger" ;
    }
    else if( question._sessionVars.numAttempts == 1 ) {
        cls += "panel-warning" ;
    }
    else if( question._sessionVars.numAttempts > 1 ) {
        cls += "panel-success" ;
    }
    return cls ;
}

$scope.attemptQuestion = function( question, attemptType ) {

    $scope.currentQuestion = question ;
    $scope.timeSpentOnCurrentQuestion = question._sessionVars.timeSpent ;

    // TODO: Make a parent scope level variable to track in question pause time
    //       Reset it here and make use of it during the done attempt question
    currentQuestionAttemptStartTime = new Date().getTime() ;
    showAttemptScreen() ;
}

$scope.doneAttemptQuestion = function( question ) {

    // TODO: Use the in question pause time to compute time spent and reset it 
    //        after using. 
    var timeSpentInAttempt = new Date().getTime() - currentQuestionAttemptStartTime ;

    question._sessionVars.numAttempts++ ;
    question._sessionVars.timeSpent += timeSpentInAttempt ;

    if( question._sessionVars.numAttempts == 1 ) {
        $scope.numQNotStarted-- ;
        question._sessionVars.attemptTime = timeSpentInAttempt ;
    }
    else {
        if( question._sessionVars.numAttempts == 2 ) {
            $scope.numQNotReviewed-- ;
            $scope.numQDone++ ;
        }
        question._sessionVars.reviewTime += timeSpentInAttempt ;
    }

    currentQuestionAttemptStartTime = 0 ;
    $scope.currentQuestion = null ;

    showSolvePaperScreen() ;

    setTimeout( function(){
        var anchorName = "anchor_q_" + question.questionId ;
        $location.hash( anchorName ) ; 
        $anchorScroll() ;
    }, 100 ) ;
}

$scope.toggleMark = function( question ) {
    question._sessionVars.marked = !question._sessionVars.marked ;
}

$scope.fastForwardStudyQuestion = function() {
    curStudyQ.fastFwdFlag = true ;
}

// ---------------- Question navigation ----------------------------------------

function transitionStudyQuestion() {

    var questions = $scope.$parent.questions ;
    var displayTimeTilLNow = new Date().getTime() - curStudyQ.displayStartTime ;

    if( curStudyQ.fastFwdFlag == true || 
        displayTimeTilLNow >= STUDY_Q_DEFAULT_SHOW_TIME ) {

        if( curStudyQ.index > 0 ) {
            var divId = "#study_q_" + questions[ curStudyQ.index - 1 ].questionId ;
            $( divId ).fadeOut( STUDY_Q_FADEOUT_TIME, showNextQuestionForStudy ) ;
        }
        else {
            showNextQuestionForStudy() ;
        }
        return ;
    }
    setTimeout( transitionStudyQuestion, 500 ) ;
}

function showNextQuestionForStudy() {

    var questions = $scope.$parent.questions ;

    if( curStudyQ.index > 0 ) {
        questions[ curStudyQ.index - 1 ]._sessionVars.showForStudy = false ;
    }

    if( curStudyQ.index >= questions.length ) {
        showSolvePaperScreen() ;
        return ;
    }
    else {
        var curQ = questions[ curStudyQ.index ] ;
        curQ._sessionVars.showForStudy = true ;
        curStudyQ.index++ ;

        curStudyQ.displayStartTime = new Date().getTime() ;
        curStudyQ.fastFwdFlag = false ;
        setTimeout( transitionStudyQuestion, 500 ) ;
    }
}

function showStudyQuestionsScreen() {

    $scope.statusMessage = "[Study phase] Each question will show for 30 seconds. " + 
                           "Please read the questions carefully" ;
    $scope.$parent.pageTitle = "Exercise (" + $scope.$parent.questions.length + 
                               " questions) - Study Phase" ;
    $scope.currentScreen = $scope.STUDY_QUESTIONS_SCREEN ;
}

function showSolvePaperScreen() {

    $scope.statusMessage = "[Solve Questions] Click attempt/review for " + 
                           "questions you want to work on." ;
    $scope.$parent.pageTitle = "Exercise (" + $scope.$parent.questions.length + 
                               " questions) - Solve Phase" ;
    $scope.currentScreen = $scope.SOLVE_PAPER_SCREEN ;
}

function showAttemptScreen() {

    $scope.statusMessage = "[Attempt Questions] Solve the question. " +
                           "To go back to question paper, press done."   ;
    $scope.$parent.pageTitle = "Exercise (" + $scope.$parent.questions.length + 
                               " questions) - Attempt Question" ;
    $scope.currentScreen = $scope.ATTEMPT_SCREEN ;
}

function checkInvalidLoad() {
    if( $scope.$parent.currentStage != $scope.$parent.SESSION_EXECUTE_STAGE ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

// ---------------- Session creation -------------------------------------------
/**
 * This function calls on the ExerciseAPI to create a new exercise session.
 *
 * NOTE: This call is recursive! Why? There are times when the API invocation
 * is gracefully disconnected by the server (HTTP??) resulting in a return
 * status code of 0 and data null. In such cases the server code doesn't even
 * receive the request (verified through logs.)
 * 
 *   Under such cases, (only if status code is 0), this function calls upon 
 * itself to retry the call. The retrial will continue for the configured max
 * number of times. If all the retrial attempts fail, an alert will be 
 * displayed to the user.
 *
 * @param chapterIds - An array of chapter ids which are included in this exercise
 */
function callExerciseAPIToCreateNewSession( chapterIds, 
                                            previousCallAttemptNumber,
                                            callback ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    console.log( "Calling Exercise API for creating new session." ) ;
    console.log( "\tchapterIds   = " + chapterIds.join()   ) ;

    $http.post( '/jove_notes/api/Exercise/NewSession', { 
        "chapterIds"   : chapterIds
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "Exercise::NewSession API call failed. " + 
                                  "Server says - " + data ) ;
        }
        else {
            console.log( "New Session created." ) ;
            callback( data ) ;
        }
    })
    .error( function( data, status ){

        if( status == 0 ) {
            console.log( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                console.log( "Retrying the call again." ) ;
                callExerciseAPIToCreateNewSession( 
                    chapterIds, currentCallAttemptNumber 
                ) ;
                return ;
            }
            console.log( "Number of retries exceeded. Notifying the user." ) ;
        }

        $scope.addErrorAlert( "Exercise::NewSession API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + data ) ;
    }) ;
}

function postSessionCreation( newSessionData ) {
    
    pruneUnusedExerciseBanks() ;
    var questions = filterQuestionsForSession() ;
    associateSessionVariablesToQuestions( questions ) ;

    $scope.$parent.exerciseSessionId = newSessionData.sessionId ;
    for( var key in newSessionData.exChapterSessionIdMap ) {
        $scope.$parent.exerciseBanksMap[ key ]._sessionId = 
                                   newSessionData.exChapterSessionIdMap[ key ] ;
    }

    $scope.$parent.questions = questions ;
    $scope.numQNotStarted    = questions.length ;
    $scope.numQNotReviewed   = questions.length ;
    $scope.numQDone          = 0 ;

    showStudyQuestionsScreen() ;

    $scope.$parent.startTimer() ;
}

function pruneUnusedExerciseBanks() {

    var prunedExBanks    = [] ;
    var prunedExBanksMap = [] ;

    for( var i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {
        var ex = $scope.exerciseBanks[i] ;
        if( $scope.$parent.getSelectedCardsForExercise( ex ) > 0 ) {
            prunedExBanks.push( ex ) ;
            prunedExBanksMap[ ex.chapterDetails.chapterId ] = ex ;
        }
    }

    $scope.$parent.exerciseBanks    = prunedExBanks ;
    $scope.$parent.exerciseBanksMap = prunedExBanksMap ;
}

function filterQuestionsForSession() {

    var exQuestions = [] ;

    for( var i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {

        var ex                   = $scope.exerciseBanks[i] ;
        var categorizedQuestions = categorizeQuestions( ex ) ;
        var filteredQuestions    = [] ;

        if( ex._selCfg.ssr.numNSCards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.nsQuestions, 
                                                 ex._selCfg.ssr.numNSCards,
                                                 ex._selCfg.ssr.strategyNS ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.ssr.numL0Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.l0Questions, 
                                                 ex._selCfg.ssr.numL0Cards,
                                                 ex._selCfg.ssr.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.ssr.numL1Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.ssr.l1Questions, 
                                                 ex._selCfg.ssr.numL1Cards,
                                                 ex._selCfg.ssr.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.nonSSR.numL0Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.nonSSR.l0Questions, 
                                                 ex._selCfg.nonSSR.numL0Cards,
                                                 ex._selCfg.nonSSR.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }

        if( ex._selCfg.nonSSR.numL1Cards > 0 ) {
            filteredQuestions = filterQuestions( categorizedQuestions.nonSSR.l1Questions, 
                                                 ex._selCfg.nonSSR.numL1Cards,
                                                 ex._selCfg.nonSSR.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQuestions ) ;
        }
    }

    exQuestions.shuffle() ;
    return exQuestions ;
}

function categorizeQuestions( exercise ) {

    var categorizedQuestions = {
        ssr : {
            nsQuestions : [],
            l0Questions : [],
            l1Questions : []
        },
        nonSSR : {
            l0Questions : [],
            l1Questions : []
        }
    } ;

    for( var i=0; i<exercise.questions.length; i++ ) {
        var q = exercise.questions[i] ;
        if( q.learningStats._ssrQualified ) {
            if( q.learningStats.currentLevel == 'NS' ) {
                categorizedQuestions.ssr.nsQuestions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L0' ) {
                categorizedQuestions.ssr.l0Questions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L1' ) {
                categorizedQuestions.ssr.l1Questions.push( q ) ;
            }
        }
        else {
            if( q.learningStats.currentLevel == 'L0' ) {
                categorizedQuestions.nonSSR.l0Questions.push( q ) ;
            }
            else if( q.learningStats.currentLevel == 'L1' ) {
                categorizedQuestions.nonSSR.l1Questions.push( q ) ;
            }
        }
    }

    return categorizedQuestions ;
}

function filterQuestions( questions, numQuestions, strategy ) {

    var filteredQuestions = [] ;

    if( strategy == 'Hard' ) {
        questions.sort( function( q1, q2 ){
            return -1*( q1.difficultyLevel - 
                        q2.difficultyLevel ) ;
        }) ;
    }
    else if( strategy == 'Age' ) {
        questions.sort( function( q1, q2 ){
            return ( q1.learningStats.lastAttemptTime - 
                     q2.learningStats.lastAttemptTime ) ;
        }) ;
    }
    else if( strategy == 'Random' ) {
        questions.shuffle() ;
    }
    else if( strategy == 'Efficiency_Hard' ) {
        questions.sort( function( q1, q2 ){
            return -1*( q1.learningStats.learningEfficiency - 
                        q2.learningStats.learningEfficiency ) ;
        }) ;
    }
    else if( strategy == 'Efficiency_Easy' ) {
        questions.sort( function( q1, q2 ){
            return ( q1.learningStats.learningEfficiency - 
                     q2.learningStats.learningEfficiency ) ;
        }) ;
    }

    for( var i=0; i<numQuestions; i++ ) {
        filteredQuestions.push( questions[i] ) ;
    }

    return filteredQuestions ;
}

function associateSessionVariablesToQuestions( questions ) {

    for( var i=0; i<questions.length; i++ ) {
        questions[i]._sessionVars = {
            index        : i,
            showForStudy : false,
            numAttempts  : 0,
            marked       : false,
            timeSpent    : 0,
            attemptTime  : 0,
            reviewTime   : 0,
            rating       : null,
            ratingText   : "Not Rated",
            ratingTextCls: "btn btn-sm",
            scoreEarned  : 0,
            newLevel     : questions[i].learningStats.currentLevel
        }
    }
}

// ---------------- End of controller ------------------------------------------
} ) ;