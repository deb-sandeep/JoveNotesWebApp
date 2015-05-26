function HandlerProxy( handler ) {

	this.handler = handler ;

	this.initialize = function( $scope ) {
		if( this.handler.hasOwnProperty( 'initialize' ) ) {
			this.handler.initialize( $scope ) ;
		}
	}

	this.getQuestionUI = function() {
		return this.handler.getQuestionUI() ;
	}

	this.initializeQuestionUI = function() {
		if( this.handler.hasOwnProperty( 'initializeQuestionUI' ) ) {
			this.handler.initializeQuestionUI() ;
		}
	}

	this.freezeQuestionUI = function() {
		if( this.handler.hasOwnProperty( 'freezeQuestionUI' ) ) {
			this.handler.freezeQuestionUI() ;
		}
	}

	this.getAnswerUI = function() {
		return this.handler.getAnswerUI() ;
	}

	this.initializeAnswerUI = function() {
		if( this.handler.hasOwnProperty( 'initializeAnswerUI' ) ) {
			this.handler.initializeAnswerUI() ;
		}
	}
}

flashCardApp.directive( 'renderFlashCardQuestion', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			$scope.$watch( 'currentQuestion', function( newValue, oldValue ){

				if( $scope.currentQuestion != null ) {

					var handler = new HandlerProxy( $scope.currentQuestion.handler ) ;
					handler.initialize( $scope ) ;

					var questionUI = handler.getQuestionUI() ;

					element.empty() ;
					element.append( questionUI ) ;

					handler.initializeQuestionUI() ;
					MathJax.Hub.Queue( ["Typeset", MathJax.Hub, questionUI] ) ;
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
					var handler = new HandlerProxy( $scope.currentQuestion.handler ) ;

					handler.freezeQuestionUI() ;
					
					var answerUI = handler.getAnswerUI() ;
					
					element.empty() ;
					element.append( answerUI ) ;

					handler.initializeAnswerUI() ;
					MathJax.Hub.Queue( ["Typeset", MathJax.Hub, answerUI] ) ;
				}
			}) ; 
        }
	} ;
}) ;