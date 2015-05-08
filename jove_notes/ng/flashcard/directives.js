flashCardApp.directive( 'renderFlashCardQuestion', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			$scope.$watch( 'currentQuestion', function( newValue, oldValue ){
				if( $scope.currentQuestion != null ) {

					element.empty() ;
					element.append( $scope.currentQuestion.formatter.getFormattedQuestion() ) ;
				}
			}) ; 
        }
	} ;
}) ;

flashCardApp.directive( 'renderFlashCardAnswer', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {
			
			$scope.$watch( 'answerChangeTrigger', function( newValue, oldValue ){
				if( newValue == "" ) {
					element.html( "" ) ;
				}
				else {
					element.empty() ;
					element.append( $scope.currentQuestion.formatter.getFormattedAnswer() ) ;
				}
			}) ; 
        }
	} ;
}) ;