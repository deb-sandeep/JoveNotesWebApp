// -----------------------------------------------------------------------------
// Prototype for API classes
// -----------------------------------------------------------------------------
Array.prototype.shufflePart = function( fromIndex, toIndex ) {

    var input = this;
    for (var i = toIndex; i >=fromIndex; i--) {

        var randomIndex = fromIndex + Math.floor( Math.random()*( i - fromIndex + 1 ) ) ;
        var itemAtIndex = input[ randomIndex ] ;

        input[ randomIndex ] = input[ i ] ;
        input[ i ] = itemAtIndex ;
    }
    return input;
} ;

Array.prototype.shuffle = function() {
    this.shufflePart( 0, this.length-1 ) ;
} ;

Array.prototype.shuffleFrom = function( fromIndex ) {
    if( fromIndex < this.length-1 ) {
        this.shufflePart( fromIndex, this.length-1 ) ;
    }
} ;

String.prototype.replaceAll = function( substringToBeReplaced, replacementString ) {

    // Escape all the regular expression characters before we find
    var find = substringToBeReplaced.replace( /([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1" ) ;
    var re   = new RegExp( find, 'g' ) ;
    var ret  = this.replace( re, replacementString ) ;
    
    return ret ;
} ;

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------
function callIfServerAlive( successCallback, errorCallback, previousCallAttemptNumber ) {

    if( typeof( previousCallAttemptNumber )==='undefined' ) 
        previousCallAttemptNumber = 0 ;

    var currentCallAttemptNumber = previousCallAttemptNumber + 1 ;

    $.get( '/__fw__/api/Ping', function( data ){
        if( typeof data === 'string' ) {
            if( data.trim() == 'Pong' ) {
                successCallback() ;
            }
            else if( errorCallback != null ) {
                errorCallback() ;
            }
        }
    })
    .fail( function( data, status ){
        log.debug( "Faulty connection determined." ) ;
        if( currentCallAttemptNumber < 3 ) {
            log.debug( "Retrying the call again." ) ;
            callIfServerAlive( successCallback, errorCallback, 
                               currentCallAttemptNumber ) ; 
            return ;
        }

        if( errorCallback != null ) {
            errorCallback() ;
        }
    }) ;
}
