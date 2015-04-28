flashCardApp.controller( 'PracticePageController', function( $scope, $http, $routeParams ) {
// -----------------------------------------------------------------------------

$scope.$parent.pageTitle = "Flash Card Practice Page" ;
$scope.showL0Header = true ;
$scope.showL1Header = true ;
$scope.showL2Header = true ;

// -----------------------------------------------------------------------------
$scope.$parent.studyCriteria.serialize() ;
// TODO: Set $scope.$parent.pageTitle

// -----------------------------------------------------------------------------
$scope.toggleHeader = function( level ) {

	if      ( level == "L0" ) { $scope.showL0Header = !$scope.showL0Header; }
	else if ( level == "L1" ) { $scope.showL1Header = !$scope.showL1Header; }
	else if ( level == "L2" ) { $scope.showL2Header = !$scope.showL2Header; }
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
	
}

// -----------------------------------------------------------------------------
} ) ;