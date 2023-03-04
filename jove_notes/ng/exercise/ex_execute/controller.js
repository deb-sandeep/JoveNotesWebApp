testPaperApp.controller( 'ExerciseExecutionController', 
                         function( $scope, $http, $routeParams, $location, $window, $anchorScroll ) {

// ---------------- Constants and inner class definition -----------------------
const STUDY_Q_FADEOUT_TIME = 2000 ;
const STUDY_Q_DEFAULT_SHOW_TIME = 15000 ;

// ---------------- Local variables --------------------------------------------
let currentQuestionAttemptStartTime = 0 ;
let evaluateExerciseRouteChange = false ;

const curStudyQ = {
     index: 0,
     displayStartTime: 0,
     fastFwdFlag: false
 } ;

// ---------------- Controller variables ---------------------------------------
$scope.CREATING_SESSION_SCREEN = "CreatingSessionScreen" ;
$scope.STUDY_QUESTIONS_SCREEN  = "StudyQuestionsScreen" ;
$scope.SOLVE_PAPER_SCREEN      = "SolvePaperScreen" ;
$scope.ATTEMPT_SCREEN          = "AttemptScreen" ;

$scope.currentScreen = $scope.CREATING_SESSION_SCREEN ;
$scope.statusMessage = "" ;

$scope.currentQuestion = null ;
$scope.timeSpentOnCurrentQuestion = 0 ;
$scope.pauseStartTime = 0 ;
$scope.lastPauseDuration = 0 ;

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
        $scope.$parent.telemetry.logEvent( "Solve","phase_start", "boundary" ) ;
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

$scope.$on( 'exercisePaused', function( event, args ){

    $scope.pauseStartTime = new Date().getTime() ;
    let curQ = null ;
    if( $scope.currentQuestion != null ) {
        curQ = $scope.currentQuestion ;
    }
    else if( curStudyQ.index > 0 ) {
        const questions = $scope.$parent.questions;
        curQ = questions[curStudyQ.index - 1];
    }
    $scope.$parent.telemetry.logEvent(
        "Solve",
        "pause_start",
        "boundary",
        curQ
    ) ;
} ) ;

$scope.$on( 'exerciseResumed', function( event, args ){

    const pauseDuration = new Date().getTime() - $scope.pauseStartTime;
    let curQ = null ;

    if( $scope.currentQuestion != null ) {
        curQ = $scope.currentQuestion ;
        $scope.currentQuestion._sessionVars.pauseTime += pauseDuration ;
        $scope.$parent.telemetry.updateExQuestionPauseTime( $scope.currentQuestion ) ;
    }
    else if( curStudyQ.index > 0 ) {
        const questions = $scope.$parent.questions;
        curQ = questions[curStudyQ.index - 1];
    }

    $scope.pauseStartTime = 0 ;
    $scope.lastPauseDuration += pauseDuration ;
    $scope.$parent.telemetry.logEvent(
        "Solve",
        "pause_end",
        "boundary",
         curQ
    ) ;
} ) ;

$scope.$on( '$locationChangeStart', function( ev ) {
    if( !evaluateExerciseRouteChange ) {
        ev.preventDefault();
    }
} ) ;

// ---------------- Controller methods -----------------------------------------
$scope.showEvaluateScreen = function() {
    callIfServerAlive( function(){

        // We have completed the exercise and now onto checking the
        // results. Is the exercise complete? No - an exercise is complete
        // only if the evaluation is complete. However, at this point attempt
        // time, review, time etc. is frozen.
        $scope.$parent.telemetry.updateSessionTotalSolveTime() ;

        evaluateExerciseRouteChange = true ;
        $scope.$parent.currentStage = $scope.$parent.SESSION_EVALUATE_STAGE ;
        $scope.$parent.stopTimer() ;

        $scope.$parent.telemetry.logEvent( "Solve","phase_end", "boundary" ) ;

        $location.path( "/EvaluateExercise" ) ;
        $scope.$apply() ;
    },
    function() {
        $scope.addErrorAlert( "Server seems to be down. Check network " + 
                              "connection and try again." ) ;        
    } ) ;
}

$scope.getQuestionPanelClass = function( question ) {
    let cls = "panel ";
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

    $scope.lastPauseDuration = 0 ;
    $scope.currentQuestion = question ;
    $scope.timeSpentOnCurrentQuestion = question._sessionVars.timeSpent ;

    currentQuestionAttemptStartTime = new Date().getTime() ;

    if( question._sessionVars.numAttempts == 0 ) {
        $scope.$parent.telemetry.logEvent( "Solve","attempt_start", "boundary", question ) ;
    }
    else {
        $scope.$parent.telemetry.logEvent( "Solve","review_start", "boundary", question ) ;
    }

    showAttemptScreen() ;
}

$scope.doneAttemptQuestion = function( question ) {

    const timeSpentInAttempt = new Date().getTime() - currentQuestionAttemptStartTime;

    question._sessionVars.numAttempts++ ;
    $scope.$parent.telemetry.updateExQuestionNumAttempts( question ) ;

    question._sessionVars.timeSpent += timeSpentInAttempt ;
    $scope.$parent.telemetry.updateExQuestionTotalTimeTaken( question ) ;

    const timeSpentExcludingPauseDuration = timeSpentInAttempt - $scope.lastPauseDuration ;

    if( question._sessionVars.numAttempts == 1 ) {
        $scope.numQNotStarted-- ;
        question._sessionVars.attemptTime = timeSpentExcludingPauseDuration ;

        $scope.$parent.telemetry.updateExQuestionAttemptTime( question ) ;
        $scope.$parent.telemetry.logEvent( "Solve","attempt_end", "boundary", question ) ;
    }
    else {
        if( question._sessionVars.numAttempts == 2 ) {
            $scope.numQNotReviewed-- ;
            $scope.numQDone++ ;
        }
        question._sessionVars.reviewTime += timeSpentExcludingPauseDuration ;
        $scope.$parent.totalReviewTime += timeSpentExcludingPauseDuration ;

        $scope.$parent.telemetry.updateExQuestionReviewTime( question ) ;
        $scope.$parent.telemetry.updateSessionTotalReviewTime() ;
        $scope.$parent.telemetry.logEvent( "Solve","review_end", "boundary", question ) ;
    }

    currentQuestionAttemptStartTime = 0 ;
    $scope.currentQuestion = null ;

    showSolvePaperScreen() ;

    setTimeout( function(){
        const anchorName = "anchor_q_" + question.questionId;
        $location.hash( anchorName ) ; 
        $anchorScroll() ;
    }, 100 ) ;
}

$scope.toggleMark = function( question ) {
    question._sessionVars.marked = !question._sessionVars.marked ;
    $scope.$parent.telemetry.logEvent(
        "Solve",
        question._sessionVars.marked ? "question_marked" : "question_unmarked",
        "marker",
        $scope.currentQuestion ) ;
}

$scope.fastForwardStudyQuestion = function() {
    curStudyQ.fastFwdFlag = true ;

    const questions = $scope.$parent.questions;
    $scope.$parent.telemetry.logEvent( "Study","fast_forward", "marker",
                                       questions[curStudyQ.index - 1] ) ;
}

// ---------------- Question navigation ----------------------------------------

function transitionStudyQuestion() {

    const questions = $scope.$parent.questions;
    const displayTimeTilLNow = new Date().getTime() - curStudyQ.displayStartTime - $scope.lastPauseDuration ;

    if( curStudyQ.fastFwdFlag == true || displayTimeTilLNow >= STUDY_Q_DEFAULT_SHOW_TIME ) {

        if( $scope.$parent.pauseStartTime > 0 ) {
            // If we are in pause mode
            setTimeout( transitionStudyQuestion, 500 ) ;
        }
        else if( curStudyQ.index > 0 ) {
            const divId = "#study_q_" + questions[curStudyQ.index - 1].questionId;
            $( divId ).fadeOut( STUDY_Q_FADEOUT_TIME, showNextQuestionForStudy ) ;
        }
        else {
            showNextQuestionForStudy() ;
        }
    }
    else {
        setTimeout( transitionStudyQuestion, 500 ) ;
    }
}

function showNextQuestionForStudy() {

    const questions = $scope.$parent.questions;

    // If this is the second+ question being shown for study, set the
    // showForStudy flag of the current question to false so that it is hidden
    // in the UI. We also capture the study time here and telemetry it.
    if( curStudyQ.index > 0 ) {
        const lastQ = questions[ curStudyQ.index - 1 ] ;
        lastQ._sessionVars.showForStudy = false ;
        lastQ._sessionVars.studyTime = new Date().getTime() - curStudyQ.displayStartTime ;
        lastQ._sessionVars.timeSpent += lastQ._sessionVars.studyTime ;

        $scope.$parent.totalStudyTime += lastQ._sessionVars.studyTime ;

        $scope.$parent.telemetry.logEvent(
                                    "Study",
                                    "study_end",
                                    "boundary",
                                    lastQ ) ;

        $scope.$parent.telemetry.updateSessionStudyTime() ;
        $scope.$parent.telemetry.updateExQuestionStudyTime( lastQ ) ;
        $scope.$parent.telemetry.updateExQuestionTotalTimeTaken( lastQ ) ;
    }

    // If we have shown all the questions for study, let's show the full question paper
    if( curStudyQ.index >= questions.length ) {
        $scope.$parent.telemetry.logEvent( "Study","phase_end", "boundary" ) ;
        $scope.$parent.telemetry.logEvent( "Solve","phase_start", "boundary" ) ;
        showSolvePaperScreen() ;
    }
    else {
        // If there are more questions to study, enable the next question
        // to be shown in the study screen.
        const curQ = questions[curStudyQ.index];
        curQ._sessionVars.showForStudy = true ;
        curStudyQ.index++ ;
        $scope.lastPauseDuration = 0 ;

        $scope.$parent.telemetry.logEvent(
                                "Study",
                                "study_start",
                                "boundary",
                                curQ ) ;

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

    $scope.$parent.telemetry.logEvent( "Exercise","phase_start", "boundary" ) ;
    $scope.$parent.telemetry.logEvent( "Study","phase_start", "boundary" ) ;
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

    const currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    console.log( "Calling Exercise API for creating new session." ) ;
    console.log( "\tchapterIds   = " + chapterIds.join()   ) ;

    $http.post( '/jove_notes/api/Exercise/NewSession', { 
        "chapterIds" : chapterIds
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
    const questions = filterQuestionsForSession() ;
    associateSessionVariablesToQuestions( questions ) ;

    $scope.$parent.exerciseSessionId = newSessionData.sessionId ;
    for( const chapterId in newSessionData.exChapterSessionIdMap ) {
        $scope.$parent.exerciseBanksMap[ chapterId ]._sessionId =
                                   newSessionData.exChapterSessionIdMap[ chapterId ] ;
    }

    $scope.$parent.questions = questions ;
    $scope.numQNotStarted    = questions.length ;
    $scope.numQNotReviewed   = questions.length ;
    $scope.numQDone          = 0 ;

    // Create entries in exercise_question and save their primary key to ease
    // future updations
    createExeriseQuestionEntries( $scope.$parent.exerciseSessionId,
                                  $scope.$parent.questions,
                                  function() {
        showStudyQuestionsScreen() ;
        $scope.$parent.startTimer() ;
        $scope.$parent.telemetry.startServerPublishPump() ;
        $scope.$parent.telemetry.updateSessionTotalQuestions() ;
    }) ;
}

function createExeriseQuestionEntries( sessionId, questions, callback ) {

    console.log( "Creating exercise question entries on server." ) ;

    const questionIds = [] ;
    const questionLookupMap = {} ;

    questions.forEach( q => {
        questionIds.push( q.questionId ) ;
        questionLookupMap[ q.questionId ] = q ;
    } ) ;

    $http.post( '/jove_notes/api/ExerciseQuestion', {
        "sessionId" : sessionId,
        "questionIds" : questionIds
    })
    .success( function( data ) {
        console.log( "ExerciseQuestion map created on server." ) ;
        console.log( data ) ;

        // The server sends an array of object, each being a mapping of questionId
        // and exQMapping PK.
        data.forEach( mapping => {
            let question = questionLookupMap[ mapping.questionId ] ;
            question._sessionQuestionId = mapping.exMappingId ;
        }) ;
        callback() ;
    })
    .error( function( data, status ){
         $scope.addErrorAlert( "ExerciseQuestion mapping API call failed. " +
             "Status = " + status + ", " +
             "Response = " + data ) ;
    }) ;
}

function pruneUnusedExerciseBanks() {

    const prunedExBanks = [];
    const prunedExBanksMap = [];

    for( let i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {
        const ex = $scope.exerciseBanks[i];
        if( $scope.$parent.getSelectedCardsForExercise( ex ) > 0 ) {
            prunedExBanks.push( ex ) ;
            prunedExBanksMap[ ex.chapterDetails.chapterId ] = ex ;
        }
    }

    $scope.$parent.exerciseBanks    = prunedExBanks ;
    $scope.$parent.exerciseBanksMap = prunedExBanksMap ;
}

function filterQuestionsForSession() {

    let exQuestions = [];

    for( let i=0; i<$scope.$parent.exerciseBanks.length; i++ ) {

        const ex = $scope.exerciseBanks[i];
        const categorizedQs = categorizeQuestions( ex );
        let   filteredQs = [];

        if( ex._selCfg.ssr.numNSCards > 0 ) {
            filteredQs = filterQuestions( categorizedQs.ssr.nsQuestions,
                                          ex._selCfg.ssr.numNSCards,
                                          ex._selCfg.ssr.strategyNS ) ;
            exQuestions = exQuestions.concat( filteredQs ) ;
        }

        if( ex._selCfg.ssr.numL0Cards > 0 ) {
            filteredQs = filterQuestions( categorizedQs.ssr.l0Questions,
                                          ex._selCfg.ssr.numL0Cards,
                                          ex._selCfg.ssr.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQs ) ;
        }

        if( ex._selCfg.ssr.numL1Cards > 0 ) {
            filteredQs = filterQuestions( categorizedQs.ssr.l1Questions,
                                          ex._selCfg.ssr.numL1Cards,
                                          ex._selCfg.ssr.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQs ) ;
        }

        if( ex._selCfg.nonSSR.numL0Cards > 0 ) {
            filteredQs = filterQuestions( categorizedQs.nonSSR.l0Questions,
                                          ex._selCfg.nonSSR.numL0Cards,
                                          ex._selCfg.nonSSR.strategyL0 ) ;
            exQuestions = exQuestions.concat( filteredQs ) ;
        }

        if( ex._selCfg.nonSSR.numL1Cards > 0 ) {
            filteredQs = filterQuestions( categorizedQs.nonSSR.l1Questions,
                                          ex._selCfg.nonSSR.numL1Cards,
                                          ex._selCfg.nonSSR.strategyL1 ) ;
            exQuestions = exQuestions.concat( filteredQs ) ;
        }
    }

    exQuestions.shuffle() ;
    return exQuestions ;
}

function categorizeQuestions( exercise ) {

    const categorizedQuestions = {
        ssr: {
            nsQuestions: [],
            l0Questions: [],
            l1Questions: []
        },
        nonSSR: {
            l0Questions: [],
            l1Questions: []
        }
    } ;

    for( let i=0; i<exercise.questions.length; i++ ) {
        const q = exercise.questions[i];
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

    const filteredQuestions = [];

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

    for( let i=0; i<numQuestions; i++ ) {
        filteredQuestions.push( questions[i] ) ;
    }
    return filteredQuestions ;
}

function associateSessionVariablesToQuestions( questions ) {

    for( let i=0; i<questions.length; i++ ) {
        questions[i]._sessionVars = {
            index        : i,
            showForStudy : false,
            numAttempts  : 0,
            marked       : false,
            timeSpent    : 0,
            studyTime    : 0,
            attemptTime  : 0,
            reviewTime   : 0,
            pauseTime    : 0,
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