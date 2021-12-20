dashboardApp.controller( 'DashboardController', function( $scope, $http ) {

	$scope.currentReport = '' ;
	$scope.pageTitle     = '' ;
	$scope.todayStudyDuration = 0 ;

	$scope.alerts = [] ;

	$scope.currentUserName = currentUserName ;

	fetchTodayStudyDuration() ;

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

	function fetchTodayStudyDuration() {

	    console.log( "Fetching today study time." ) ;
	    $http.get( '/jove_notes/api/PivotData/TodayTime', {
	        params : {
	            'startDate' : null, 
	            'endDate'   : null
	        }
	    })
	    .success( function( data ){
	        $scope.todayStudyDuration = data * 1000 ;
	    })
	    .error( function( data ){
	        log.error( "API error " + data ) ;
	        $scope.addErrorAlert( "API error " + data ) ;
	    }) ;
	}
} ) ;



