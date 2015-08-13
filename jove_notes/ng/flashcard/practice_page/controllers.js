flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Constants and inner class definition -----------------------
var SSR_DELTA_L0 = 24*60*60*1000 ;
var SSR_DELTA_L1 = SSR_DELTA_L0 * 2 ;
var SSR_DELTA_L2 = SSR_DELTA_L0 * 3 ;
var SSR_DELTA_L3 = SSR_DELTA_L0 * 4  ;

var MAX_GRADE_CARD_API_CALL_RETRIES    = 3 ;
var MAX_PUSH_ANS_API_CALL_RETRIES      = 3 ;
var MAX_PUSH_QUESTION_API_CALL_RETRIES = 3 ;

// ---------------- Local variables --------------------------------------------
var ratingMatrix = new RatingMatrix() ;

var currentQuestionShowStartTime   = 0 ;
var currentQuestionAvPredictedTime = 0 ;
var currentQuestionAvSelfTime      = 0 ;
var durationTillNowInMillis        = 0 ;

var sessionStartTime = new Date().getTime() ;
var sessionActive    = true ;
var oldBodyTop       = 0 ;
var oldBodyBottom    = 0 ;
var scoreDelta       = 0 ;

var questionChangeTriggerIndex = 0 ;

var diffAvgTimeManager = null ;

// ---------------- Controller variables ---------------------------------------
$scope.showL0Header     = true ;
$scope.showL1Header     = true ;
$scope.showL2Header     = true ;
$scope.showFooterDropup = true ;

$scope.bodyDivStyle = { top : 75, bottom : 60 } ;

$scope.questionsForSession = [] ;
$scope.currentQuestion     = null ;
$scope.userScore           = userScore ;

$scope.answerChangeTrigger   = "" ;
$scope.questionChangeTrigger = "" ;
$scope.answerAlign           = "center" ;

$scope.pushQuestionSuccess = false ;
$scope.pushAnswerSuccess   = false ;

$scope.recommendPromoteToMastered = true ;
$scope.recommendPromoteToMasteredWithoutScore = true ;

// questionMode is used by the view to show the appropriate controls when either
// the question or the answer is shown.
$scope.questionMode = false ;

// The direction of the footer buttons on the flashcard page.
$scope.gradingButtonPlacement = "right" ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing PracticePageController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }

    log.debug( "Serializing study criteria." ) ;
    $scope.$parent.studyCriteria.serialize() ;

    // Load the local state, which might include footer direction etc.
    loadLocalState() ;

    diffAvgTimeManager = new DifficultyAverageTimeManager( 
                                       $scope.$parent.difficultyTimeAverages ) ;

    log.debug( "Computing session cards." ) ;
    computeSessionCards() ;

    if( $scope.$parent.sessionStats.numCards == 0 ) {
        $scope.$parent.messageForEndPage = "Filter criteria did not select any cards." ;
        endSession() ;
        return ;
    }

    // Publish the start message if required and only after a successful publish,
    // we start the timer and show the next card. i.e. We don't start the session
    // till we have published the start session messsage in case push is 
    // configured. If push is not configured, the callback would be called without
    // publishing any message to the server.
    callRFMApiToPublisStartSession( function(){

        log.debug( "Starting timer." ) ;
        setTimeout( handleTimerEvent, 1000 ) ;

        onWindowResize() ;
        window.addEventListener( "resize", onWindowResize ) ;
        showNextCard() ;
    }) ;
}

// ---------------- Controller methods -----------------------------------------
$scope.toggleFooterDirection = function() {
    $scope.gradingButtonPlacement = ( $scope.gradingButtonPlacement == 'left' ) ?
                                    'right' : 'left' ;
    $.cookie( 'flashCardFooterDir', $scope.gradingButtonPlacement, { expires: 30 } ) ;
}

$scope.toggleDisplay = function( displayId ) {

    if( displayId == "L0-Hdr" ) { 
        $scope.showL0Header = !$scope.showL0Header ;
    }
    else if( displayId == "L1-Hdr" ) { 
        $scope.showL1Header = !$scope.showL1Header ; 
    }
    else if( displayId == "L2-Hdr" ) { 
        $scope.showL2Header = !$scope.showL2Header ; 
    }
    setTimeout( resizeBody, 10 ) ;
}

$scope.randomizeCards = function() {
    log.debug( "Randomizing remaining cards." ) ;
    $scope.questionsForSession.shuffleFrom( 1 ) ;
}

$scope.endSession = function() {
    log.debug( "Ending current session." ) ;
    endSession() ;
}

$scope.purgeCard = function() {
    log.debug( "Purging current card." ) ;
    
    $scope.$parent.sessionStats.numCards-- ;
    $scope.$parent.sessionStats.numCardsLeft-- ;
    $scope.questionsForSession.shift() ;
    
    showNextCard() ;
}

$scope.rateCard = function( rating ) {
    log.debug( "Rating current card as " + rating )  ;

    var cardId      = $scope.currentQuestion.questionId ;
    var curLevel    = $scope.currentQuestion.learningStats.currentLevel ;
    var numAttempts = $scope.currentQuestion.learningStats.numAttemptsInSession+1 ;
    var timeSpent   =  Math.ceil( ( new Date().getTime() - currentQuestionShowStartTime )/1000 ) ;   

    var nextLevel  = ratingMatrix.getNextLevel( numAttempts, curLevel, rating ) ;
    var nextAction = ratingMatrix.getNextAction( curLevel, rating ) ;

    diffAvgTimeManager.updateStatistics( $scope.currentQuestion, timeSpent ) ;

    $scope.questionsForSession.shift() ;

    processNextAction( nextAction ) ;
    updateLearningStatsForCurrentQuestion( rating, nextLevel ) ;
    updateLearningStatsForChapter( curLevel, nextLevel ) ;
    updateSessionStats() ;

    log.debug( "Card id       = " + $scope.currentQuestion.questionId ) ;
    log.debug( "Current level = " + curLevel ) ;
    log.debug( "Next level    = " + nextLevel ) ;
    log.debug( "Next action   = " + nextAction ) ;
    log.debug( "Num attmepts  = " + numAttempts ) ;
    log.debug( "Time spent    = " + $scope.currentQuestion.learningStats.numSecondsInSession ) ;

    // NOTE: GradeCard API call is asynchronous, that implies that the score 
    // of the current question will come sometimes when the user is attempting
    // the next question. This is ok.. the score counter will anyway get updated
    // in a time lagged fashion.. 
    callGradeCardAPI( 
        chapterId, 
        $scope.$parent.sessionId, 
        cardId, 
        curLevel, 
        nextLevel, 
        rating, 
        timeSpent,
        numAttempts,
        0 
    ) ;
    
    showNextCard() ;
}

$scope.showAnswer = function() {

    $scope.answerChangeTrigger = "Answer" + $scope.currentQuestion.questionId ;
    $scope.questionMode = false ;
}

$scope.pushAnswer = function() {
    callRFMApiToPushAnswer( 0 ) ;
}

$scope.pushQuestion = function() {

    $scope.pushQuestionSuccess = false ;
    $scope.$parent.purgeAllAlerts() ;
    callRFMApiToPushQuestion( 0 ) ;
}

// ---------------- Private functions ------------------------------------------
function loadLocalState() {

    var crit = $.cookie( 'flashCardFooterDir' ) ;
    if( typeof crit != 'undefined' ) {
        $scope.gradingButtonPlacement = crit ;
    }
    else {
        $scope.gradingButtonPlacement = "right" ;
    } ;
}

function updateLearningStatsForCurrentQuestion( rating, nextLevel ) {

    var delta = ( new Date().getTime() - currentQuestionShowStartTime )/1000 ;

    $scope.currentQuestion.learningStats.numAttempts++ ;
    $scope.currentQuestion.learningStats.numAttemptsInSession++ ;
    $scope.currentQuestion.learningStats.currentLevel = nextLevel ;
    $scope.currentQuestion.learningStats.temporalScores.push( rating ) ;
    $scope.currentQuestion.learningStats.numSecondsInSession += delta ;
    $scope.currentQuestion.learningStats.lastAttemptTime = new Date().getTime() ;
}

function updateLearningStatsForChapter( curLevel, nextLevel ) {

    $scope.$parent.progressSnapshot[ 'num' + curLevel  ]-- ;
    $scope.$parent.progressSnapshot[ 'num' + nextLevel ]++ ;
}

function updateSessionStats() {

    $scope.$parent.sessionStats.numCardsLeft = $scope.questionsForSession.length ;
    $scope.$parent.sessionStats.numCardsAnswered++ ;
}

function processNextAction( actionValue ) {

    if( actionValue != -1 ) {
        var newPos = $scope.questionsForSession.length * actionValue + 1 ;
        $scope.questionsForSession.splice( newPos, 0, $scope.currentQuestion ) ;
    }
}

function showNextCard() {

    if( !hasSessionEnded() ) {

        log.debug( "Showing next question." ) ;
        $scope.currentQuestion = $scope.questionsForSession[0] ;

        var answerLength = $scope.currentQuestion.handler.getAnswerLength() ;
        currentQuestionAvPredictedTime = diffAvgTimeManager.getPredictedAverageTime( $scope.currentQuestion ) ;
        log.debug( "Predicted average time = " + currentQuestionAvPredictedTime + " sec." ) ;

        currentQuestionAvSelfTime = 0 ;
        if( $scope.currentQuestion.learningStats.numAttempts > 0 ) {
            currentQuestionAvSelfTime = $scope.currentQuestion.learningStats.totalTimeSpent / 
                                        $scope.currentQuestion.learningStats.numAttempts ;
            currentQuestionAvSelfTime = Math.ceil( currentQuestionAvSelfTime ) ;
        }
        else {
            currentQuestionAvSelfTime = currentQuestionAvPredictedTime ;
        }
        log.debug( "Self average time = " + currentQuestionAvSelfTime + " sec." ) ;

        $scope.questionMode = true ;
        $scope.answerChangeTrigger = "" ;
        $scope.answerAlign = answerLength < 100 ? "center" : "left" ;

        computeRecommendPromoteFlag() ;

        currentQuestionShowStartTime = new Date().getTime() ;

        questionChangeTriggerIndex++ ;
        $scope.questionChangeTrigger = "Question-" + questionChangeTriggerIndex ;

        renderTimeMarkersForCurrentQuestion() ;

        if( $scope.$parent.studyCriteria.push ) {
            log.debug( "Session is configured for remote push. " + 
                       "Posting next question." ) ;

            $scope.pushQuestionSuccess = false ;
            $scope.pushAnswerSuccess = false ;

            callRFMApiToPushQuestion( 0 ) ;

            $scope.showAnswer() ;
        }
    }
    else {
        endSession() ;
    }
}

function renderTimeMarkersForCurrentQuestion() {

    if( currentQuestionAvSelfTime > 0 ) {
        var selfAvPercentage = 33*currentQuestionAvSelfTime/currentQuestionAvPredictedTime ;
        selfAvPercentage = Math.ceil( selfAvPercentage ) ;

        $( "#self_av_pb_left" ).css( "width", selfAvPercentage + "%" ) ;
        $( "#self_av_pb_padding" ).css( "width", (100 - selfAvPercentage -1 ) + "%" ) ;
    }
    $( "#curr_pb" ).removeClass() ;
    $( "#curr_pb" ).addClass( "progress-bar progress-bar-success" ) ;
}

function computeRecommendPromoteFlag() {

    $scope.recommendPromoteToMastered = false ;
    $scope.recommendPromoteToMasteredWithoutScore = false ;

    // We don't recommend promotion to mastered in non-assisted mode.
    if( !$scope.$parent.studyCriteria.assistedStudy ) return ;

    // If the question is already at L3 show the auto promote without score
    // button. Saving one attempt and more importantly getting free points in case
    // the tutor decides that the question has been sufficiently practiced.
    if( $scope.currentQuestion.learningStats.currentLevel == 'L3' ) {
        $scope.recommendPromoteToMasteredWithoutScore = true ;
        return ;
    }

    var recommendFlag = false ;

    var temporalScores      = $scope.currentQuestion.learningStats.temporalScores ;
    var numRatings          = temporalScores.length ;
    var numTrailingERatings = 0 ;
    var numHorPRatings      = 0 ;

    if( temporalScores.length >= 2 ) {

        var trailingEStreak = true ;
        for( var i=temporalScores.length-1; i>=0; i-- ) {

            var rating = temporalScores[i] ;

            if( rating == "E" || rating == "A" ) {
                if( trailingEStreak ){ 
                    numTrailingERatings++ ;
                }
            }
            else {
                trailingEStreak = false ; 
            }

            if( rating == "H" || rating == "P"   ){ 
                numHorPRatings++ ;        
            }
        }

        // Recommendation to promote to mastered is considered if and only if
        // the student has answered the question Easily for at least the last 
        // two or more presentments
        if( numTrailingERatings >=2 ) {
            recommendFlag = true ;

            // However, if the user has goofed up in the past, we reconsider our
            // stance of giving him an option to auto promote to mastered.
            if( numHorPRatings != 0 ) {

                // If he has a charred history, we recommend auto promote if he 
                // has more than 3 consequtive E's. i.e. He can only auto promote
                // from L3 to mastered.
                // Quirky logic - why > 3. Because for the wrong attempt he would 
                // have likely answered it correctly in the same session once to
                // close the session.
                if( numTrailingERatings >= 3 ) {
                    recommendFlag = true ;
                }
                else {
                    recommendFlag = false ;
                }
            }
        }
    }

    $scope.recommendPromoteToMastered = recommendFlag ;
    $scope.recommendPromoteToMasteredWithoutScore = recommendFlag ;
}

function endSession() {

    // This will stop the timer at the next click
    sessionActive = false ;

    var currentSnapshot = [ 
        $scope.$parent.progressSnapshot.numNS,
        $scope.$parent.progressSnapshot.numL0,
        $scope.$parent.progressSnapshot.numL1,
        $scope.$parent.progressSnapshot.numL2,
        $scope.$parent.progressSnapshot.numL3,
        $scope.$parent.progressSnapshot.numMAS
    ] ;
    $scope.$parent.learningCurveData.push( currentSnapshot ) ;

    $location.path( "/EndPage" ) ;
}

function hasSessionEnded() {

    if( $scope.$parent.studyCriteria.maxTime != -1 ) {
        if( durationTillNowInMillis >= $scope.$parent.studyCriteria.maxTime*60*1000 ) {
            return true ;
        }
    }

    if( $scope.questionsForSession.length == 0 ) {
        return true ;
    }
    return false ;
}

function checkInvalidLoad() {
    if( $scope.$parent.progressSnapshot == null ) {
        $location.path( "/StartPage" ) ;
        return true ;
    }
    return false ;
}

function computeSessionCards() {

    $scope.questionsForSession.length = 0 ;
    
    log.debug( "Computing cards for this session." ) ;
    log.debug( "\tTotal cards in chapter = " + $scope.$parent.questions.length ) ;

    applyStudyCriteriaFilter() ;
    sortCardsAsPerStudyStrategy() ;
    addNSCards() ;

    var strategy = $scope.studyCriteria.strategy ;
    if( ( strategy == StudyStrategyTypes.prototype.OBJECTIVE ) ||
        ( strategy == StudyStrategyTypes.prototype.SUBJECTIVE ) ) {
        log.debug( "\tSorting cards as per OBJECTIVE study strategy." ) ;
    
        sortCardsAsPerStudyStrategy() ;
    }
    
    trimCardsAsPerBounds() ;

    $scope.$parent.sessionStats.numCards     = $scope.questionsForSession.length ;
    $scope.$parent.sessionStats.numCardsLeft = $scope.questionsForSession.length ;
}

function applyStudyCriteriaFilter() {

    log.debug( "\tApplying study criteria filter." ) ;
    for( var i=0; i < $scope.$parent.questions.length ; i++ ) {
        var question = $scope.$parent.questions[ i ] ;
        if( $scope.$parent.studyCriteria.matchesFilter( question ) ) {
            $scope.questionsForSession.push( question ) ;
        }
    }
    log.debug( "\t\t#Q after filtering = " + $scope.questionsForSession.length ) ;
}

function sortCardsAsPerStudyStrategy() {
    
    if( $scope.questionsForSession.length <= 0 ) { return; }

    var strategy = $scope.studyCriteria.strategy ;
    if( strategy == StudyStrategyTypes.prototype.SSR ) {
        log.debug( "\tFiltering cards as per SSR study strategy." ) ;
        filterCardsForSSRStrategy() ;

        if( $scope.questionsForSession.length > 0 ) {
            $scope.questionsForSession.sort( function( q1, q2 ){

                var tlaCard1 = getSSRThresholdDelta( q1 ) ;
                var tlaCard2 = getSSRThresholdDelta( q2 ) ;

                return tlaCard2 - tlaCard1 ;
            }) ;
        }
    }
    else if( strategy == StudyStrategyTypes.prototype.EFF_HARD ) {
        log.debug( "\tSorting cards as per EFF_HARD study strategy." ) ;
        $scope.questionsForSession.sort( function( q1, q2 ){
            return q1.learningStats.absoluteLearningEfficiency - 
                   q2.learningStats.absoluteLearningEfficiency ;
        }) ;
    }
    else if( strategy == StudyStrategyTypes.prototype.EFF_EASY ) {
        log.debug( "\tSorting cards as per EFF_EASY study strategy." ) ;
        $scope.questionsForSession.sort( function( q1, q2 ){
            return q2.learningStats.absoluteLearningEfficiency - 
                   q1.learningStats.absoluteLearningEfficiency ;
        }) ;
    }
    else if( strategy == StudyStrategyTypes.prototype.OBJECTIVE ) {
        log.debug( "\tSorting cards as per OBJECTIVE study strategy." ) ;
        $scope.questionsForSession.sort( function( q1, q2 ){
            return q1.handler.getAnswerLength() - q2.handler.getAnswerLength() ;
        }) ;
    }
    else if( strategy == StudyStrategyTypes.prototype.SUBJECTIVE ) {
        log.debug( "\tSorting cards as per SUBJECTIVE study strategy." ) ;
        $scope.questionsForSession.sort( function( q1, q2 ){
            return q2.handler.getAnswerLength() - q1.handler.getAnswerLength() ;
        }) ;
    } 

    log.debug( "\t#cards after applying study strategy = " + 
               $scope.questionsForSession.length ) ;
}

function filterCardsForSSRStrategy() {
    
    var ssrFilteredQuestions = [] ;
    var index = 0 ;

    for( index=0; index<$scope.questionsForSession.length; index++ ) {
        var question = $scope.questionsForSession[index] ;
        var thresholdDelta = getSSRThresholdDelta( question ) ;

        if( thresholdDelta >= 0 ) {
            ssrFilteredQuestions.push( question ) ;
        }
    }

    $scope.questionsForSession = ssrFilteredQuestions ;
}

function getSSRThresholdDelta( question ) {

    var currentLevel = question.learningStats.currentLevel ;
    var timeSinceLastAttempt = new Date().getTime() - 
                               question.learningStats.lastAttemptTime ;
    var delta = -1 ;

    if( CardLevels.prototype.L0 == currentLevel ) {
        delta = timeSinceLastAttempt - SSR_DELTA_L0 ;
    }
    else if( CardLevels.prototype.L1 == currentLevel ) {
        delta = timeSinceLastAttempt - SSR_DELTA_L1 ;
    }
    else if( CardLevels.prototype.L2 == currentLevel ) {
        delta = timeSinceLastAttempt - SSR_DELTA_L2 ;
    }
    else if( CardLevels.prototype.L3 == currentLevel ) {
        delta = timeSinceLastAttempt - SSR_DELTA_L3 ;
    }
    return delta ;
}

function addNSCards() {

    log.debug( "\tAdding NS cards. Max new cards = " + 
               $scope.$parent.studyCriteria.maxNewCards ) ;

    var nsQuestionsAdded = 0 ;
    if( $scope.$parent.studyCriteria.maxNewCards > 0 ) {
        for( var i=0 ; i < $scope.$parent.questions.length ; i++ ) {

            var question = $scope.$parent.questions[ i ] ;
            if( question.learningStats.currentLevel == CardLevels.prototype.NS ) {

                $scope.questionsForSession.splice( nsQuestionsAdded, 0, question ) ;
                nsQuestionsAdded++ ;
                if( nsQuestionsAdded >= $scope.$parent.studyCriteria.maxNewCards ) {
                    break ;
                }
            }
        }
    }
    log.debug( "\t\tAdded " + nsQuestionsAdded + " NS questions." ) ;
}

function trimCardsAsPerBounds() {
    
    log.debug( "\tTrimming cards as per max cards bound. " + 
               $scope.$parent.studyCriteria.maxCards ) ;

    while( $scope.questionsForSession.length > $scope.$parent.studyCriteria.maxCards ) {
        $scope.questionsForSession.pop() ;      
    }
    log.debug( "\t\t#cards after trimming " + $scope.questionsForSession.length ) ;
}

function handleTimerEvent() {
    if( sessionActive ) {
        refreshClocks() ;
        refreshCardTimeProgressBars() ;
        setTimeout( handleTimerEvent, 1000 ) ;
    }
}

function refreshClocks() {

    durationTillNowInMillis = new Date().getTime() - sessionStartTime ;

    $scope.$parent.timePerQuestion = durationTillNowInMillis / 
                             ( $scope.$parent.sessionStats.numCardsAnswered + 1 ) ;

    if( $scope.$parent.studyCriteria.maxTime != -1 ) {

        var timeLeftInMillis = $scope.$parent.studyCriteria.maxTime * 60 * 1000 -
                               durationTillNowInMillis ;
        if( timeLeftInMillis <= 0 ) {
            sessionActive = false ;
        }
        else {
            $scope.$parent.sessionDuration = timeLeftInMillis ;
        }
    }
    else {
        $scope.$parent.sessionDuration = durationTillNowInMillis ;
    }
    $scope.$digest() ;
}

function refreshCardTimeProgressBars() {

    var delta = Math.ceil(( new Date().getTime() - currentQuestionShowStartTime )/1000) ;

    if( delta > 0 ) {
        var percent = 33*delta/currentQuestionAvPredictedTime ;
        percent = Math.ceil( percent ) ;
        if( percent <= 105 ) {
            $( "#curr_pb" ).css( "width", percent + "%" ) ;
        }

        if( delta > currentQuestionAvSelfTime && 
            delta < (1.5 * currentQuestionAvSelfTime) ) {
            $( "#curr_pb" ).removeClass( "progress-bar-success" ) ;
            $( "#curr_pb" ).addClass( "progress-bar-warning" ) ;
        }
        else if( delta > (1.5*currentQuestionAvSelfTime) ) {
            $( "#curr_pb" ).removeClass( "progress-bar-warning" ) ;
            $( "#curr_pb" ).addClass( "progress-bar-danger" ) ;
        }
    }
}

function onWindowResize() {

    if( window.innerWidth < 700 ) {

        $scope.showL0Header     = false ;
        $scope.showL1Header     = false ;
        $scope.showL2Header     = true ;
        $scope.showFooterDropup = false ;
    }
    else {
        if( !$scope.showFooterDropup ) {
            $scope.showFooterDropup = true ;
            $scope.showL0Header     = true ;
            $scope.showL1Header     = true ;
            $scope.showL2Header     = true ;
        }
    }
    setTimeout( resizeBody, 10 ) ;
}

function resizeBody() {

    var curBodyTop    = getDivHeight( 'flashcard-hdr-div' ) ;
    var curBodyBottom = getDivHeight( 'flashcard-footer-div' ) ;

    if( ( curBodyTop != oldBodyTop ) || ( curBodyBottom != oldBodyBottom ) ) {
        oldBodyTop = curBodyTop ;
        oldBodyBottom = curBodyBottom ;

        $scope.bodyDivStyle = {
            top    : oldBodyTop,
            bottom : oldBodyBottom
        } ;
        $scope.$digest() ;
    }
}

function getDivHeight( divName ) {

    var div = document.getElementById( divName ) ;
    if( div != null ) {
        return div.offsetHeight ;
    }
    else return 0 ;
}

function updateScore() {

    if( scoreDelta !=0 ) {
        var delta = ( scoreDelta > 0 ) ? 1 : -1 ;
        $scope.userScore += delta ;
        scoreDelta       -= delta ;
        setTimeout( updateScore, 10 ) ;
    }
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
function callGradeCardAPI( chapterId, sessionId, cardId, curLevel, nextLevel, 
                           rating, timeTaken, numAttempts,
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

    $http.post( '/jove_notes/api/GradeCard', { 
        "chapterId"    : chapterId,
        "sessionId"    : sessionId,
        "cardId"       : cardId,
        "currentLevel" : curLevel,
        "nextLevel"    : nextLevel,
        "rating"       : rating,
        "timeTaken"    : timeTaken,
        "numAttempts"  : numAttempts
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "Grade Card API call failed. No score " + 
                                  "returned. Server says - " + data ) ;
        }
        else {
            log.debug( "Grading of card " + cardId + " success." ) ;
            log.debug( "Score earned = " + data.score ) ;
            scoreDelta += data.score ;

            // There are times, especially for the last card in the deck that the
            // server response is received after we have shown the end page.
            // In these cases $scope.$parent turns out to be null and the following
            // throws an error. To prevent the mishap, we explicitly check for
            // a not null parent.
            if( $scope.$parent != null ) {

                // The decision to push or not will be determined by the function
                // based on the push flag for this session.
                callRFMApiToPublishDeltaScore( chapterId, 
                                               $scope.$parent.sessionId, 
                                               data.score ) ;

                if( data.score > 0 ) {
                    $scope.$parent.pointsEarnedInThisSession += data.score ;
                    updateScore() ;
                }
                else if( data.score < 0 ) {
                    $scope.$parent.pointsLostInThisSession += data.score ;
                    updateScore() ;
                }
            }
        }
    })
    .error( function( data, status ){

        if( status == 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                log.debug( "Retrying the call again." ) ;
                callGradeCardAPI( 
                    chapterId, sessionId, cardId, curLevel, nextLevel, 
                    rating, timeTaken, numAttempts, currentCallAttemptNumber 
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

function callRFMApiToPublishDeltaScore( chapterId, sessionId, deltaScore ) {

    if( $scope.$parent.studyCriteria.push ) {
        
        log.debug( "Pushing delta score to remote" ) ;

        $http.post( '/jove_notes/api/RemoteFlashMessage', { 
            sessionId   : sessionId,
            chapterId   : chapterId,
            msgType     : 'delta_score',
            msgContent  : {
                "deltaScore" : deltaScore
            }
        })
        .error( function( data ){
            var message = "Could not post delta score to remote." ;
            log.error( message ) ;
            log.error( "Server says - " + data ) ;
            $scope.addErrorAlert( message ) ;
        }) ;
    }
}

// Publish the start message if required and only after a successful publish,
// we start the timer and show the next card. i.e. We don't start the session
// till we have published the start session messsage in case push is 
// configured. If push is not configured, the callback would be called without
// publishing any message to the server.
function callRFMApiToPublisStartSession( callback ) {

    log.debug( "Starting the session." ) ;
    if( $scope.$parent.studyCriteria.push ) {
        log.debug( "Session is configured for remote push. " + 
                   "Posting start_session message." ) ;

        $http.post( '/jove_notes/api/RemoteFlashMessage', { 
            sessionId   : $scope.$parent.sessionId,
            chapterId   : chapterId,
            msgType     : 'start_session',
            msgContent  : {
                "userScore"         : $scope.userScore,
                "chapterDetails"    : $scope.$parent.chapterDetails,
                "difficultyStats"   : $scope.$parent.difficultyStats,
                "progressSnapshot"  : $scope.$parent.progressSnapshot,
                "learningCurveData" : $scope.$parent.learningCurveData,
                "studyCriteria"     : $scope.$parent.studyCriteria,
            }
        })
        .success( function( data ){
            callback() ;
        })
        .error( function( data ){
            var message = "Can't start session. " + 
                          "Could not post remote start message. " + 
                          "Server says " + data ;
            log.error( message ) ;
            $scope.addErrorAlert( message ) ;
        }) ;
    }
    else {
        callback() ;
    }
}

function callRFMApiToPushAnswer( previousCallAttemptNumber ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
        chapterId   : chapterId,
        msgType     : 'answer',
        msgContent  : null
    })
    .success( function( data ){
        $scope.pushAnswerSuccess = true ;
    })
    .error( function( data, status ){
        if( status == 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_PUSH_ANS_API_CALL_RETRIES ) {
                log.debug( "Retrying the push answer call again." ) ;
                callRFMApiToPushAnswer( currentCallAttemptNumber ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        $scope.addErrorAlert( "Push Answer API call failed. " + 
                              "Status = " + status + ", " + 
                              "Response = " + response ) ;

    }) ;
}

function callRFMApiToPushQuestion( previousCallAttemptNumber ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    log.debug( "Pushing question to remote user. Attempt - " + currentCallAttemptNumber ) ;

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
        chapterId   : chapterId,
        msgType     : 'question',
        msgContent  : {
            "progressSnapshot": $scope.$parent.progressSnapshot,
            "sessionStats"    : $scope.$parent.sessionStats,
            "currentQuestion" : $scope.currentQuestion,
            "answerAlign"     : $scope.answerAlign
        }
    })
    .success( function( data ){
        $scope.pushQuestionSuccess = true ;
    })
    .error( function( data, status ){

        if( status == 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_PUSH_QUESTION_API_CALL_RETRIES ) {
                log.debug( "Retrying the push question call again." ) ;
                callRFMApiToPushQuestion( currentCallAttemptNumber ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        var message = "Could not post question for remote view. " + 
                      "Server says status = " + status + " and " + 
                      "Response = " + data ;
        log.error( message ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
}

// ---------------- End of controller ------------------------------------------
} ) ; 