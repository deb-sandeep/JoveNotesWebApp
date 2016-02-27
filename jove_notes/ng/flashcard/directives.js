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

			$scope.$watch( 'questionChangeTrigger', function( newValue, oldValue ){

				if( $scope.currentQuestion != null ) {

					// NOTE: The initialize of the handler has been called for
					// this display in the flashcard showNextCard method. No need
					// of calling it here.
					var handler    = new HandlerProxy( $scope.currentQuestion.handler ) ;
					var questionUI = handler.getQuestionUI() ;

					element.empty() ;
					$scope.resetFontForQDiv() ;

					element.append( questionUI ) ;

					handler.initializeQuestionUI() ;
					MathJax.Hub.Queue( ["Typeset", MathJax.Hub, element.get(0)] ) ;

					element.find( 'pre code' ).each( function(i, block) {
						hljs.highlightBlock( block ) ;
					});
					$scope.applyZoomDeltaToQFont() ;
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
					$scope.resetFontForADiv() ;

					element.append( answerUI ) ;

					handler.initializeAnswerUI() ;
					MathJax.Hub.Queue( ["Typeset", MathJax.Hub, element.get(0)] ) ;

					element.find( 'pre code' ).each( function(i, block) {
						hljs.highlightBlock( block ) ;
					});
					$scope.applyZoomDeltaToAFont() ;
				}
			}) ; 
        }
	} ;
}) ;