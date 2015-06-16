dashboardApp.controller( 'ReportsController', function( $scope ) {

$scope.$parent.pageTitle = "Report Page" ;
$scope.$parent.currentReport = 'Reports' ;

$scope.dateRange = {
	startDate : null,
	endDate   : null 
} ;

setTimeout( function(){
	console.log( $scope.dateRange.startDate ) ;
}, 100 ) ;

} ) ;