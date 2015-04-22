dashboardApp.directive( 'onRowRender', function() {
    
    return function( scope, element, attrs ) {
    	setTimeout( function(){ 
            scope.$emit( 'onRowRender', scope.$index ) ;
        }, 1 ) ;
    } ;

} ) ;

dashboardApp.directive( 'onRenderComplete', function() {
    
    return function( scope, element, attrs ) {
    	if( scope.$last ) {
	    	setTimeout( function(){ 
	            scope.$emit( 'onRenderComplete' ) ;
	        }, 1 ) ;
    	}
    } ;

} ) ;