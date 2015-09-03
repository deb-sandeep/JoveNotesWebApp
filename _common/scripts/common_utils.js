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

