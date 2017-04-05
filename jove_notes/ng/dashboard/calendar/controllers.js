dashboardApp.controller( 'CalendarController', function( $scope, $http, $sce ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Event Calendar" ;
$scope.$parent.currentReport = "Calendar" ;

$scope.calendar = {
    calendarView : 'month',
    cellIsOpen   : true,
    viewDate     : new Date(),
    calendarTitle: "",
    editEvents   : false,
    selectedDate : new Date(),
    editAllEvents: false,
    events       : [
                      {
                        type: 'Exam',
                        subject: 'Literature',
                        title: 'English Literature',
                        startsAt: new Date(2017,3,6), // A javascript date object for when the event starts
                        color: {
                          primary: '#e3bc08', // the primary event color (should be darker than secondary)
                          secondary: '#C1C0C0' // the secondary event color (should be lighter than primary)
                        },
                        draggable: false,
                        resizable: false,
                        incrementsBadgeTotal: true,
                        allDay: true
                      },
                      {
                        type: 'General',
                        subject: 'Hindi',
                        title: 'Hindi',
                        startsAt: new Date(2017,3,7),
                        color: {
                          primary: '#E33D08',
                          secondary: '#C1C0C0'
                        },
                        draggable: false,
                        resizable: false,
                        incrementsBadgeTotal: true,
                        allDay: true
                      }
                    ],
    eventsForEditing : []
}

// ---------------- Main logic for the controller ------------------------------
recomputeEditableEvents() ;

// ---------------- Controller methods (Watch) ---------------------------------
$scope.$watch( 'calendar.editAllEvents', function( newValue, oldValue ){
    recomputeEditableEvents() ;
}) ;

// ---------------- Controller methods -----------------------------------------
$scope.eventClicked = function( calendarEvent ) {
    log.debug( "Event clicked." ) ;
}

$scope.renderCell = function( cell ) {
    if( cell.date.isSame( moment( $scope.calendar.selectedDate ), "day" ) ) {
        cell.cssClass = "sel_date" ;
    }
}

$scope.timespanClicked = function(date, cell) {
    $scope.calendar.selectedDate = date ;
    recomputeEditableEvents() ;
}

$scope.addNewEvent = function() {

}

$scope.toggleCalendar = function( $event, field, event ) {
    $event.preventDefault();
    $event.stopPropagation();
    event[field] = !event[field];
}

$scope.getSecondaryColorBgStyle = function( event ) {
    return {
        'background-color':event.color.secondary 
    } ;
}

$scope.getColorPickerStyle = function( event ) {
    return {
        'background-color':event.color.primary,
        'color':event.color.primary 
    } ;
}

// ---------------- Private calls -----------------------------------------------
function recomputeEditableEvents() {
    var editableEvents = [] ;
    for( var i=0; i<$scope.calendar.events.length; i++ ) {
        var event = $scope.calendar.events[i] ;
        if( $scope.calendar.editAllEvents ) {
            editableEvents.push( event ) ;
        }
        else if( moment( event.startsAt ).isSame( moment( $scope.calendar.selectedDate ), "day" ) ) {
            editableEvents.push( event ) ;
        }
    }
    $scope.calendar.eventsForEditing = editableEvents ;
}

// ---------------- Server calls -----------------------------------------------


// ---------------- End of controller ------------------------------------------
} ) ;
