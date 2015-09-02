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

remoteFlashCardApp.directive( 'renderRemoteFlashCardQuestion', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			$scope.$watch( 'showQuestionTrigger', function( newValue, oldValue ){

				if( $scope.currentQuestion != null ) {

					// NOTE: The initialize of the handler has been called for
					// this display in the remote flash controller. No need
					// of calling it here.
					var handler    = new HandlerProxy( $scope.currentQuestion.handler ) ;
					var questionUI = handler.getQuestionUI() ;

					element.empty() ;
					element.append( questionUI ) ;

					handler.initializeQuestionUI() ;
					MathJax.Hub.Queue( ["Typeset", MathJax.Hub, questionUI] ) ;
					element.find( 'pre code' ).each( function(i, block) {
						hljs.highlightBlock( block ) ;
					});
				}
			}) ; 
        }
	} ;
}) ;

remoteFlashCardApp.directive( 'renderRemoteFlashCardAnswer', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {
			
			$scope.$watch( 'showAnswerTrigger', function( newValue, oldValue ){

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
					element.find( 'pre code' ).each( function(i, block) {
						hljs.highlightBlock( block ) ;
					});
				}
			}) ; 
        }
	} ;
}) ;