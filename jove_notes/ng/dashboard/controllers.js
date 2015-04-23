dashboardApp.controller( 'DashboardController', function( $scope ) {

	$scope.currentReport = 'ProgressSnapshot' ;
	
	$scope.alerts = [] ;

	$scope.addErrorAlert = function( msgString ) {
		$scope.alerts.push( { type: 'danger', msg: msgString } ) ;
	}

	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};

	$scope.getBtnActiveClass = function( reportName ) {
		return reportName == $scope.currentReport ? "active" : "" ;
	}

	$scope.setActiveReport = function( reportName ) {
		$scope.currentReport = reportName ;
	}
} ) ;



