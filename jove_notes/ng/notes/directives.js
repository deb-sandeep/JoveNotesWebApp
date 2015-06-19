notesApp.directive( 'renderImageLabel', function( $sce ) {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			var textFormatter = new TextFormatter( $scope.$parent.$parent.$parent.chapterDetails, $sce ) ;
			var handler = new ImageLabelManager( $scope.element, textFormatter, $scope )

			handler.initialize() ;
			var answerUI = handler.getAnswerUI() ;
			element.empty() ;
			element.append( answerUI ) ;
			MathJax.Hub.Queue( ["Typeset", MathJax.Hub, answerUI] ) ;
        }
	} ;
}) ;