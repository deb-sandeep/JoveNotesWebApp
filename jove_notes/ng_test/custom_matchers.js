function TestingUtils() {
	
	this.getQuestionIndex = function( questionArray, questionId ) {
		for( var i=0; i<questionArray.length; i++ ) {
			if( questionArray[i].questionId == questionId ) {
				return i ;
			}
		}
		return -1 ;
	}

	this.isQuestionPresent = function( questionArray, questionId ) {
		return this.getQuestionIndex( questionArray, questionId ) >= 0 ;
	}
}

var customMatchers = {
// -----------------------------------------------------------------------------

toHaveQuestion: function( util, customEqualityTesters ) {

	return {
		compare : function( questionArray, questionIds ) {
	
			log.debug( "Trying to find question " + questionIds ) ;
			var result = { pass : false, message : '' } ;
			var testUtil = new TestingUtils() ;

			if( Array.isArray( questionIds ) ) {
				
				var missingQuestions = [] ;

				for( var i=0; i<questionIds.length; i++ ) {
					log.debug( "\tChecking for question " + questionIds[i] ) ;
					if( !testUtil.isQuestionPresent( questionArray, questionIds[i] ) ) {
						missingQuestions.push( questionIds[i] ) ;
					}
				}

				if( missingQuestions.length == 0 ) {
					result.pass = true ;
					result.message = "Question " + questionIds + " are present" ;
				}
				else {
					result.pass = false ;
					result.message = "Question " + missingQuestions + " are absent" ;
				}
			}
			else {
				if( testUtil.isQuestionPresent( questionArray, questionIds ) ) {
					result.pass = true ;
					result.message = "Question " + questionIds + " is present" ;
				}
				else {
					result.message = "Question " + questionIds + " not present" ;
				}
			}

			log.debug( "\t" + " - " + result.message ) ;
			return result ;
		},
		negativeCompare : function( questionArray, questionIds ) {

			log.debug( "Trying to find absent question " + questionIds ) ;
			var result = { pass : false, message : '' } ;
			var testUtil = new TestingUtils() ;

			if( Array.isArray( questionIds ) ) {
				
				var presentQuestions = [] ;

				for( var i=0; i<questionIds.length; i++ ) {
					log.debug( "\tChecking for question " + questionIds[i] ) ;
					if( testUtil.isQuestionPresent( questionArray, questionIds[i] ) ) {
						presentQuestions.push( questionIds[i] ) ;
					}
				}

				if( presentQuestions.length == 0 ) {
					result.pass = true ;
					result.message = "Question " + questionIds + " are absent" ;
				}
				else {
					result.pass = false ;
					result.message = "Question " + presentQuestions + " are present" ;
				}
			}
			else {
				if( !testUtil.isQuestionPresent( questionArray, questionIds ) ) {
					result.pass = true ;
					result.message = "Question " + questionIds + " is absent" ;
				}
				else {
					result.message = "Question " + questionIds + " is present" ;
				}
			}

			log.debug( "\t" + " - " + result.message ) ;
			return result ;
		}
	} ;
},

toHaveQuestionsInOrder: function() {

	return {

	compare : function( questionArray, questionIds ) {

		var result = { pass : false, message : '' } ;
		var testUtil = new TestingUtils() ;

		var lastQuestionIndex = -1 ;

		for( var i=0; i<questionIds.length; i++ ) {
			var index = testUtil.getQuestionIndex( questionArray, questionIds[i] ) ;
			if( index < 0 ) {
				result.message = "Question " + questionIds[i] + " is absent." ;
				return result ;
			}
			else if( index < lastQuestionIndex ) {
				result.message = "Question " + questionIds[i] + 
				                 " is not in order. Previous index = " + 
				                 lastQuestionIndex ;
				return result ;
			}
			lastQuestionIndex = index ;			
		}

		result.pass = true ;
		result.message = "All questions are in order." ;
		log.debug( "\t" + result.message ) ;
		return result ;
	}

	} ;
}

// -----------------------------------------------------------------------------
} ;