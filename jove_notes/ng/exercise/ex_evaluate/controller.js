testPaperApp.controller( 'ExerciseEvaluationController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------
const MAX_GRADE_CARD_API_CALL_RETRIES = 3;

// ---------------- Local variables --------------------------------------------
const homDescription = [];

homDescription[ "gathering_data_through_all_senses" ] =
"Gathering data through all senses" ;
    
homDescription[ "persisting" ] = 
    "Persisting" ;
    
homDescription[ "finding_humour" ] = 
    "Finding humour" ;
    
homDescription[ "flexibility" ] = 
    "Flexibility" ;
    
homDescription[ "applying_past_knowledge_to_new_situations" ] = 
    "Applying past knowledge to new situations" ;
    
homDescription[ "listening_with_understanding_and_empathy" ] = 
    "Listening with understanding and empathy" ;
    
homDescription[ "managing_impulsivity" ] = 
    "Managing impulsivity" ;
    
homDescription[ "questioning_and_posing_problems" ] = 
    "Questioning and posing problems" ;
    
homDescription[ "creating_imaginating_and_innovating" ] = 
    "Creating, imagining and innovating" ;
    
homDescription[ "remaining_open_to_continuous_learning" ] = 
    "Remaining open to continuous learning" ;
    
homDescription[ "responding_with_wonderment_and_awe" ] = 
    "Responding with wonderment and awe" ;
    
homDescription[ "striving_for_accuracy" ] = 
    "Striving for accuracy" ;
    
homDescription[ "taking_responsibile_risks" ] = 
    "Taking responsible risks" ;
    
homDescription[ "thinking_about_your_thinking" ] = 
    "Thinking about your thinking" ;
    
homDescription[ "thinking_and_communicating_with_clarity_and_precision" ] = 
    "Thinking and communicating with clarity and precision" ;
    
homDescription[ "thinking_interdependently" ] = 
    "Thinking interdependently" ;

const selectedHOMsForCurrentQuestion = [];
let curQBeingRated = null;

// ---------------- Controller variables ---------------------------------------
$scope.statusMessage     = "Rate each question as per performance." ;
$scope.allQuestionsRated = false ;
$scope.selectedHOMDescription = "" ;
$scope.numCorrect = 0 ;
$scope.totalScore = 0 ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseEvaluationController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }
    $scope.$parent.pageTitle = "Evaluate Exercise" ;
    $scope.$parent.telemetry.logEvent( "Evaluate","phase_start", "boundary" ) ;
}

// ---------------- Controller methods -----------------------------------------
$scope.rateSolution = function( rating, question ) {

    log.debug( "Rating current card as " + rating ) ;
    selectedHOMsForCurrentQuestion.length = 0 ;
    curQBeingRated = question ;

    const cardId = question.questionId;
    const chapterId = question._chapterDetails.chapterId;
    const curLevel = question.learningStats.currentLevel;
    const numAttempts = 1;
    const timeSpent = Math.ceil( question._sessionVars.timeSpent / 1000 );
    const nextLevel = getNextLevel( curLevel, rating );
    const overshootPct = 0;
    const chSessionId = $scope.$parent.exerciseBanksMap[chapterId]._sessionId;

    log.debug( "Card id       = " + question.questionId ) ;
    log.debug( "Current level = " + curLevel ) ;
    log.debug( "Next level    = " + nextLevel ) ;
    log.debug( "Num attempts  = " + numAttempts ) ;
    log.debug( "Time spent    = " + timeSpent ) ;
    log.debug( "Overshoot pct = " + overshootPct ) ;

    $scope.$parent.telemetry.logEvent(
        "Evaluate",
        "question_rated",
        "marker",
        question
    ) ;

    // NOTE: GradeCard API call is asynchronous, that implies that the score
    // of the current question will come sometimes when the user is attempting
    // the next question. This is ok.. the score counter will anyway get updated
    // in a time lagged fashion.. 
    callGradeCardAPI( 
        question,
        chapterId,
        chSessionId, 
        cardId, 
        curLevel, 
        nextLevel, 
        rating, 
        timeSpent,
        numAttempts,
        overshootPct,
        0,
        populateRatingTextAndCls 
    ) ;
}

$scope.showSummaryScreen = function() {
    $scope.$parent.telemetry.updateSessionCompleted() ;
    $scope.$parent.currentStage = $scope.$parent.SESSION_SUMMARY_STAGE ;
    $scope.$parent.telemetry.printQueue() ;
    $scope.$parent.telemetry.logEvent( "Evaluate","phase_end", "boundary" ) ;
    $scope.$parent.telemetry.logEvent( "Exercise","phase_end", "boundary" ) ;
    $location.path( "/ExerciseSummary" ) ;
}

$scope.showTimeDuration = function( q ) {
    if( !$scope.$parent.fastTrackRequested ) {
         return q._sessionVars.timeSpent > 0 ;
    }
    return true ;
}

$scope.showRatingButton = function( q ) {
    if( !$scope.$parent.fastTrackRequested ) {
        return ( q._sessionVars.rating == null ) &&
               ( q._sessionVars.timeSpent > 0 ) ;
    }
    return true ;
}

$scope.applySelectedHOMs = function() {
    $( "#HOMTraceDialog" ).modal( 'hide' ) ;

    const cardId      = curQBeingRated.questionId;
    const chapterId   = curQBeingRated._chapterDetails.chapterId ;
    const chSessionId = $scope.$parent.exerciseBanksMap[ chapterId ]._sessionId;
    let   homAttrs    = curQBeingRated.learningStats._homAttributes ;

    homAttrs = selectedHOMsForCurrentQuestion.slice() ;

    $scope.$parent.updateHOMHistogram( selectedHOMsForCurrentQuestion ) ;
    callApplyHOMAPI( cardId, chSessionId, homAttrs ) ;

    selectedHOMsForCurrentQuestion.length = 0 ;
    curQBeingRated = null ;
}

$scope.toggleApplyHOMAttribute = function( homName ) {
    log.debug( "Applying HOM " + homName ) ;
    if( selectedHOMsForCurrentQuestion.indexOf( homName ) != -1 ) {
        selectedHOMsForCurrentQuestion.splice( selectedHOMsForCurrentQuestion.indexOf( homName ), 1 ) ;
    }
    else {
        selectedHOMsForCurrentQuestion.push( homName ) ;
    }
    $scope.selectedHOMDescription = homDescription[ homName ] ;
}

$scope.isHOMSelected = function( homName ) {
    return selectedHOMsForCurrentQuestion.indexOf( homName ) != -1 ;
}

$scope.getNumHOMSelected = function() {
    return selectedHOMsForCurrentQuestion.length ;
}

// ---------------- Private functions ------------------------------------------
function computeRatingCompletedFlag() {

    let allRatedFlag = true;

    for( let i=0; i<$scope.$parent.questions.length; i++ ) {
        const question = $scope.$parent.questions[i];
        const vars = question._sessionVars;

        if( vars.ratingText == null || vars.scoreEarned == 0 ) {
            allRatedFlag = false ;
            break ;
        }
    }
    $scope.allQuestionsRated = allRatedFlag ;
}

function getNextLevel( curLevel, rating ) {

    const nextLevelMatrix = {
        //       E      A     P     H
        NS: ['MAS', 'L0', 'L0', 'L0'],
        L0: ['MAS', 'L0', 'L0', 'L0'],
        L1: ['MAS', 'L1', 'L0', 'L0'],
    };

    const nextLevels = nextLevelMatrix[curLevel];
    if      ( rating == 'E' ) { return nextLevels[0] ; }
    else if ( rating == 'A' ) { return nextLevels[1] ; }
    else if ( rating == 'P' ) { return nextLevels[2] ; }
    else if ( rating == 'H' ) { return nextLevels[3] ; }
}

function populateRatingTextAndCls( rating, question ) {

    const vars = question._sessionVars;

    vars.rating = rating ;
    if ( rating == 'E' ) { 
        vars.ratingText = "Correct" ; 
        vars.ratingTextCls += " btn-success" ;
    }
    else if ( rating == 'A' ) { 
        vars.ratingText = "Almost there" ; 
        vars.ratingTextCls += " btn-info" ;
    }
    else if ( rating == 'P' ) { 
        vars.ratingText = "Needs practice" ; 
        vars.ratingTextCls += " btn-warning" ;
    }
    else                     { 
        vars.ratingText = "Wrong" ; 
        vars.ratingTextCls += " btn-danger" ;
    }

    if( rating != 'E' ) {
        $( '#HOMTraceDialog' ).modal( 'show' ) ;
    }

    if( rating === 'E' ) {
        $scope.numCorrect++ ;
        $scope.$parent.telemetry.updateSessionNumCorrect( $scope.numCorrect ) ;
    }

    $scope.$parent.telemetry.updateExQuestionResult( question ) ;

    $scope.totalScore += question._sessionVars.scoreEarned ;
    $scope.$parent.telemetry.updateExQuestionMarksObtained( question ) ;
    $scope.$parent.telemetry.updateSessionTotalMarks( $scope.totalScore ) ;
}

function checkInvalidLoad() {
    if( $scope.$parent.currentStage != $scope.$parent.SESSION_EVALUATE_STAGE ) {
        $location.path( "/ConfigureExercise" ) ;
        return true ;
    }
    return false ;
}

// ---------------- Server calls -----------------------------------------------
/**
 * This function calls on the GradeCardAPI, submitting the details of the 
 * card that was rated and expecting back the score earned from the server.
 *
 * NOTE: This call is recursive! Why? There are times when the API invocation
 * is gracefully disconnected by the server (HTTP??) resulting in a return
 * status code of 0 and data null. In such cases the server code doesn't even
 * receive the request (verified through logs.)
 *   Under such cases, (only if status code is 0), this function calls upon 
 * itself to retry the call. The retrial will continue for the configured max
 * number of times. If all the retrial attempts fail, an alert will be 
 * displayed to the user.
 */
function callGradeCardAPI( question, chapterId, sessionId, cardId, curLevel, nextLevel, 
                           rating, timeTaken, numAttempts, overshootPct,
                           previousCallAttemptNumber, callback ) {

    const currentCallAttemptNumber = previousCallAttemptNumber + 1;

    log.debug( "Calling grade card API for card " + cardId + " with parameters." ) ;
    log.debug( "\tchapterId    = " + chapterId   ) ;
    log.debug( "\tsessionId    = " + sessionId   ) ;
    log.debug( "\tcardId       = " + cardId      ) ;
    log.debug( "\tcurrentLevel = " + curLevel    ) ;
    log.debug( "\tnextLevel    = " + nextLevel   ) ;
    log.debug( "\trating       = " + rating      ) ;
    log.debug( "\ttimeTaken    = " + timeTaken   ) ;
    log.debug( "\tnumAttempts  = " + numAttempts ) ;
    log.debug( "\tovershootPct = " + overshootPct ) ;

    $http.post( '/jove_notes/api/GradeCard', { 
        "chapterId"           : chapterId,
        "sessionId"           : sessionId,
        "cardId"              : cardId,
        "currentLevel"        : curLevel,
        "nextLevel"           : nextLevel,
        "rating"              : rating,
        "timeTaken"           : timeTaken,
        "numAttempts"         : numAttempts,
        "overshootPct"        : overshootPct,
        "skipNegativeGrading" : false
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "Grade Card API call failed. No score " + 
                                  "returned. Server says - " + data ) ;
        }
        else {
            log.debug( "Grading of card " + cardId + " success." ) ;
            log.debug( "Score earned = " + data.score ) ;
            question._sessionVars.scoreEarned = data.score ;
            question._sessionVars.newLevel    = nextLevel ;
            computeRatingCompletedFlag() ;
            callback( rating, question ) ;
        }
    })
    .error( function( data, status ){

        if( status == 0 ) {
            log.debug( "Faulty connection determined." ) ;

            if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                log.debug( "Retrying the call again." ) ;
                callGradeCardAPI( 
                    question, chapterId, sessionId, cardId, curLevel, nextLevel, 
                    rating, timeTaken, numAttempts, overshootPct, 
                    currentCallAttemptNumber, callback 
                ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        $scope.addErrorAlert( "Grade Card API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + data ) ;
    }) ;
}

function callApplyHOMAPI( cardId, chSessionId, homAttributes ) {

    $http.post( '/jove_notes/api/HOM', { 
        "cardId"       : cardId,
        "sessionId"    : chSessionId,
        "homAttributes": homAttributes
    })
    .error( function( data, status ){
        $scope.addErrorAlert( "Grade Card API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + data ) ;
    }) ;
}
// ---------------- End of controller ------------------------------------------
} ) ;