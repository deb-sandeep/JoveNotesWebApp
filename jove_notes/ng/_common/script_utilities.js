// ScriptUtilities is a stateless class providing a set of utility methods 
// for use by script support in notes source files.
//
// An instance of this class is passed to the initialize method of the script
// instances via the $util parameter.
function ScriptUtilities() {

    this.randomInt = function( min, max ) {
        return Math.floor( Math.random() * ( max - min + 1 ) ) + min ;
    }

    this.getRandomInts = function( numValues, min, max ) {

    	var values = [] ;
    	if( (max-min) > numValues ) {
	    	while( values.length < numValues ) {
	    		var random = this.randomInt( min, max ) ;
	    		if( values.indexOf( random ) == -1 ) {
	    			values.push( random ) ;
	    		}
	    	}
    	}
    	return values ;
    }

	this.prime = function( n ) {
	    if( n > 10000 ){
	        throw new Error( "Can't compute prime above 10000" ) ;
	    }

	    var primes = new Array( n + 1 ) ;
	    primes[1] = 2 ;

	    Find: 
	    for( var i = 2, test = 3; i <= n; test += 1 ) {
	        for( var j = 1; j < i; j += 1 ) {
	            if( test % primes[j] === 0 ) {
	                continue Find ;
	            }
	        }
	        primes[i] = test ;
	        i += 1 ;
	    }
	    return primes[ n ] ;
	};

}