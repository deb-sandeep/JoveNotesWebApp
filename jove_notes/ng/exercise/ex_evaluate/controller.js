testPaperApp.controller( 'ExerciseEvaluationController', function( $scope, $http, $routeParams, $location, $window ) {
// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.statusMessage     = "Rate each question as per performance." ;
$scope.allQuestionsRated = false ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing ExerciseEvaluationController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }
    $scope.$parent.pageTitle = "Evaluate Exercise" ;
}

// ---------------- Controller methods -----------------------------------------
$scope.rateSolution = function( rating, question ) {

    log.debug( "Rating current card as " + rating )  ;

    populateRatingTextAndCls( rating, question ) ;

    var cardId       = question.questionId ;
    var curLevel     = question.learningStats.currentLevel ;
    var numAttempts  = 1 ;
    var timeSpent    = question._sessionVars.timeSpent ; 
    var nextLevel    = getNextLevel( curLevel, rating ) ;
    var overshootPct = 0 ;
    var chSessionId  = $scope.$parent.exerciseBanksMap
                       [ question._chapterDetails.chapterId ]._sessionId ;

    log.debug( "Card id       = " + question.questionId ) ;
    log.debug( "Current level = " + curLevel ) ;
    log.debug( "Next level    = " + nextLevel ) ;
    log.debug( "Num attmepts  = " + numAttempts ) ;
    log.debug( "Time spent    = " + timeSpent ) ;
    log.debug( "Overshoot pct = " + overshootPct ) ;

    // NOTE: GradeCard API call is asynchronous, that implies that the score 
    // of the current question will come sometimes when the user is attempting
    // the next question. This is ok.. the score counter will anyway get updated
    // in a time lagged fashion.. 
    callGradeCardAPI( 
        question,
        question._chapterDetails.chapterId, 
        chSessionId, 
        cardId, 
        curLevel, 
        nextLevel, 
        rating, 
        timeSpent,
        numAttempts,
        overshootPct,
        0 
    ) ;
}

$scope.showSummaryScreen = function() {
    $scope.$parent.currentStage = $scope.$parent.SESSION_SUMMARY_STAGE ;
    $location.path( "/ExerciseSummary" ) ;
}

// ---------------- Private functions ------------------------------------------
function computeRatingCompletedFlag() {

    var allRatedFlag = true ;

    for( var i=0; i<$scope.$parent.questions.length; i++ ) {
        var question = $scope.$parent.questions[i] ;
        var vars     = question._sessionVars ;

        if( vars.timeSpent > 0 ) {
            if( vars.ratingText == null || vars.scoreEarned == 0 ) {
                allRatedFlag = false ;
                break ;
            }
        }
    }

    $scope.allQuestionsRated = allRatedFlag ;
}

function getNextLevel( curLevel, rating ) {

    var nextLevelMatrix = {
        //       E      A     P     H
        NS : [ 'L1' , 'L1', 'L0', 'L0' ],
        L0 : [ 'L1' , 'L0', 'L0', 'L0' ],
        L1 : [ 'MAS', 'L1', 'L0', 'L0' ],
    } ;

    var nextLevels = nextLevelMatrix[ curLevel ] ;
    if      ( rating == 'E' ) { return nextLevels[0] ; }
    else if ( rating == 'A' ) { return nextLevels[1] ; }
    else if ( rating == 'P' ) { return nextLevels[2] ; }
    else if ( rating == 'H' ) { return nextLevels[3] ; }
}

function populateRatingTextAndCls( rating, question ) {

    var vars = question._sessionVars ;

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
                           previousCallAttemptNumber ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

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
        "chapterId"    : chapterId,
        "sessionId"    : sessionId,
        "cardId"       : cardId,
        "currentLevel" : curLevel,
        "nextLevel"    : nextLevel,
        "rating"       : rating,
        "timeTaken"    : timeTaken,
        "numAttempts"  : numAttempts,
        "overshootPct" : overshootPct
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
                    currentCallAttemptNumber 
                ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        $scope.addErrorAlert( "Grade Card API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + response ) ;
    }) ;
}


// ---------------- End of controller ------------------------------------------
} ) ;