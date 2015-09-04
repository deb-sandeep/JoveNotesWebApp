// ScriptUtilities is a stateless class providing a set of utility methods 
// for use by script support in notes source files.
//
// An instance of this class is passed to the initialize method of the script
// instances via the $util parameter.
function ScriptUtilities() {

    this.randomInt = function( min, max ) {
        return Math.floor( Math.random() * ( max - min + 1 ) ) + min ;
    }

}