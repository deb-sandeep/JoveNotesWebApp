dashboardApp.controller( 'ReportsController', function( $scope ) {

// ---------------- Constants and inner class definition -----------------------
var LEFT_GUTTER = 40 ;
var RIGHT_GUTTER = 40 ;

// ---------------- Local variables --------------------------------------------
var positiveBarChart = null ;
var negativeBarChart = null ;
var lineChart        = null ;

var baseLineChartValue = 0 ;
var dataValues = [] ;
var chartXLabels = [] ;

var positiveBarValues = [] ;
var negativeBarValues = [] ;
var lineChartValues   = [] ;
var maxLineYValue     = 0 ;

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle = "Report Page" ;
$scope.$parent.currentReport = 'Reports' ;

$scope.subjectNames = [] ;

$scope.preferences = {

	entityType : 'score',
	dateRange : {
		startDate : moment().startOf('day').toDate(),
		endDate : moment().endOf('day').toDate()
	},
	chosenSubjectNames : [ "All" ],
	dataFrequency : 'weekly'
} ;

$scope.reportTitle = "Report of score earned." ;

initializeDateRange() ;
callReportSubjectsAPI() ;
callReportPlotDataAPI() ;

// ---------------- Main logic for the controller ------------------------------

$scope.$watch( 'preferences', function( oldValue, newValue ){
	console.log( "Configuration changed. Need to refresh the graph." ) ;
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

	RGraph.ObjectRegistry.Clear() ;

	initializePositiveBarChart() ;
	initializeNegativeBarChart() ;
	initializeLineChart() ;

    positiveBarValues.length = 0 ;
    negativeBarValues.length = 0 ;
    lineChartValues.length   = 0 ;
    
    maxLineYValue = 0 ;
    for( var i=0; i<dataValues.length; i++ ) {
    	var val = dataValues[i] ;
    	if( val > 0 ) {
    		positiveBarValues.push( val ) ;
    		negativeBarValues.push( 0 ) ;
    	}
    	else {
    		positiveBarValues.push( 0 ) ;
    		negativeBarValues.push( val ) ;
    	}

    	if( i == 0 ) {
    		lineChartValues.push( baseLineChartValue + val ) ;
    	}
    	else {
    		lineChartValues.push( lineChartValues[i-1] + val ) ;
    	}

    	if( lineChartValues[i] > maxLineYValue ) {
    		maxLineYValue = lineChartValues[i] ;
    	}
    }

	positiveBarChart.grow() ;
	negativeBarChart.grow() ;
	lineChart.trace2() ;
}

function initializePositiveBarChart() {

    positiveBarChart = new RGraph.Bar({
        id: 'reportChart',
        data: positiveBarValues,
        options: {
	        labels: chartXLabels,
        	gutter : {
        		left  : LEFT_GUTTER,
        		right : RIGHT_GUTTER
        	},
            colors: ['#8AFF88'],
            'background.grid.vlines' : false,
            strokestyle: 'rgba(0,0,0,0)',
            ylabels:true,
            xaxispos:'center',
            yaxispos:'right',
            noxaxis:true
        }
    }) ;
}

function initializeNegativeBarChart() {

    negativeBarChart = new RGraph.Bar({
        id: 'reportChart',
        data: negativeBarValues,
        options: {
        	gutter : {
        		left  : LEFT_GUTTER,
        		right : RIGHT_GUTTER
        	},
            colors: ['#FFC2C2'],
            'background.grid.vlines' : false,
            strokestyle: 'rgba(0,0,0,0)',
            ylabels:false,
            xaxispos:'center',
            noxaxis:true,
            noyaxis:true
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
        	colors : ['blue'],
            spline: true,
            shadow: true,
			tickmarks: 'endcircle',
			ymax : maxLineYValue,
			ymin : baseLineChartValue,
			noxaxis : true
		}
    }) ;
}

// ---------------- Server calls -----------------------------------------------
function callReportPlotDataAPI() {

	log.debug( "Calling ReportPlotDataAPI." ) ;
	log.debug( "TODO: Implementation pending" ) ;

	dataValues.length = 0 ;
	chartXLabels.length = 0 ;

	dataValues.splice( 0, 0, 4, 5, 3, 8, -4, 9, 6, -8, 3, 7 ) ;
	chartXLabels.push( "a" ) ;
	chartXLabels.push( "b" ) ;
	chartXLabels.push( "c" ) ;
	chartXLabels.push( "d" ) ;
	chartXLabels.push( "e" ) ;
	chartXLabels.push( "f" ) ;
	chartXLabels.push( "g" ) ;
	chartXLabels.push( "h" ) ;
	chartXLabels.push( "i" ) ;
	chartXLabels.push( "j" ) ;
	baseLineChartValue = 200 ;

    redrawChart() ;
}

function callReportSubjectsAPI() {

	log.debug( "Calling ReportSubjectAPI." ) ;
	log.debug( "TODO: Implementation pending" ) ;

    $scope.subjectNames.push( { id : "All",        name : "All Subjects" } ) ;
    $scope.subjectNames.push( { id : "Hindi",      name : "Hindi"        } ) ;
    $scope.subjectNames.push( { id : "Language",   name : "Language"     } ) ;
    $scope.subjectNames.push( { id : "Literature", name : "Literature"   } ) ;
}
// ---------------- End of controller ------------------------------------------
} ) ;