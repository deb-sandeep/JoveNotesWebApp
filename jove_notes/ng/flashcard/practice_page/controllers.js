flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Constants and inner class definition -----------------------
var SSR_DELTA_L0 = 24*60*60*1000 ;
var SSR_DELTA_L1 = SSR_DELTA_L0 * 2 ;
var SSR_DELTA_L2 = SSR_DELTA_L0 * 3 ;
var SSR_DELTA_L3 = SSR_DELTA_L0 * 4  ;

// ---------------- Local variables --------------------------------------------
var ratingMatrix = new RatingMatrix() ;

var currentQuestionShowStartTime = 0 ;
var durationTillNowInMillis = 0 ;

var sessionStartTime = new Date().getTime() ;
var sessionActive    = true ;
var oldBodyTop       = 0 ;
var oldBodyBottom    = 0 ;
var scoreDelta       = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.showL0Header     = true ;
$scope.showL1Header     = true ;
$scope.showL2Header     = true ;
$scope.showFooterDropup = true ;

$scope.bodyDivStyle = { top : 75, bottom : 60 } ;

$scope.questionsForSession = [] ;
$scope.currentQuestion     = null ;
$scope.userScore           = userScore ;

$scope.answerChangeTrigger = "" ;
$scope.answerAlign = "center" ;

$scope.pushQuestionSuccess = false ;
$scope.pushAnswerSuccess   = false ;

// questionMode is used by the view to show the appropriate controls when either
// the question or the answer is shown.
$scope.questionMode = false ;

// ---------------- Main logic for the controller ------------------------------
{
    log.debug( "Executing PracticePageController." ) ;
    if( checkInvalidLoad() ) {
        log.debug( "Invalid refresh detected. Returning to start page." ) ;
        return ;
    }

    log.debug( "Serializing study criteria." ) ;
    $scope.$parent.studyCriteria.serialize() ;

    log.debug( "Computing session cards." ) ;
    computeSessionCards() ;

    if( $scope.$parent.sessionStats.numCards == 0 ) {
        $scope.$parent.messageForEndPage = "Filter criteria did not select any cards." ;
        endSession() ;
        return ;
    }

    startSession( function(){

        log.debug( "Starting timer." ) ;
        setTimeout( handleTimerEvent, 1000 ) ;

        onWindowResize() ;
        window.addEventListener( "resize", onWindowResize ) ;
        showNextCard() ;
    }) ;
}

// ---------------- Controller methods -----------------------------------------
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
    $scope.questionsForSession.shuffle() ;
}

$scope.endSession = function() {
    log.debug( "Ending current session." ) ;
    endSession() ;
}

$scope.purgeCard = function() {
    log.debug( "Purging current card." ) ;
    
    $scope.$parent.sessionStats.numCards-- ;
    $scope.$parent.sessionStats.numCardsLeft-- ;
    showNextCard() ;
}

$scope.rateCard = function( rating ) {
    log.debug( "Rating current card as " + rating )  ;

    var cardId     = $scope.currentQuestion.questionId ;
    var curLevel   = $scope.currentQuestion.learningStats.currentLevel ;
    var numAttempts= $scope.currentQuestion.learningStats.numAttemptsInSession+1 ;

    var nextLevel  = ratingMatrix.getNextLevel( numAttempts, curLevel, rating ) ;
    var nextAction = ratingMatrix.getNextAction( curLevel, rating ) ;

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
    
    $http.post( '/jove_notes/api/GradeCard', { 
        chapterId   : chapterId,
        sessionId   : $scope.$parent.sessionId,
        cardId      : cardId,
        currentLevel: curLevel,
        nextLevel   : nextLevel,
        rating      : rating,
        timeTaken   : Math.ceil( ( new Date().getTime() - currentQuestionShowStartTime )/1000 ),
        numAttempts : numAttempts
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "API call failed. " + data ) ;
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
                if( $scope.$parent.studyCriteria.push ) {
                    pushDeltaScoreToRemote( data.score ) ;
                }
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
    .error( function( data ){
        $scope.addErrorAlert( "API call failed. " + data ) ;
    }) ;

    showNextCard() ;
}

$scope.showAnswer = function() {

    $scope.answerChangeTrigger = "Answer" + $scope.currentQuestion.questionId ;
    $scope.questionMode = false ;
}

$scope.pushAnswer = function() {

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
        chapterId   : chapterId,
        msgType     : 'answer',
        msgContent  : null
    })
    .success( function( data ){
        $scope.pushAnswerSuccess = true ;
    })
    .error( function( data ){
        var message = "Could not push show answer message to remote." ;
        log.error( message ) ;
        log.error( "Server says - " + data ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
}

// ---------------- Private functions ------------------------------------------
function pushDeltaScoreToRemote( deltaScore ) {

    log.debug( "Pushing delta score to remote" ) ;

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
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

function startSession( callback ) {

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
            var message = "Can't start session. Could not post remote start message" ;
            log.error( message ) ;
            log.error( "Server says - " + data ) ;
            $scope.addErrorAlert( message ) ;
        }) ;
    }
    else {
        callback() ;
    }
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

        $scope.questionMode = true ;
        $scope.answerChangeTrigger = "" ;
        $scope.answerAlign = answerLength < 100 ? "center" : "left" ;

        currentQuestionShowStartTime = new Date().getTime() ;

        if( $scope.$parent.studyCriteria.push ) {
            log.debug( "Session is configured for remote push. " + 
                       "Posting next question." ) ;

            $scope.pushQuestionSuccess = false ;
            $scope.pushAnswerSuccess = false ;

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
            .error( function( data ){
                var message = "Could not post question for remote view" ;
                log.error( message ) ;
                log.error( "Server says - " + data ) ;
                $scope.addErrorAlert( message ) ;
            }) ;

            $scope.showAnswer() ;
        }
    }
    else {
        endSession() ;
    }
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
            return q2.learningStats.learningEfficiency - 
                   q1.learningStats.learningEfficiency  ;
        }) ;
    }
    else if( strategy == StudyStrategyTypes.prototype.EFF_EASY ) {
        log.debug( "\tSorting cards as per EFF_EASY study strategy." ) ;
        $scope.questionsForSession.sort( function( q1, q2 ){
            return q1.learningStats.learningEfficiency - 
                   q2.learningStats.learningEfficiency  ;
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

// ---------------- End of controller ------------------------------------------
} ) ; 