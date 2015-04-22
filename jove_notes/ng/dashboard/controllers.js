dashboardApp.controller( 'DashboardController', function( $scope ) {

	$scope.currentReport = 'ProgressSnapshot' ;

	$scope.getBtnActiveClass = function( reportName ) {
		return reportName == $scope.currentReport ? "active" : "" ;
	}

	$scope.setActiveReport = function( reportName ) {
		$scope.currentReport = reportName ;
	}
} ) ;



