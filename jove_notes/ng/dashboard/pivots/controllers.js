dashboardApp.controller( 'PivotsController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle = "Report Pivots Page" ;
$scope.$parent.currentReport = 'Pivots' ;
$scope.reportTitle = 'Time spent' ;

// preferences.entityType can take on the following values [Time, NumQuestions]
$scope.preferences = {

	entityType : 'Time',
	dateRange : {
		startDate : moment().subtract( 6, 'days').startOf('day').toDate(),
		endDate : moment().endOf('day').toDate()
	},
} ;

// ---------------- Main logic for the controller ------------------------------
initializeDateRange() ;

$scope.$watch( 'preferences', function( oldValue, newValue ){
	// NOTE: We don't call report plot data API directly. The watch fires it
	// for us on the load of the controller.
	callPivotAPI() ;
}, true ) ;

// ---------------- Controller methods -----------------------------------------
$scope.refresh = function() {
    callPivotAPI() ;
}

// ---------------- Private functions ------------------------------------------
function initializeDateRange() {

    $('#reportrange span').html( 
    	moment( $scope.preferences.dateRange.startDate ).format('MMMM D, YYYY')
    	+ ' - ' +
    	moment( $scope.preferences.dateRange.endDate   ).format('MMMM D, YYYY')
    );
 
    $('#reportrange').daterangepicker({
        format: 'MM/DD/YYYY',
        startDate: $scope.preferences.dateRange.startDate,
        endDate: $scope.preferences.dateRange.endDate,
        showDropdowns: true,
        showWeekNumbers: true,
        ranges: {
           'Today' : 
	   			[ 
	   			  moment(), 
	   			  moment()
	   			],
           'Yesterday' : 
	   			[ 
	   			  moment().subtract(1, 'days'), 
	   			  moment().subtract(1, 'days')
	   			],
           'This Week' : 
                [ 
                  moment().startOf('week'), 
                  moment().endOf('week')
                ],
           'Last 7 Days' : 
	   			[ 
	   			  moment().subtract(6, 'days'), 
	   			  moment()
	   			],
           'Last 30 Days' : 
	   			[ 
	   			  moment().subtract(29, 'days'), 
	   			  moment()
	   			],
           'This Month' : 
	   			[ 
	   			  moment().startOf('month'), 
	   			  moment().endOf('month')
	   			],
           'Last Month' : 
	   			[ 
	   			  moment().subtract(1, 'month').startOf('month'), 
	   			  moment().subtract(1, 'month').endOf('month')
	   			]
        },
        opens         : 'right',
        drops         : 'down',
        buttonClasses : ['btn', 'btn-sm'],
        applyClass    : 'btn-primary',
        cancelClass   : 'btn-default',
        separator     : ' to ',
        locale        : {
            applyLabel       : 'Submit',
            cancelLabel      : 'Cancel',
            fromLabel        : 'From',
            toLabel          : 'To',
            customRangeLabel : 'Custom',
            daysOfWeek       : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
            monthNames       : ['January', 'February', 'March', 'April', 'May', 
                                'June', 'July', 'August', 'September', 
                                'October', 'November', 'December'],
            firstDay         : 1
        }
    }, function( start, end, label ) {
        $('#reportrange span').html( 
        	start.format('MMMM D, YYYY') 
        	+ ' - ' + 
        	end.format('MMMM D, YYYY')
        ) ;
        $scope.preferences.dateRange.startDate = start.toDate() ;
        $scope.preferences.dateRange.endDate   = end.toDate() ;
        $scope.$digest() ;
    });
}

function refreshTable( data ) {

    var srcColNames = [ "Date", "Subject", "Chapter", "Value" ] ;
    var pivotData = data ;
    var pivotTable = new PivotTable() ;
    var pivotTitle = "" ;

	if( $scope.preferences.entityType == 'Time' ) {
		pivotTitle = "Time spent. (hh:mm:ss)" ;
	}
	else {
		pivotTitle = "Number of questions attempted." ;
	}

    pivotTable.setPivotData( srcColNames, pivotData ) ;

    pivotTable.initializePivotTable( [ "Date", "Subject", "Chapter" ], "Subject", "Value" ) ;
    pivotTable.renderPivotTable( "pivot_table_div", pivotTitle, renderHelperCallback ) ;
    pivotTable.expandFirstRow() ;
}

function renderHelperCallback( rowIndex, colIndex, cellData ) {

    var formattedValue = "" ;
    if( cellData != null ) {

		if( $scope.preferences.entityType == 'Time' ) {
	        if( rowIndex > 0 && colIndex > 0 ) { 

	            var val     = parseInt( cellData ) ;
	            var hours   = Math.floor( val / 3600 ) ;
	            var minutes = Math.floor( ( val - (3600*hours) ) / 60 ) ;
	            var seconds = Math.floor( val - ( (hours*3600) + (minutes*60) ) ) ;

	            if( hours == 0 ) { hours = "" ; }
	            else if( hours < 10 ) { hours = "0" + hours + ":" ; }
	            else { hours = hours + ":" ; }

	            if( minutes < 10 ) { 
	                minutes = "0" + minutes ; 
	            }
	            if( seconds < 10 ) { 
	                seconds = "0" + seconds ; 
	            }

	            formattedValue = hours + minutes + ":" + seconds ;
	        }
	        else {
	            formattedValue = cellData ;
	        }
	    }
	    else {
	    	formattedValue = cellData ;
	    }
    }
    return formattedValue ;
}


// ---------------- Server calls -----------------------------------------------
// TODO: 2. Save the data somewhere
// TODO: 3. Implement refreshTable
// TODO: 4. Revisit stylesheet for the table
function callPivotAPI() {

	var startMoment = moment( $scope.preferences.dateRange.startDate ) ;
	var endMoment   = moment( $scope.preferences.dateRange.endDate   ) ;

    $http.get( '/jove_notes/api/PivotData/' + $scope.preferences.entityType, {
    	params : {
    		'startDate'     : startMoment.format( "YYYY-MM-DD HH:mm:ss" ), 
    		'endDate'       : endMoment.format( "YYYY-MM-DD HH:mm:ss" )
    	}
    })
    .success( function( data ){

        if( $scope.preferences.entityType == 'Time' ) {
            $scope.reportTitle = "Time spent (hrs)" ;
        }
        else if( $scope.preferences.entityType == 'NumQuestions' ) {
            $scope.reportTitle = "Number of questions attempted" ;
        }
	    refreshTable( data ) ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

// ---------------- End of controller ------------------------------------------
} ) ;
