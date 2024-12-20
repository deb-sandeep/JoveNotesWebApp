flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Constants and inner class definition -----------------------
const MAX_GRADE_CARD_API_CALL_RETRIES = 3;
const MAX_PUSH_ANS_API_CALL_RETRIES = 3;
const MAX_PUSH_QUESTION_API_CALL_RETRIES = 3;

const PROGRESS_STAGE_GREEN = 0;
const PROGRESS_STAGE_AMBER = 1;
const PROGRESS_STAGE_RED = 2;

const FATIGUE_UPPER_THRESHOLD = 50;
const FATIGUE_LOWER_THRESHOLD = -50;
const HYSTERIS_PCT = 0.25;
const FATIGUE_UPPER_HYSTERISIS_THRESHOLD = FATIGUE_UPPER_THRESHOLD * (1 - HYSTERIS_PCT);
const FATIGUE_LOWER_HYSTERISIS_THRESHOLD = FATIGUE_LOWER_THRESHOLD * (1 - HYSTERIS_PCT);

// Constants for determining page turner button actions.
const PTA_RATE_CARD_E   = 0 ;
const PTA_RATE_CARD_H   = 1 ;
const PTA_RATE_CARD_APM = 2 ;
const PTA_RATE_CARD_MAS = 3 ; // We are at L3 and this press will master the card. No different than
                              // E except that it enables us to give a separate visual rep to the button.

// ---------------- Local variables --------------------------------------------
const ratingMatrix = new RatingMatrix();
const jnUtils     = new JoveNotesUtil();
const sessionStartTime = new Date().getTime();

let currentQuestionShowStartTime   = 0;
let currentQuestionAvPredictedTime = 0;
let currentQuestionAvSelfTime      = 0;
let durationTillNowInMillis        = 0;

let sessionActive = true;
let oldBodyTop    = 0;
let oldBodyBottom = 0;
let scoreDelta    = 0;

let questionChangeTriggerIndex = 0;

let diffAvgTimeManager = null;

let resumeModalShowTime    = 0;
let totalSessionPauseTime  = 0;
let totalQuestionPauseTime = 0;

let currentTimerStage = PROGRESS_STAGE_GREEN;

let initialQADivFontSize = -1;
let currentFontZoomDelta = 0;

let pageTurnerAction = PTA_RATE_CARD_E ;

// ---------------- Controller variables ---------------------------------------
$scope.showL0Header       = true ;
$scope.showL1Header       = true ;
$scope.showL2Header       = true ;
$scope.showFooterDropup   = true ;
$scope.showCompactControl = true ;

$scope.bodyDivStyle = { top : 80, bottom : 60 } ;

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
$scope.ratings = [] ;

// questionMode is used by the view to show the appropriate controls when either
// the question or the answer is shown.
$scope.questionMode = false ;

// The direction of the footer buttons on the flashcard page.
$scope.gradingButtonPlacement = "right" ;

$scope.projectedTimeLeft = 0 ;
$scope.currentFatigueLevel = 0 ;
$scope.inUpperHysterisZone = false ;
$scope.inLowerHysterisZone = false ;
$scope.inNormalFatigueZone = false ;
$scope.currentAnsTime = 0 ;

$scope.answerPushed = false ;
$scope.totalAnsPushTime = 0 ;
$scope.remainingAnsPushTime = 0 ; // Time is in milliseconds

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

    if( $scope.$parent.sessionStats.numCards === 0 ) {
        $scope.$parent.messageForEndPage = "Filter criteria did not select any cards." ;
        endSession() ;
        return ;
    }

    fetchZoomDeltaFromServer( function(){

        // Publish the start message if required and only after a successful 
        // publish, we start the timer and show the next card. i.e. We don't 
        // start the session till we have published the start session messsage 
        // in case push is configured. If push is not configured, the callback 
        // would be called without publishing any message to the server.
        callRFMApiToPublisStartSession( function(){

            log.debug( "Starting timer." ) ;
            setTimeout( handleTimerEvent, 1000 ) ;

            onWindowResize() ;
            window.addEventListener( "resize", onWindowResize ) ;

            window.addEventListener( "beforeunload", function ( event ) {
                if( sessionActive ) {
                    event.returnValue = 
                        "A session is in progress. \nIf you leave this page " + 
                        $scope.$parent.sessionStats.numCardsLeft + 
                        " cards will remains unattempted" ;
                }
            });

            showNextCard() ;
        }) ;
    }) ;
}

// ---------------- Controller methods -----------------------------------------
$scope.pauseSession = function() {

    $( '#modalResume' ).modal( 'show' ) ;
    callRFMApiToPauseResumeSession( 'pause_session', 0, function(){
        resumeModalShowTime = new Date().getTime() ;
    } ) ;
}

// This deserves some commentary. See, I have put the bootstrap modal div
// in index.php - that is as a child of the body tag. This is so, because if
// I put it inside the flashcard body, showing creates problem with the z
// order of the dialog. Now, ng-click of the resume button acts on the 
// root flash card scope, which is a parent (ancestor) of this scope. As per
// angular design, we can't access a child scope from inside a parent scope and
// hence I use $broadcast to percolate an event down to the children.
// Hence we catch the resume trigger via an $on.
$scope.$on( 'resumeSession.button.click', function( event, args ){

    $( '#modalResume' ).modal( 'hide' ) ;

    callRFMApiToPauseResumeSession( 'resume_session', 0, function(){
        const pauseTime = new Date().getTime() - resumeModalShowTime;
        totalSessionPauseTime  += pauseTime ;
        totalQuestionPauseTime += pauseTime ;

        resumeModalShowTime = 0 ;
    } ) ;
} ) ;

$scope.toggleFooterDirection = function() {
    $scope.gradingButtonPlacement = ( $scope.gradingButtonPlacement === 'left' ) ?
                                    'right' : 'left' ;
    $.cookie( 'flashCardFooterDir', $scope.gradingButtonPlacement, { expires: 30 } ) ;
}

$scope.toggleDisplay = function( displayId ) {

    if( displayId === "L0-Hdr" ) {
        $scope.showL0Header = !$scope.showL0Header ;
    }
    else if( displayId === "L1-Hdr" ) {
        $scope.showL1Header = !$scope.showL1Header ; 
    }
    else if( displayId === "L2-Hdr" ) {
        $scope.showL2Header = !$scope.showL2Header ; 
    }
    setTimeout( resizeBody, 10 ) ;
}

$scope.toggleCompactControls = function() {
    $scope.showCompactControl = !$scope.showCompactControl ;
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

$scope.moveCurrentCardToEnd = function() {

    $scope.questionsForSession.shift() ;
    $scope.questionsForSession.splice( $scope.questionsForSession.length, 0, $scope.currentQuestion ) ;
    showNextCard() ;
}

$scope.purgeNotAttemptedCards = function() {

    for( let i = $scope.questionsForSession.length-1; i >= 0; i-- ) {
        const q = $scope.questionsForSession[i];
        if( q.learningStats.numAttemptsInSession === 0 ) {
            $scope.questionsForSession.splice( i, 1 ) ;
            $scope.$parent.sessionStats.numCards-- ;
            $scope.$parent.sessionStats.numCardsLeft-- ;

            if( i === 0 ) {
                showNextCard() ;
            }
        }
    }
}

$scope.getNextLevel = function( rating ) {
    if( $scope.currentQuestion != null ) {
        const numAttempts = $scope.currentQuestion.learningStats.numAttemptsInSession + 1;
        const curLevel = $scope.currentQuestion.learningStats.currentLevel;
        return ratingMatrix.getNextLevel( $scope.currentQuestion, numAttempts, curLevel, rating );
    }
    return "" ;
}

$scope.getPageTurnerButtonClass = function() {
    let clsName = "page-turner-green" ;
    switch( pageTurnerAction ) {
        case PTA_RATE_CARD_E:
            clsName = "page-turner-green" ;
            break ;
        case PTA_RATE_CARD_H:
            clsName = "page-turner-red" ;
            break ;
        case PTA_RATE_CARD_APM:
        case PTA_RATE_CARD_MAS:
            clsName = "page-turner-darkgreen" ;
            break ;
    }
    return clsName ;
}

$scope.pageTurnerButtonClicked = function() {
    switch( pageTurnerAction ) {
        case PTA_RATE_CARD_E:
        case PTA_RATE_CARD_MAS:
            $scope.rateCard( 'E' ) ;
            break ;
        case PTA_RATE_CARD_H:
            $scope.rateCard( 'H' ) ;
            break ;
        case PTA_RATE_CARD_APM:
            $scope.rateCard( 'APM' ) ;
            break ;
    }
}

$scope.rateCard = function( rating ) {
    log.debug( "Rating current card as " + rating )  ;

    const cardId = $scope.currentQuestion.questionId;
    const curLevel = $scope.currentQuestion.learningStats.currentLevel;
    const numAttempts = $scope.currentQuestion.learningStats.numAttemptsInSession + 1;
    const timeSpent = Math.ceil( (new Date().getTime() - currentQuestionShowStartTime - totalQuestionPauseTime) / 1000 );

    const nextLevel = ratingMatrix.getNextLevel( $scope.currentQuestion, numAttempts, curLevel, rating );
    const nextAction = ratingMatrix.getNextAction( curLevel, rating );

    let overshootPct = (timeSpent - currentQuestionAvSelfTime) / currentQuestionAvSelfTime;
    // Rounding off overshoot percentage to two decimal places.
    overshootPct = Math.round( overshootPct * 100 )/100 ;

    diffAvgTimeManager.updateStatistics( $scope.currentQuestion, rating, timeSpent ) ;

    $scope.questionsForSession.shift() ;

    processNextAction( nextAction ) ;
    updateLearningStatsForCurrentQuestion( rating, nextLevel, timeSpent ) ;
    updateLearningStatsForChapter( curLevel, nextLevel ) ;
    updateSessionStats() ;
    updateRatings( rating ) ;

    log.debug( "Card id       = " + $scope.currentQuestion.questionId ) ;
    log.debug( "Current level = " + curLevel ) ;
    log.debug( "Next level    = " + nextLevel ) ;
    log.debug( "Next action   = " + nextAction ) ;
    log.debug( "Num attmepts  = " + numAttempts ) ;
    log.debug( "Time spent    = " + timeSpent ) ;
    log.debug( "Overshoot pct = " + overshootPct ) ;

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
        overshootPct,
        0 
    ) ;

    const fatiqueContribution = ratingMatrix.getFatigueContribution(
                                                 curLevel, rating, timeSpent ) ;
    $scope.currentFatigueLevel += fatiqueContribution ;

    showNextCard() ;
}

$scope.showAnswer = function() {
    $scope.answerChangeTrigger = "Answer" + $scope.currentQuestion.questionId ;
    $scope.questionMode = false ;
}

$scope.pushAnswer = function() {
    callRFMApiToPushAnswer( 0 ) ;
    $scope.answerPushed = true ;
    pageTurnerAction = PTA_RATE_CARD_H ;
}

$scope.setAnsPushTimer = function( ansPushTime ) {
    $scope.totalAnsPushTime = (ansPushTime+1)*1000 ;
    $scope.remainingAnsPushTime = $scope.totalAnsPushTime ;
    refreshAnsPushTimeProgressBar() ;
}

$scope.isRatingControlEnabled = function() {
    return $scope.remainingAnsPushTime > 0 ;
}

$scope.alertStudent = function() {
    callRFMApiToAlertStudent() ;
}

$scope.pushQuestion = function() {
    $scope.pushQuestionSuccess = false ;
    $scope.$parent.purgeAllAlerts() ;
    callRFMApiToPushQuestion( 0 ) ;
}

$scope.markForReview = function() {
    callMarkForReviewAPI( $scope.currentQuestion.questionId, function( cardIds ){
        for( let i=0; i<cardIds.length; i++ ) {
            const markedCardId = cardIds[i];
            for( let j=0; j<$scope.questionsForSession.length; j++ ) {
                const question = $scope.questionsForSession[j];
                if( question.questionId === markedCardId ) {
                    question.markedForReview = true ;
                }
            }
        }
    } ) ;
}

$scope.increaseFontSize = function() {
    currentFontZoomDelta++ ;
    resizeFont( document.getElementById( "flashCardQDiv" ), 1 ) ;
    resizeFont( document.getElementById( "flashCardADiv" ), 1 ) ;
    saveZoomDeltaAtServer() ;
}

$scope.decreaseFontSize = function() {
    currentFontZoomDelta-- ;
    resizeFont( document.getElementById( "flashCardQDiv" ), -1 ) ;
    resizeFont( document.getElementById( "flashCardADiv" ), -1 ) ;
    saveZoomDeltaAtServer() ;
}

$scope.resetFontForQDiv = function() {

    if( initialQADivFontSize === -1 ) {
        initialQADivFontSize = parseInt( $( "#flashCardQDiv" ).css( 'font-size' ) ) ;
    }
    else {
        $( "#flashCardQDiv" ).css( 'font-size', initialQADivFontSize ) ;
    }
}

$scope.resetFontForADiv = function() {

    if( initialQADivFontSize === -1 ) {
        initialQADivFontSize = parseInt( $( "#flashCardQDiv" ).css( 'font-size' ) ) ;
    }
    else {
        $( "#flashCardADiv" ).css( 'font-size', initialQADivFontSize ) ;
    }
}

$scope.applyZoomDeltaToQFont = function() {
    if( currentFontZoomDelta !== 0 ) {
        const qDiv = document.getElementById("flashCardQDiv");
        resizeFont( qDiv, currentFontZoomDelta ) ;
    }
}

$scope.applyZoomDeltaToAFont = function() {
    if( currentFontZoomDelta !== 0 ) {
        const aDiv = document.getElementById("flashCardADiv");
        resizeFont( aDiv, currentFontZoomDelta ) ;
    }
}

$scope.getPredictedOutcomeBadgeClass = function( outcome ) {
    return outcome === 1 ? "outcome-correct" : "outcome-wrong" ;
}

$scope.getOutcomeText = function( outcome ) {
    return outcome === 1 ? "✔" : "✘" ;
}

// ---------------- Private functions ------------------------------------------
function resizeFont( domElement, magnifier ) {
    const curSize = parseInt($(domElement).css('font-size')) + magnifier;
    $( domElement ).css( 'font-size', curSize ) ;
}

function loadLocalState() {

    const crit = $.cookie( 'flashCardFooterDir' );
    if( typeof crit != 'undefined' ) {
        $scope.gradingButtonPlacement = crit ;
    }
    else {
        $scope.gradingButtonPlacement = "right" ;
    } ;
}

function updateLearningStatsForCurrentQuestion( rating, nextLevel, timeSpent ) {

    const delta = (new Date().getTime() - currentQuestionShowStartTime - totalQuestionPauseTime) / 1000;

    $scope.currentQuestion.learningStats.numAttempts++ ;
    $scope.currentQuestion.learningStats.totalTimeSpent += timeSpent ;
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

function updateRatings( rating ) {
    if( rating === 'APM' || rating === 'APMNS' ) {
        $scope.ratings.push( 'E' ) ;
    }
    else {
        $scope.ratings.push( rating ) ;
    }
}

function processNextAction( actionValue ) {

    if( actionValue !== -1 ) {
        const newPos = $scope.questionsForSession.length * actionValue + 1;
        $scope.questionsForSession.splice( newPos, 0, $scope.currentQuestion ) ;
    }
}

function showNextCard() {

    $scope.answerPushed = false ;
    $scope.totalAnsPushTime = 0 ;
    $scope.remainingAnsPushTime = 0 ;

    refreshAnsPushTimeProgressBar() ;

    if( !hasSessionEnded() ) {

        log.debug( "Showing next question." ) ;

        rearrangeQuestionsForFatigueBusting() ;

        $scope.currentQuestion = $scope.questionsForSession[0] ;
        $scope.currentQuestion.handler.initialize( $scope ) ;

        computeAvgSelfAndPredictedTimes() ;

        const answerLength = $scope.currentQuestion.handler.getAnswerLength();

        $scope.questionMode        = true ;
        $scope.answerChangeTrigger = "" ;
        $scope.answerAlign         = ( answerLength < 100 ) ? "center" : "left" ;

        computeRecommendPromoteFlag() ;

        currentQuestionShowStartTime = new Date().getTime() ;
        totalQuestionPauseTime = 0 ;
        currentTimerStage = PROGRESS_STAGE_GREEN ;

        questionChangeTriggerIndex++ ;
        $scope.questionChangeTrigger = "Question-" + questionChangeTriggerIndex ;

        renderTimeMarkersForCurrentQuestion() ;
        updateProjectedTimeLeft() ;
        computePageTurnerAction() ;

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

function computeAvgSelfAndPredictedTimes() {

    currentQuestionAvSelfTime = 0 ;
    currentQuestionAvPredictedTime = diffAvgTimeManager.getPredictedAverageTime( $scope.currentQuestion ) ;
    statisticalAvgTime = diffAvgTimeManager.getStatisticalAverageTime( $scope.currentQuestion ) ;

    if( $scope.currentQuestion.learningStats.numAttempts > 0 ) {
        currentQuestionAvSelfTime = $scope.currentQuestion.learningStats.totalTimeSpent /
            $scope.currentQuestion.learningStats.numAttempts ;
        currentQuestionAvSelfTime = Math.ceil( currentQuestionAvSelfTime ) ;
    }
    else {
        currentQuestionAvSelfTime = currentQuestionAvPredictedTime ;
    }

    currentQuestionAvSelfTime = Math.max( currentQuestionAvSelfTime, statisticalAvgTime ) ;
    currentQuestionAvPredictedTime = Math.max( currentQuestionAvPredictedTime, statisticalAvgTime ) ;

    log.debug( "Predicted average time = " + currentQuestionAvPredictedTime + " sec." ) ;
    log.debug( "Self average time      = " + currentQuestionAvSelfTime + " sec." ) ;
}

function computePageTurnerAction() {
    pageTurnerAction = PTA_RATE_CARD_E ;

    let elementType = $scope.currentQuestion.elementType ;
    let qType = $scope.currentQuestion.questionType ;
    let numAttempts = $scope.currentQuestion.learningStats.numAttempts ;
    let absEff = $scope.currentQuestion.learningStats.absoluteLearningEfficiency ;
    let numAttempsInSession = $scope.currentQuestion.learningStats.numAttemptsInSession ;
    let curLevel = $scope.currentQuestion.learningStats.currentLevel ;

    // Compute specialized page turner action only if this is the first attempt.
    if( numAttempsInSession === 0 ) {
        if( curLevel === 'L3' ) {
            pageTurnerAction = PTA_RATE_CARD_MAS ;
        }
        else if( qType === "multi_choice" || qType === "true_false" ) {
            if( numAttempts >= 1 && absEff === 100 ) {
                pageTurnerAction = PTA_RATE_CARD_APM ;
            }
        }
        else if( qType === "fib" || qType === "matching" ) {
            if( numAttempts >= 2 && absEff === 100 ) {
                pageTurnerAction = PTA_RATE_CARD_APM ;
            }
        }
        else if( qType === 'question_answer' && elementType === 'chem_equation' ) {
            if( numAttempts >= 2 && absEff === 100 ) {
                pageTurnerAction = PTA_RATE_CARD_APM ;
            }
        }
    }
}

function rearrangeQuestionsForFatigueBusting() {

    if( !$scope.studyCriteria.engageFatigueBuster ) {
        return ;
    }

    if( $scope.questionsForSession.length < 2 ) {
        return ;
    }

    if( $scope.currentFatigueLevel < FATIGUE_UPPER_HYSTERISIS_THRESHOLD &&
        $scope.currentFatigueLevel > FATIGUE_LOWER_HYSTERISIS_THRESHOLD ) {

        $scope.inNormalFatigueZone = true ;
        $scope.inUpperHysterisZone = false ;
        $scope.inLowerHysterisZone = false ;
    }
    else if( $scope.currentFatigueLevel >= FATIGUE_UPPER_HYSTERISIS_THRESHOLD ) {

        if( $scope.currentFatigueLevel >= FATIGUE_UPPER_THRESHOLD ) {
            $scope.inUpperHysterisZone = true ;
            $scope.inLowerHysterisZone = false ;
            $scope.inNormalFatigueZone = false ;
        }
    }
    else if( $scope.currentFatigueLevel <= FATIGUE_LOWER_HYSTERISIS_THRESHOLD ) {

        if( $scope.currentFatigueLevel <= FATIGUE_LOWER_THRESHOLD ) {
            $scope.inUpperHysterisZone = false ;
            $scope.inLowerHysterisZone = true ;
            $scope.inNormalFatigueZone = false ;
        }
    }

    let targetQIndex = 0;

    if( $scope.inUpperHysterisZone ) {

        // Present a question with minimum fatigue potential
        let minFaitiguePotential = $scope.questionsForSession[0].learningStats.fatiguePotential;

        for( let i = 1; i<$scope.questionsForSession.length; i++ ) {
            let q = $scope.questionsForSession[i];
            if( q.learningStats.numAttemptsInSession === 0 ) {
                if( q.learningStats.fatiguePotential < minFaitiguePotential ) {
                    minFaitiguePotential = q.learningStats.fatiguePotential ;
                    targetQIndex = i ;
                }
            }
        }
    }
    else if( $scope.inLowerHysterisZone ) {

        // Present a quesiton with maximum fatigue potential
        const qIndexWithMaxFatiguePotential = 0;
        let maxFaitiguePotential = $scope.questionsForSession[0].learningStats.fatiguePotential;

        for(i = 1; i<$scope.questionsForSession.length; i++ ) {
            q = $scope.questionsForSession[i];
            if( q.learningStats.numAttemptsInSession === 0 ) {
                if( q.learningStats.fatiguePotential > maxFaitiguePotential ) {
                    maxFaitiguePotential = q.learningStats.fatiguePotential ;
                    targetQIndex = i ;
                }
            }
        }
    }

    if( targetQIndex !== 0 ) {
        const targetQ = $scope.questionsForSession[targetQIndex];
        $scope.questionsForSession[targetQIndex] = $scope.questionsForSession[0] ;
        $scope.questionsForSession[0] = targetQ ;
    }
}

function updateProjectedTimeLeft() {

    let timeLeft = 0;
    for ( let i = 0; i < $scope.questionsForSession.length; i++) {
        const question = $scope.questionsForSession[i];
        let avgTime = question.learningStats.averageTimeSpent;

        if( avgTime <= 0 ) {
            avgTime = 30 ;
        }
        timeLeft += avgTime ;
    }
    
    $scope.projectedTimeLeft = timeLeft*1000 ;
}

function computeRecommendPromoteFlag() {

    $scope.recommendPromoteToMastered = false ;
    $scope.recommendPromoteToMasteredWithoutScore = false ;

    if( $scope.$parent.studyCriteria.forceAPMControls ) {
        if( $scope.currentQuestion.learningStats.currentLevel != 'L0' ) {
            $scope.recommendPromoteToMastered = true ;
            $scope.recommendPromoteToMasteredWithoutScore = true ;
        }
        return ;
    }

    // Don't recommend promotion to mastered in non-assisted mode.
    if( !$scope.$parent.studyCriteria.assistedStudy ) return ;

    // If the question is already at L3 show the auto promote without score
    // button. Saving one attempt and more importantly getting free points in case
    // the tutor decides that the question has been sufficiently practiced.
    if( $scope.currentQuestion.learningStats.currentLevel == 'L3' ) {
        $scope.recommendPromoteToMasteredWithoutScore = true ;
        return ;
    }

    let recommendFlag = false;
    let numTrailingERatings = 0;
    let numHorPRatings = 0;

    const temporalScores = $scope.currentQuestion.learningStats.temporalScores;
    const numRatings = temporalScores.length;

    if( temporalScores.length >= 2 ) {

        let trailingEStreak = true;
        for( let i=temporalScores.length-1; i>=0; i-- ) {

            const rating = temporalScores[i];

            if( rating === "E" || rating === "A" ) {
                if( trailingEStreak ){ 
                    numTrailingERatings++ ;
                }
            }
            else {
                trailingEStreak = false ; 
            }

            if( rating === "H" || rating === "P"   ){
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
            if( numHorPRatings !== 0 ) {

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

    if( $scope.$parent.studyCriteria.getMaxTime() != -1 ) {
        if( durationTillNowInMillis >= $scope.$parent.studyCriteria.getMaxTime()*60*1000 ) {
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

    $scope.questionsForSession = $scope.$parent.filteredCards ;

    $scope.$parent.sessionStats.numCards     = $scope.questionsForSession.length ;
    $scope.$parent.sessionStats.numCardsLeft = $scope.questionsForSession.length ;
}

function handleTimerEvent() {
    if( sessionActive ) {
        if( resumeModalShowTime === 0 ) {
            refreshClocks() ;
            refreshCardTimeProgressBars() ;
            if( $scope.answerPushed ) {
                if( $scope.remainingAnsPushTime > 0 ) {
                    $scope.remainingAnsPushTime = Math.max( $scope.remainingAnsPushTime-1000, 0 ) ;
                    refreshAnsPushTimeProgressBar() ;
                }
            }
            setTimeout( handleTimerEvent, 1000 ) ;
        }
        else {
            setTimeout( handleTimerEvent, 500 ) ;
        }
    }
}

function refreshClocks() {

    timeForCurrentQuestion = Math.ceil(( new Date().getTime() - 
                                         currentQuestionShowStartTime - 
                                         totalQuestionPauseTime )) ;
    durationTillNowInMillis = new Date().getTime() - sessionStartTime - totalSessionPauseTime ;

    $scope.currentAnsTime = timeForCurrentQuestion ;
    $scope.$parent.timePerQuestion = durationTillNowInMillis / 
                             ( $scope.$parent.sessionStats.numCardsAnswered + 1 ) ;

    if( $scope.projectedTimeLeft >= 1000 ) {
        $scope.projectedTimeLeft -= 1000 ;
    }

    if( $scope.$parent.studyCriteria.getMaxTime() !== -1 ) {

        var timeLeftInMillis = $scope.$parent.studyCriteria.getMaxTime() * 60 * 1000 -
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

    $scope.$parent.curSessionDuration = durationTillNowInMillis ;

    $scope.$digest() ;
}

function renderTimeMarkersForCurrentQuestion() {

    let selfAvgTimePct = (5 / 9) * currentQuestionAvSelfTime;
    const predictedTimePct = (5 / 9) * currentQuestionAvPredictedTime;

    let mark1 = 0;
    let mark1Class = "";
    let fill1Pct = 0;
    let mark2 = 0;
    let mark2Class = "";
    let fill2Pct = 0;

    if( selfAvgTimePct === 0 ) { selfAvgTimePct = predictedTimePct ; }

    if( selfAvgTimePct > predictedTimePct ) {
        mark1 = predictedTimePct ;
        mark2 = selfAvgTimePct ;
        mark1Class = "progress-bar progress-bar-info" ;
        mark2Class = "progress-bar progress-bar-warning" ;
    }
    else {
        mark1 = selfAvgTimePct ;
        mark2 = predictedTimePct ;
        mark1Class = "progress-bar progress-bar-warning" ;
        mark2Class = "progress-bar progress-bar-info" ;
    }

    fill1Pct = mark1 - 1 ;
    fill2Pct = mark2 - mark1 - 1 ;

    // Why setTimeout - because for the first question, since Angular is 
    // executing, the div id is not yet accessible and hence the we are 
    // sequencing it after Angular digest runs.
    setTimeout( function(){
        $( "#pb_av_fill1" ).css( "width", fill1Pct + "%" ) ;
        $( "#pb_av_fill2" ).css( "width", fill2Pct + "%" ) ;

        $( "#pb_av_mark1" ).removeClass() ;
        $( "#pb_av_mark2" ).removeClass() ;
        $( "#pb_av_mark1" ).addClass( mark1Class ) ;
        $( "#pb_av_mark2" ).addClass( mark2Class ) ;

        $( "#curr_pb" ).removeClass() ;
        $( "#curr_pb" ).addClass( "progress-bar progress-bar-success" ) ;
    }, 20 ) ;
}

function refreshCardTimeProgressBars() {

    const delta = Math.ceil((new Date().getTime() - currentQuestionShowStartTime - totalQuestionPauseTime) / 1000);

    if( delta > 0 ) {

        const percent = (5 / 9) * delta;
        if( percent <= 105 ) {
            $( "#curr_pb" ).css( "width", percent + "%" ) ;
        }

        if( delta > currentQuestionAvSelfTime && 
            delta < (1.5 * currentQuestionAvSelfTime) ) {

            if( currentTimerStage !== PROGRESS_STAGE_AMBER ) {
                currentTimerStage = PROGRESS_STAGE_AMBER ;
                $( "#curr_pb" ).removeClass( "progress-bar-success" ) ;
                $( "#curr_pb" ).addClass( "progress-bar-warning" ) ;
            }
        }
        else if( delta > (1.5*currentQuestionAvSelfTime) ) {

            if( currentTimerStage !== PROGRESS_STAGE_RED ) {
                currentTimerStage = PROGRESS_STAGE_RED ;
                $( "#curr_pb" ).removeClass( "progress-bar-warning" ) ;
                $( "#curr_pb" ).addClass( "progress-bar-danger" ) ;
            }
        }
    }
}

function refreshAnsPushTimeProgressBar() {
    let percent = 0 ;
    if( $scope.totalAnsPushTime > 0 ) {
        percent = ($scope.remainingAnsPushTime / $scope.totalAnsPushTime)*100 ;
    }
    $( "#ans-push-progressbar" ).css( "width", percent + "%" ) ;
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

    if( ( curBodyTop !== oldBodyTop ) || ( curBodyBottom !== oldBodyBottom ) ) {
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

    if( scoreDelta !== 0 ) {
        var delta = ( scoreDelta > 0 ) ? 1 : -1 ;
        $scope.userScore += delta ;
        scoreDelta       -= delta ;
        setTimeout( updateScore, 10 ) ;
    }
}

// ---------------- Server calls -----------------------------------------------
function callMarkForReviewAPI( cardId, successCallback ) {

    log.debug( "Calling mark for review API for card " + cardId ) ;

    $http.post( '/jove_notes/api/NEReview', { 
        opType : 'mark_for_review',
        cardId : cardId
    })
    .success( function( data ){
        if( typeof data === 'string' ) {
            $scope.addErrorAlert( "Mark for Review API call failed. " + 
                                  "Server says - " + data ) ;
        }
        else {
            successCallback( data ) ;
        }
    })
    .error( function( data ){
        var message = "Could not mark card for review." ;
        log.error( message ) ;
        log.error( "Server says - " + data ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
}

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
                           rating, timeTaken, numAttempts, overshootPct,
                           previousCallAttemptNumber ) {

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    log.debug( "Calling grade card API for card " + cardId + " with parameters." ) ;
    log.debug( "\tchapterId           = " + chapterId   ) ;
    log.debug( "\tsessionId           = " + sessionId   ) ;
    log.debug( "\tcardId              = " + cardId      ) ;
    log.debug( "\tcurrentLevel        = " + curLevel    ) ;
    log.debug( "\tnextLevel           = " + nextLevel   ) ;
    log.debug( "\trating              = " + rating      ) ;
    log.debug( "\ttimeTaken           = " + timeTaken   ) ;
    log.debug( "\tnumAttempts         = " + numAttempts ) ;
    log.debug( "\tovershootPct        = " + overshootPct ) ;
    log.debug( "\tskipNegativeGrading = " + $scope.$parent.studyCriteria.skipNegativeGrading ) ;


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
        "skipNegativeGrading" : $scope.$parent.studyCriteria.skipNegativeGrading
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

        if( status === 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_GRADE_CARD_API_CALL_RETRIES ) {
                log.debug( "Retrying the call again." ) ;
                callGradeCardAPI( 
                    chapterId, sessionId, cardId, curLevel, nextLevel, 
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

function callRFMApiToAlertStudent() {

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
        chapterId   : chapterId,
        msgType     : 'alert',
        msgContent  : null
    })
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
        if( status === 0 ) {
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
            "progressSnapshot"  : $scope.$parent.progressSnapshot,
            "sessionStats"      : $scope.$parent.sessionStats,
            "currentQuestion"   : $scope.currentQuestion,
            "answerAlign"       : $scope.answerAlign,
            "predictedTime"     : currentQuestionAvPredictedTime,
            "avgSelfTime"       : currentQuestionAvSelfTime,
            "ratings"           : $scope.ratings,
            "projectedTimeLeft" : $scope.projectedTimeLeft 
        }
    })
    .success( function( data ){
        $scope.pushQuestionSuccess = true ;
    })
    .error( function( data, status ){

        if( status === 0 ) {
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

function callRFMApiToPauseResumeSession( action, previousCallAttemptNumber, callbackFn ) {

    if( !$scope.$parent.studyCriteria.push ) {
        callbackFn() ;
        return ;
    } ;

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    log.debug( "Pushing " + action + " session message to remote user. Attempt - " + 
               currentCallAttemptNumber ) ;

    $http.post( '/jove_notes/api/RemoteFlashMessage', { 
        sessionId   : $scope.$parent.sessionId,
        chapterId   : chapterId,
        msgType     : action,
        msgContent  : {}
    })
    .success( function( data ){
        callbackFn() ;
    })
    .error( function( data, status ){

        if( status === 0 ) {
            log.debug( "Faulty connection determined." ) ;
            if( currentCallAttemptNumber < MAX_PUSH_QUESTION_API_CALL_RETRIES ) {
                log.debug( "Retrying the push " + action + " session call again." ) ;
                callRFMApiToPauseSession( currentCallAttemptNumber ) ;
                return ;
            }
            log.debug( "Number of retries exceeded. Notifying the user." ) ;
        }

        var message = "Could not post " + action + " session for remote view. " + 
                      "Server says status = " + status + " and " + 
                      "Response = " + data ;
        log.error( message ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
}

function fetchZoomDeltaFromServer( callback ) {
    $http.get( '/__fw__/api/UserPreference?keys=jove_notes.flashCardFontZoomDelta' )
    .success( function( data ){
        currentFontZoomDelta = data[ "jove_notes.flashCardFontZoomDelta" ] ;
        callback() ;
    } )
    .error( function( data, status ){
        $scope.addErrorAlert( "Could not get zoom delta preference." ) ;
        callback() ;
    } )  ;
}

function saveZoomDeltaAtServer() {
    $http.put( '/__fw__/api/UserPreference', { 
        "jove_notes.flashCardFontZoomDelta" : currentFontZoomDelta
    }) ;
}

// ---------------- End of controller ------------------------------------------
} ) ; 