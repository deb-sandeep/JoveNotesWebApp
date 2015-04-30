flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var currentTopPadHeight = 80 ;
var questionsForSession = [] ;

// ---------------- Controller variables ---------------------------------------
$scope.showL0Header    = true ;
$scope.showL1Header    = true ;
$scope.showL2Header    = true ;
$scope.showAuxControls = true ;

$scope.paddingTopHeight = {
	height: currentTopPadHeight + 'px'
} ;

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

	log.debug( "Starting timer." ) ;
	setTimeout( handleTimerEvent, 1000 ) ;

	// Show next question and after that user triggers will move the game forward.
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
	alert( "Randomizing cards" ) ;
}

$scope.endSession = function() {
	alert( "Ending session" ) ;
}

$scope.purgeCard = function() {
	alert( "Purge card" ) ;
}

$scope.markCardForEdit = function() {
	alert( "Mark card for edit." ) ;
}

$scope.rateCard = function( rating ) {
	alert( "Rating current card as " + rating )	 ;
}

// ---------------- Private functions ------------------------------------------
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
	log.error( "TODO: sortCardsAsPerStudyStrategy implementation." ) ;
}

function trimCardsAsPerBounds() {
	log.error( "TODO: trimCardsAsPerBounds implementation." ) ;
}

function handleTimerEvent() {
	log.debug( "Timer event handled." ) ;

	setTimeout( handleTimerEvent, 1000 ) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;