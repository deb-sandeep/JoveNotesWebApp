editUtilsApp.directive( 'renderLatex', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			$scope.$watch( 'latex.expression', function( newValue, oldValue ){
				refresh() ;
			}) ; 

			$scope.$watch( 'latex.expressionType', function( newValue, oldValue ){
				refresh() ;
			}) ; 

			function refresh() {
				var dom = null ;
				if( $scope.latex.expressionType == "Latex" ) {
					dom = SPAN( "$$" + $scope.latex.expression + "$$" ) ;
				}
				else {
					dom = SPAN( "$$\\ce{" + $scope.latex.expression + "}$$" ) ;
				}

				element.empty() ;
				element.append( dom ) ;

				MathJax.Hub.Queue( ["Typeset", MathJax.Hub, dom ] ) ;
			}
        }
	} ;
}) ;
