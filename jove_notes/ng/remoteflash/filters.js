// -----------------------------------------------------------------------------
// Filter - 'duration'
// Converts the given input into hh:mm:ss formatted string
//
// Parameter -
// 		- time in milliseconds 
// -----------------------------------------------------------------------------
remoteFlashCardApp.filter( 'duration', function(){

	return function( millis ) {

	    var numSecs = Math.floor( millis / 1000 ) ;
	    var hours   = Math.floor( numSecs / 3600 ) ;
	    var minutes = Math.floor( ( numSecs - (hours * 3600) ) / 60 ) ;
	    var seconds = numSecs - ( hours * 3600 ) - ( minutes * 60 ) ;

	    if( hours   < 10 ){ hours   = "0" + hours   ; }
	    if( minutes < 10 ){ minutes = "0" + minutes ; }
	    if( seconds < 10 ){ seconds = "0" + seconds ; }

	    return hours + ':' + minutes + ':' + seconds ;
	} ;
}) ;

// -----------------------------------------------------------------------------
// Filter - 'elapsedDuration'
// Converts the given input into 'x [days|mins|secs] ago' formatted string
//
// Parameter -
// 		- time in milliseconds 
// -----------------------------------------------------------------------------
remoteFlashCardApp.filter( 'elapsedDuration', function(){

	return function( milestoneTime ) {

		if( milestoneTime < 0 ) return "New card" ;

		var str = "" ;
		var numSecs = 0 ;
		var millis = new Date().getTime() - milestoneTime ;

	    numSecs = Math.floor( millis / 1000 ) ;
	    var days = Math.floor( numSecs / ( 3600 * 24 ) ) ;

	    numSecs = numSecs - ( days * 3600 * 24 ) ;
	    var hours = Math.floor( numSecs / 3600 ) ;

	    numSecs = numSecs - ( hours * 3600 ) ; 
	    var minutes = Math.floor( numSecs / 60 ) ;

	    var seconds = numSecs - ( minutes * 60 ) ;

	    if( days > 0 ) {
	    	str = days + " days ago" ;
	    }
	    else {
	    	if( hours > 0 ) {
	    		str = hours + " hrs ago" ;
	    	}
	    	else {
	    		if( minutes > 0 ) {
	    			str = minutes + " min ago" ;
	    		}
	    		else {
	    			str = seconds + " sec ago" ;
	    		}
	    	}
	    }
	    
		return str ;
	} ;
}) ;
