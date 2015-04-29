flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams, $location ) {
// -----------------------------------------------------------------------------

$scope.showL0Header = true  ;
$scope.showL1Header = false ;
$scope.showL2Header = false	;
$scope.showAuxControls = false ;

// -------------------------Startup processing----------------------------------
if( checkInvalidLoad() ) {
	return ;
}
$scope.$parent.studyCriteria.serialize() ;
constructPageTitle() ;

// TODO: Set $scope.$parent.pageTitle
// Apply study criteria and filter cards that will be shown in this session
// Start the timer
// Parent learningStats at chapter level will undergo constant modification
// Make scope variables for tracking session level performance
// Make the flash card json richer

// -----------------------------------------------------------------------------
$scope.toggleDisplay = function( displayId ) {

	if ( displayId == "L0-Hdr" ) { 
		$scope.showL0Header = !$scope.showL0Header; 
	}
	else if ( displayId == "L1-Hdr" ) { 
		$scope.showL1Header = !$scope.showL1Header; 
	}
	else if ( displayId == "L2-Hdr" ) { 
		$scope.showL2Header = !$scope.showL2Header; 
	}
	else if ( displayId == "AuxControls" ) { 
		$scope.showAuxControls = !$scope.showAuxControls; 
	}
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

// -----------------------------------------------------------------------------

function checkInvalidLoad() {
	if( $scope.$parent.learningStats == null ) {
		$location.path( "/StartPage" ) ;
		return true ;
	}
	return false ;
}

function constructPageTitle() {
	$scope.$parent.pageTitle = $scope.$parent.rawData.subjectName + " " + 
	                           $scope.$parent.rawData.chapterNumber + "." + 
	                           $scope.$parent.rawData.subChapterNumber + " - " +
	                           $scope.$parent.rawData.chapterName ;
}

} ) ;