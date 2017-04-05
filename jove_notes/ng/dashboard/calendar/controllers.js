dashboardApp.controller( 'CalendarController', function( $scope, $http, $sce ) {

// ---------------- Constants and inner class definition -----------------------
function Event() {
    this.type = "" ;
    this.subject = "" ;
    this.title = "" ;
    this.startsAt = "" ;
    this.color = {
        primary: "",
        secondary: "#C1C0C0"
    } ;
    this.draggable = false ;
    this.resizable = false ;
    this.incrementsBadgeTotal = true ;
    this.allDay = true ;

    this.typeOld     = "" ;
    this.subjectOld  = "" ;
    this.titleOld    = "" ;
    this.startsAtOld = "" ;
    this.colorOld    = {
        primary: "",
    } ;

    this.createSnapshot = function() {
        this.typeOld          = this.type          ;
        this.subjectOld       = this.subject       ;
        this.titleOld         = this.title         ;
        this.startsAtOld      = this.startsAt      ;
        this.colorOld.primary = this.color.primary ;
    }

    this.isDirty = function() {
        if( this.typeOld          != this.type          ){ return true; }
        if( this.subjectOld       != this.subject       ){ return true; }
        if( this.titleOld         != this.title         ){ return true; }
        if( this.startsAtOld      != this.startsAt      ){ return true; }
        if( this.colorOld.primary != this.color.primary ){ return true; }
        return false ;
    }

    this.subjectChanged = function() {
        if( this.type == "Exam" ) {
            this.title = this.subject + " Exam" ;
        }
    }
}

// ---------------- Local variables --------------------------------------------
var e1 = new Event() ;
var e2 = new Event() ;

e1.type          = 'Exam' ;
e1.subject       = 'Literature' ;
e1.title         = 'English Literature' ;
e1.startsAt      = new Date(2017,3,6) ;
e1.color.primary = '#e3bc08' ;

e2.type          = 'General' ;
e2.subject       = 'Hindi' ;
e2.title         = 'Naya Rasta Test' ;
e2.startsAt      = new Date(2017,3,7) ;
e2.color.primary = '#E33D08' ;

e1.createSnapshot() ;
e2.createSnapshot() ;

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
    events       : [e1, e2],
    possibleSubjects : [
        'English',
        'Hindi',
        'Marathi',
        'Mathematics',
        'Hindi - Naya Rasta',
        'Literature'
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

$scope.saveEvent = function( event ) {
    event.createSnapshot() ;
    recomputeEditableEvents() ;
    // TODO: Save it to the server
}

$scope.deleteEvent = function( index ) {
    var event = $scope.calendar.events.splice( index, 1 ) ;
    recomputeEditableEvents() ;
    // TODO: Delete it from the server
}

$scope.newEvent = function() {
    var e           = new Event() ;
    e.type          = "General" ;
    e.title         = "<Event Title>" ;
    e.startsAt      = $scope.calendar.selectedDate ;
    e.color.primary = "#7981FA" ;

    $scope.calendar.events.push( e ) ;
    recomputeEditableEvents() ;
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
