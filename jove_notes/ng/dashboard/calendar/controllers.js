dashboardApp.controller( 'CalendarController', function( $scope, $http, $sce ) {

// ---------------- Constants and inner class definition -----------------------
function Event() {
    this.id = -1 ;
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


// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Event Calendar" ;
$scope.$parent.currentReport = "Calendar" ;

$scope.calendar = {
    calendarView     : 'month',
    cellIsOpen       : true,
    viewDate         : new Date(),
    calendarTitle    : "",
    editEvents       : false,
    selectedDate     : new Date(),
    editAllEvents    : false,
    events           : [],
    possibleSubjects : [],
    eventsForEditing : []
}

// ---------------- Main logic for the controller ------------------------------
refreshData() ;

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
    saveEvent( event ) ;
}

$scope.deleteEvent = function( index ) {
    var event = $scope.calendar.eventsForEditing.splice( index, 1 ) ;
    for (var i = $scope.calendar.events.length - 1; i >= 0; i--) {
        if( $scope.calendar.events[i].id == event[0].id ) {
            $scope.calendar.events.splice( i, 1 ) ;
            break ;
        }
    }
    deleteEvent( event[0].id ) ;
    recomputeEditableEvents() ;
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

function processBaseCalendarData( data ) {
    $scope.calendar.possibleSubjects = data.possibleSubjects ;
    $scope.calendar.events.length = 0 ;

    for (var i = 0; i < data.events.length; i++) {
        var e = data.events[i] ;
        var event = new Event() ;
        event.id            = e.id ;
        event.type          = e.type ;
        event.subject       = e.subject ;
        event.title         = e.title ;
        event.startsAt      = new Date( e.date * 1000 ) ;
        event.color.primary = e.color ;

        event.createSnapshot() ;
        $scope.calendar.events.push( event ) ;
    }

    recomputeEditableEvents() ;
}

// ---------------- Server calls -----------------------------------------------
function refreshData() {

    $http.get( "/jove_notes/api/Calendar" )
         .success( function( data ){
            processBaseCalendarData( data ) ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function saveEvent( event ) {
    $http.post( "/jove_notes/api/Calendar", {
            'id'       : event.id,
            'type'     : event.type,
            'subject'  : event.subject,
            'title'    : event.title,
            'startsAt' : event.startsAt.getTime()/1000,
            'color'    : event.color.primary
         })
         .success( function( data ){
            event.id = data[0] ;
         })
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function deleteEvent( eventId ) {
    $http.delete( "/jove_notes/api/Calendar/" + eventId )
         .error( function( data ){
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}



// ---------------- End of controller ------------------------------------------
} ) ;
