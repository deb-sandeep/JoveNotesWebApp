function QuestionTypes(){}

QuestionTypes.prototype.QT_FIB = "fib" ;
QuestionTypes.prototype.QT_WM  = "word_meaning" ;
QuestionTypes.prototype.QT_QA  = "question_answer" ;

function StudyStrategyTypes(){}

StudyStrategyTypes.prototype.SSR        = "SSR" ;
StudyStrategyTypes.prototype.EFF_HARD   = "EFF_HARD" ;
StudyStrategyTypes.prototype.EFF_EASY   = "EFF_EASY" ;
StudyStrategyTypes.prototype.OBJECTIVE  = "OBJECTIVE" ;
StudyStrategyTypes.prototype.SUBJECTIVE = "SUBJECTIVE" ;


// =============================================================================
// =============================================================================

function QuestionFormatter() {
// -----------------------------------------------------------------------------

this.createAndInjectFormattedText = function( questions ) {

	for( i=0; i<questions.length; i++ ) {

		var question = questions[i] ;
		var type = question.questionType ;

		if( type == QuestionTypes.prototype.QT_FIB ) {
			formatFIB( question ) ;
		}
		else if( type == QuestionTypes.prototype.QT_WM ) {
			formatWM( question ) ;
		}
		else if( type == QuestionTypes.prototype.QT_QA ) {
			formatQA( question ) ;
		}
	}
}

// -----------------------------------------------------------------------------

function formatFIB( question ) {

	var formattedQuestion = question.question ;
	var formattedAnswer   = "&ctdot;&nbsp;" + question.question ;
	var numBlanks         = question.answers.length ;

	var i=0 ;
	for( ; i<numBlanks; i++ ) {
		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + question.answers[i] + "</code>" ;

		formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
		formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
	}
	
	question.formattedAnswer   = formattedAnswer ;
	question.formattedQuestion = formattedQuestion ;
}

function formatWM( question ) {

	question.formattedQuestion = "What is the meaning of : <p><code>" + question.word + "</code>" ;
	question.formattedAnswer   = question.meaning ;
}

function formatQA( question ) {

	question.formattedQuestion = question.question ;
	question.formattedAnswer   = question.answer ;
}

// -----------------------------------------------------------------------------
}
