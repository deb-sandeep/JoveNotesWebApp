dashboardApp.controller( 'ReportsController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------
var LEFT_GUTTER = 75 ;
var RIGHT_GUTTER = 75 ;

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle = "Report Page" ;

// preferences.entityType can take on the following values [Score, Time, NumQuestions]
$scope.preferences = {
	dateRange : {
		startDate : moment().subtract(29, 'days').toDate(),
		endDate : moment().endOf('day').toDate()
	}
} ;

$scope.redemptionInput = {
    item : null,
    numItems : 1,
    totalPoints : 0,
    validEntry : true,
    message : null
} ;

$scope.totalPoints = 0 ;
$scope.catalog = [] ;
$scope.pointsLedger = {} ;
$scope.showRedeemDialog = false ;
$scope.redemptionItem = null ;

// ---------------- Main logic for the controller ------------------------------

initializeDateRange() ;

$scope.$watch( 'preferences', function( oldValue, newValue ){
	// NOTE: We don't call report plot data API directly. The watch fires it
	// for us on the load of the controller.
    loadCatalog() ;
    loadScoreLedger() ;
}, true ) ;

// ---------------- Controller methods -----------------------------------------

$scope.toggleRedeemDialog = function() {
    $scope.showRedeemDialog = !$scope.showRedeemDialog ;
}

$scope.processRedeemItemSelection = function() {
    var entry = $scope.redemptionInput.item ;
    var ri = $scope.redemptionInput ;
    var maxItemsRedeemable = entry.numRedemptionsPerDay - entry.totalRedeemedQtyToday ;

    ri.numItems = ri.numItems > maxItemsRedeemable ? maxItemsRedeemable : ri.numItems ;
    ri.totalPoints = entry.pointsPerItem * ri.numItems ;

    ri.validEntry = ri.totalPoints <= $scope.totalPoints ;
    if( !ri.validEntry ) {
        ri.message = "Not enough points." ;
    }
    else {
        ri.message = "" ;
    }
}

$scope.applyRedemption = function() {
    console.log( "Apply redemption." ) ;
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

// ---------------- Server calls -----------------------------------------------
function loadCatalog() {

	var startMoment = moment( $scope.preferences.dateRange.startDate ) ;
	var endMoment   = moment( $scope.preferences.dateRange.endDate   ) ;

    $http.get( '/jove_notes/api/Points/RedemptionCatalog' )
    .success( function( data ){
        console.log( "Redemption catalog received." ) ;
        console.log( data ) ;
        $scope.totalPoints = data.points ;
        populateRedemptionCatalogWithValidEntries( data ) ;
        $scope.redemptionInput.item = $scope.catalog[0] ;
        $scope.redemptionInput.totalPoints = $scope.catalog[0].pointsPerItem ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

function populateRedemptionCatalogWithValidEntries( data ) {

    var serverEntries = data.catalog ;
    var totalPoints = data.points ;

    $scope.catalog = [] ;
    for( var i=0; i<serverEntries.length; i++ ) {
        var entry = serverEntries[i] ;
        if( totalPoints >= entry.pointsPerItem ) {
            if( entry.totalRedeemedQtyToday < entry.numRedemptionsPerDay ) {
                $scope.catalog.push( entry ) ;
            }
        }
    }
}

function loadScoreLedger() {

    var startMoment = moment( $scope.preferences.dateRange.startDate ) ;
    var endMoment   = moment( $scope.preferences.dateRange.endDate   ) ;

    $http.get( '/jove_notes/api/Points/RedemptionLedger' , {
        params : {
            'startDate'     : startMoment.format( "YYYY-MM-DD HH:mm:ss" ), 
            'endDate'       : endMoment.format( "YYYY-MM-DD HH:mm:ss" )
        }
    })
    .success( function( data ){
        console.log( "Redemption ledger received." ) ;
        console.log( data ) ;
        $scope.pointsLedger = data.entries ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}


// ---------------- End of controller ------------------------------------------
} ) ;