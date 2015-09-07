dashboardApp.directive( 'onRenderComplete', function() {
    
    return function( scope, element, attrs ) {
    	if( scope.$last ) {
	    	setTimeout( function(){ 
	            scope.$emit( 'onRenderComplete' ) ;
	        }, 1 ) ;
    	}
    } ;
} ) ;

