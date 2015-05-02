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
function toHHMMSS( millis ) {

    var numSecs = Math.floor( millis / 1000 ) ;
    var hours   = Math.floor( numSecs / 3600 ) ;
    var minutes = Math.floor( ( numSecs - (hours * 3600) ) / 60 ) ;
    var seconds = numSecs - ( hours * 3600 ) - ( minutes * 60 ) ;

    if( hours   < 10 ){ hours   = "0" + hours   ; }
    if( minutes < 10 ){ minutes = "0" + minutes ; }
    if( seconds < 10 ){ seconds = "0" + seconds ; }

    return hours + ':' + minutes + ':' + seconds ;
}

