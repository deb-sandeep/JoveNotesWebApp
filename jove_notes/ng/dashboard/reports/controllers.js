dashboardApp.controller( 'ReportsController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------
var LEFT_GUTTER = 75 ;
var RIGHT_GUTTER = 75 ;

// ---------------- Local variables --------------------------------------------
var positiveBarChart = null ;
var negativeBarChart = null ;
var lineChart        = null ;

var baseLineChartValue = 0 ;
var dataValues = [] ;
var chartXLabels = [] ;
var barXAxisPosition = 'center' ;
var numDecimals = 0 ;

var barChartValues  = [] ;
var lineChartValues = [] ;

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle = "Report Page" ;
$scope.$parent.currentReport = 'Reports' ;

$scope.subjectNames = [] ;

$scope.preferences = {

	entityType : 'Score',
	dateRange : {
		startDate : moment().startOf('day').toDate(),
		endDate : moment().endOf('day').toDate()
	},
	chosenSubjectNames : [ "All" ],
	dataFrequency : 'intraday'
} ;

$scope.reportTitle = "Score earned " ;
$scope.maxYValue = 0 ;
$scope.deltaInPeriod = 0 ;

// ---------------- Main logic for the controller ------------------------------

initializeDateRange() ;
callReportSubjectsAPI() ;

$scope.$watch( 'preferences', function( oldValue, newValue ){
	// NOTE: We don't call report plot data API directly. The watch fires it
	// for us on the load of the controller.
	callReportPlotDataAPI() ;
}, true ) ;

// ---------------- Controller methods -----------------------------------------

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

function redrawChart() {

    barChartValues.length = 0 ;
    lineChartValues.length = 0 ;
    $scope.deltaInPeriod = 0 ;
    
    for( var i=0; i<dataValues.length; i++ ) {
    	var val = dataValues[i] ;

        $scope.deltaInPeriod += val ;
		barChartValues.push( val ) ;
    	if( i == 0 ) {
    		lineChartValues.push( baseLineChartValue + val ) ;
    	}
    	else {
    		lineChartValues.push( lineChartValues[i-1] + val ) ;
    	}
    }

    RGraph.ObjectRegistry.Clear() ;
	RGraph.clear( document.getElementById( 'reportChart' ) ) ;

	initializePositiveBarChart() ;
	initializeLineChart() ;

	positiveBarChart.draw() ;
	lineChart.draw() ;
}

function initializePositiveBarChart() {

    positiveBarChart = new RGraph.Bar({
        id: 'reportChart',
        data: barChartValues,
        options: {
            hmargin:0,
	        labels: chartXLabels,
        	gutter : {
        		left  : LEFT_GUTTER,
        		right : RIGHT_GUTTER
        	},
            colors                   : ['#D7FFD6'],
            'background.grid.vlines' : false,
            'scale.decimals'         : numDecimals,
            strokestyle              : 'rgba(0,0,0,0)',
            ylabels                  : true,
            xaxispos                 : barXAxisPosition,
            yaxispos                 : 'left',
            noxaxis                  : true,
            shadow                   : false
        }
    }) ;
}

function initializeLineChart() {

    lineChart = new RGraph.Line({
        id: 'reportChart',
        data: lineChartValues,
        options: {
        	gutter : {
        		left  : LEFT_GUTTER,
        		right : RIGHT_GUTTER
        	},
        	axis : {
        		color : 'blue'
        	},
            'background.grid.vlines' : false,
        	colors    : ['blue'],
            spline    : true,
            shadow    : true,
			tickmarks : 'endcircle',
            yaxispos  : 'right',
			noxaxis   : true
		}
    }) ;
}

// ---------------- Server calls -----------------------------------------------
function callReportPlotDataAPI() {

	var startMoment = moment( $scope.preferences.dateRange.startDate ) ;
	var endMoment   = moment( $scope.preferences.dateRange.endDate   ) ;

    $http.get( '/jove_notes/api/ReportPlot/' + $scope.preferences.entityType, {
    	params : {
    		'startDate'     : startMoment.format( "YYYY-MM-DD HH:mm:ss" ), 
    		'endDate'       : endMoment.format( "YYYY-MM-DD HH:mm:ss" ),
    		'dataFrequency' : $scope.preferences.dataFrequency,
    		'subject'       : $scope.preferences.chosenSubjectNames[0]
    	}
    })
    .success( function( data ){

		dataValues.length   = 0 ;
		chartXLabels.length = 0 ;

		baseLineChartValue = data.priorValue ;
		dataValues         = data.values ;
		chartXLabels       = data.labels ;
        $scope.maxYValue   = data.maxValue ;

        if( $scope.preferences.entityType == 'Score' ) {
            $scope.reportTitle = "Score earned " ;
            barXAxisPosition = 'center' ;
            numDecimals = 0;
        }
        else {
            $scope.reportTitle = "Time spent (hrs) " ;
            barXAxisPosition = 'bottom' ;
            numDecimals = 1;
        }

	    redrawChart() ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

function callReportSubjectsAPI() {

    $http.get( '/jove_notes/api/ReportPlot/Subjects' )
    .success( function( data ){

    	$scope.subjectNames.length = 0 ;
	    $scope.subjectNames.push( { id : "All", name : "All subjects" } ) ;
    	if( data instanceof Array ) {
	        for( var i=0; i<data.length; i++ ) {
			    $scope.subjectNames.push( { 
			    	id : data[i],        
			    	name : data[i] 
			    });
	        }
    	}
    	else {
	        $scope.addErrorAlert( "API error " + data ) ;
    	}
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}
// ---------------- End of controller ------------------------------------------
} ) ;