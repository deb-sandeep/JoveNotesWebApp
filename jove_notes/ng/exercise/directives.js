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

testPaperApp.directive( 'renderExerciseQuestion', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {

			// NOTE: The initialize of the handler has been called during the
			// construction of the handler in the controller. No need to call
			// it again.
			var handler    = new HandlerProxy( $scope.currentQuestion.handler ) ;
			var questionUI = handler.getQuestionUI() ;

			element.empty() ;
			element.append( questionUI ) ;

			handler.initializeQuestionUI() ;
			MathJax.Hub.Queue( ["Typeset", MathJax.Hub, element.get(0)] ) ;

			element.find( 'pre code' ).each( function(i, block) {
				hljs.highlightBlock( block ) ;
			});
        }
	} ;
}) ;

testPaperApp.directive( 'renderExerciseAnswer', function() {

	return {
		restrict : 'E',
		link : function( $scope, element, attributes ) {
			
			var handler = new HandlerProxy( $scope.currentQuestion.handler ) ;

			handler.freezeQuestionUI() ;
			
			var answerUI = handler.getAnswerUI() ;
			
			element.empty() ;
			element.append( answerUI ) ;

			handler.initializeAnswerUI() ;
			MathJax.Hub.Queue( ["Typeset", MathJax.Hub, element.get(0)] ) ;

			element.find( 'pre code' ).each( function(i, block) {
				hljs.highlightBlock( block ) ;
			});
        }
	} ;
}) ;

testPaperApp.directive( 'onRenderComplete', function() {
    
    return function( scope, element, attrs ) {
    	if( scope.$last ) {
	    	setTimeout( function(){ 
	            scope.$emit( 'onRenderComplete' ) ;
	        }, 1 ) ;
    	}
    } ;
} ) ;