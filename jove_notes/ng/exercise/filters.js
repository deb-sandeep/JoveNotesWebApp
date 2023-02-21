testPaperApp.filter( 'duration', function(){

	return function( millis ) {

	    const numSecs = Math.floor( millis / 1000 ) ;
	    const hours   = Math.floor( numSecs / 3600 ) ;
	    const minutes = Math.floor( ( numSecs - (hours * 3600) ) / 60 ) ;
	    const seconds = numSecs - ( hours * 3600 ) - ( minutes * 60 ) ;

	    if( hours   < 10 ){ hours   = "0" + hours   ; }
	    if( minutes < 10 ){ minutes = "0" + minutes ; }
	    if( seconds < 10 ){ seconds = "0" + seconds ; }

	    return hours + ':' + minutes + ':' + seconds ;
	} ;
}) ;
