flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var ratingMatrix        = new RatingMatrix() ;
var currentTopPadHeight = 100 ;
var questionsForSession = [] ;

var currentQuestionShowStartTime = 0 ;
var durationTillNowInMillis = 0 ;
var timePerQuestionInMillis = 0 ;

var sessionStartTime    = new Date().getTime() ;
var sessionActive       = true ;

// ---------------- Controller variables ---------------------------------------
$scope.showL0Header     = true ;
$scope.showL1Header     = true ;
$scope.showL2Header     = true ;
$scope.showAuxControls  = false ;
$scope.showFooterDropup = true ;

$scope.paddingTopHeight = { height: currentTopPadHeight + 'px' } ;

$scope.currentQuestion  = null ;

$scope.questionText = "" ;
$scope.answerText   = "" ;
$scope.sinceLastAttempt = "" ;

$scope.questionMode = false ;

$scope.sessionStats = {
	numCards         : 0,
	numCardsLeft     : 0,
	numCardsAnswered : 0
} ;

$scope.sessionClockHHMMSS      = "00:00:00" ;
$scope.timePerQuestionInHHMMSS = "00:00:00" ;

$scope.windowWidth = "" ;

// ---------------- Main logic for the controller ------------------------------
{
	log.debug( "Executing PracticePageController." ) ;
	if( checkInvalidLoad() ) {
		log.debug( "Invalid refresh detected. Returning to start page." ) ;
		return ;
	}

	window.addEventListener( "resize", onWindowResize ) ;
	onWindowResize() ;

	log.debug( "Serializing study criteria." ) ;
	$scope.$parent.studyCriteria.serialize() ;

	log.debug( "Computing session cards." ) ;
	computeSessionCards() ;

	log.debug( "Starting timer." ) ;
	setTimeout( handleTimerEvent, 1000 ) ;

	showNextCard() ;
}

// ---------------- Controller methods -----------------------------------------
$scope.toggleDisplay = function( displayId ) {

	if ( displayId == "L0-Hdr" ) { 
		$scope.showL0Header = !$scope.showL0Header;
		currentTopPadHeight += ( $scope.showL0Header ) ? 25 : -25 ;
	}
	else if ( displayId == "L1-Hdr" ) { 
		$scope.showL1Header = !$scope.showL1Header; 
		currentTopPadHeight += ( $scope.showL1Header ) ? 25 : -25 ;
	}
	else if ( displayId == "L2-Hdr" ) { 
		$scope.showL2Header = !$scope.showL2Header; 
		currentTopPadHeight += ( $scope.showL2Header ) ? 25 : -25 ;
	}
	else if ( displayId == "AuxControls" ) { 
		$scope.showAuxControls = !$scope.showAuxControls; 
	}

	$scope.paddingTopHeight.height = currentTopPadHeight + 'px' ;
}

$scope.randomizeCards = function() {
	log.debug( "Randomizing remaining cards." ) ;
	questionsForSession.shuffle() ;
}

$scope.endSession = function() {
	log.debug( "Ending current session." ) ;
	endSession() ;
}

$scope.purgeCard = function() {
	log.debug( "Purging current card." ) ;
	
	$scope.sessionStats.numCards-- ;
	$scope.sessionStats.numCardsLeft-- ;
	showNextCard() ;
}

$scope.markCardForEdit = function() {
	alert( "Mark card for edit." ) ;
}

$scope.rateCard = function( rating ) {
	log.debug( "Rating current card as " + rating )	 ;

	var curLevel   = $scope.currentQuestion.learningStats.currentLevel ;
	var nextLevel  = ratingMatrix.getNextLevel( curLevel, rating ) ;
	var nextAction = ratingMatrix.getNextAction( curLevel, rating ) ;

	processNextAction( nextAction ) ;
	updateLearningStatsForCurrentQuestion( rating, nextLevel ) ;
	updateLearningStatsForChapter( curLevel, nextLevel ) ;
	updateSessionStats() ;

	log.debug( "Current level = " + curLevel ) ;
	log.debug( "Next level    = " + nextLevel ) ;
	log.debug( "Next action   = " + nextAction ) ;
	log.debug( "Num attmepts  = " + $scope.currentQuestion.learningStats.numAttemptsInSession ) ;
	log.debug( "Time spent    = " + $scope.currentQuestion.learningStats.numSecondsInSession ) ;
	
	// TODO: Compute the score 
	// TODO: Initiate asynchronous communication with server to save ratings
	showNextCard() ;
}

$scope.showAnswer = function() {

	$scope.answerText   = $scope.currentQuestion.formattedAnswer ;
	$scope.questionMode = false ;
}

// ---------------- Private functions ------------------------------------------
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

	$scope.$parent.progressStats[ 'numCards' + curLevel  ]-- ;
	$scope.$parent.progressStats[ 'numCards' + nextLevel ]++ ;
}

function updateSessionStats() {

	$scope.sessionStats.numCardsLeft = questionsForSession.length ;
	$scope.sessionStats.numCardsAnswered++ ;
}

function processNextAction( actionValue ) {

	if( actionValue != -1 ) {
		var newPos = questionsForSession.length * actionValue + 1 ;
        questionsForSession.splice( newPos, 0, $scope.currentQuestion ) ;
	}
}

function showNextCard() {

	if( !hasSessionEnded() ) {

		$scope.currentQuestion = questionsForSession.shift() ;

		$scope.questionMode = true ;
		$scope.questionText = $scope.currentQuestion.formattedQuestion ;
		$scope.answerText   = '' ;
		$scope.sinceLastAttempt = getFormattedSinceLastAttemptString() ;

		currentQuestionShowStartTime = new Date().getTime() ;
	}
	else {
		endSession() ;
	}
}

function getFormattedSinceLastAttemptString() {

	if( $scope.currentQuestion.learningStats.lastAttemptTime < 0 ) return "" ;

	var str = "" ;
	var numSecs = 0 ;
	var millis = new Date().getTime() - $scope.currentQuestion.learningStats.lastAttemptTime ;

	if( millis > 0 ) {
	    numSecs = Math.floor( millis / 1000 ) ;
	    var days = Math.floor( numSecs / ( 3600 * 24 ) ) ;

	    numSecs = numSecs - ( days * 3600 * 24 ) ;
	    var hours = Math.floor( numSecs / 3600 ) ;

	    numSecs = numSecs - ( hours * 3600 ) ; 
	    var minutes = Math.floor( numSecs / 60 ) ;

	    var seconds = numSecs - ( minutes * 60 ) ;

	    if( days > 0 ) {
	    	str = days + " days ago" ;
	    }
	    else {
	    	if( hours > 0 ) {
	    		str = hours + " hrs ago" ;
	    	}
	    	else {
	    		if( minutes > 0 ) {
	    			str = minutes + " min ago" ;
	    		}
	    		else {
	    			str = seconds + " sec ago" ;
	    		}
	    	}
	    }
	}
	return str ;
}

function endSession() {

	sessionActive = false ;
	$location.path( "/EndPage" ) ;
}

function hasSessionEnded() {

	if( $scope.$parent.studyCriteria.maxTime != -1 ) {
		if( durationTillNowInMillis >= $scope.$parent.studyCriteria.maxTime*60*1000 ) {
			return true ;
		}
	}

	if( questionsForSession.length == 0 ) {
		return true ;
	}

	return false ;
}

function checkInvalidLoad() {
	if( $scope.$parent.progressStats == null ) {
		$location.path( "/StartPage" ) ;
		return true ;
	}
	return false ;
}

function computeSessionCards() {

	applyStudyCriteriaFilter() ;
	sortCardsAsPerStudyStrategy() ;
	trimCardsAsPerBounds() ;

	$scope.sessionStats.numCards     = questionsForSession.length ;
	$scope.sessionStats.numCardsLeft = questionsForSession.length ;
}

function applyStudyCriteriaFilter() {

	var i = 0 ;
	for( ; i < $scope.chapterData.questions.length ; i++ ) {
		var question = $scope.chapterData.questions[ i ] ;
		if( $scope.studyCriteria.matchesFilter( question ) ) {
			log.debug( "Adding question " + question.questionId ) ;
			questionsForSession.push( question ) ;
		}
		else {
			log.debug( "Filtering question " + question.questionId ) ;
		}
	}
}

function sortCardsAsPerStudyStrategy() {
	
	var strategy = $scope.studyCriteria.strategy ;

	if( strategy == StudyStrategyTypes.prototype.SSR ) {
		// TODO:
	}
	else if( strategy == StudyStrategyTypes.prototype.EFF_HARD ) {

	}
	else if( strategy == StudyStrategyTypes.prototype.EFF_EASY ) {

	}
	else if( strategy == StudyStrategyTypes.prototype.OBJECTIVE ) {

	}
	else if( strategy == StudyStrategyTypes.prototype.SUBJECTIVE ) {

	} 
}

function trimCardsAsPerBounds() {
	log.error( "TODO: trimCardsAsPerBounds implementation." ) ;
}

function handleTimerEvent() {
	if( sessionActive ) {
		refreshClocks() ;
		setTimeout( handleTimerEvent, 1000 ) ;
	}
}

function refreshClocks() {

	durationTillNowInMillis = new Date().getTime() - sessionStartTime ;

	timePerQuestionInMillis = durationTillNowInMillis / 
	                          ( $scope.sessionStats.numCardsAnswered + 1 ) ;

	$scope.timePerQuestionInHHMMSS = toHHMMSS( timePerQuestionInMillis ) ;

	if( $scope.$parent.studyCriteria.maxTime != -1 ) {

		var timeLeftInMillis = $scope.$parent.studyCriteria.maxTime * 60 * 1000 -
		                       durationTillNowInMillis ;
		if( timeLeftInMillis <= 0 ) {
			sessionActive = false ;
		}
		else {
			$scope.sessionClockHHMMSS = toHHMMSS( timeLeftInMillis ) ;
		}
	}
	else {
		$scope.sessionClockHHMMSS = toHHMMSS( durationTillNowInMillis ) ;
	}
	$scope.$digest() ;
}

function onWindowResize() {
	
	if( window.innerWidth < 700 ) {
		$scope.showL0Header     = false ;
		$scope.showL1Header     = false ;
		$scope.showL2Header     = true ;
		$scope.showAuxControls  = false ;
		$scope.showFooterDropup = false ;

		currentTopPadHeight = 30 ;
		$scope.paddingTopHeight.height = currentTopPadHeight + 'px' ;
	}
	else {
		if( !$scope.showFooterDropup ) {
			$scope.showFooterDropup = true ;
			$scope.showL0Header     = true ;
			$scope.showL1Header     = true ;
			$scope.showL2Header     = true ;
			$scope.showAuxControls  = false ;
			$scope.showFooterDropup = true ;
		}
	}
}

// ---------------- End of controller ------------------------------------------
} ) ; 