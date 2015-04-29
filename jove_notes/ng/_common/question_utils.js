function QuestionTypes(){}

QuestionTypes.prototype.QT_WM  = "word_meaning" ;
QuestionTypes.prototype.QT_QA  = "question_answer" ;
QuestionTypes.prototype.QT_FIB = "fib" ;


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
	}
}

// -----------------------------------------------------------------------------

function formatFIB( question ) {

	var formattedAnswer = "&ctdot;&nbsp;" + question.question ;
	var numBlanks = question.answers.length ;

	var i=0 ;
	for( ; i<numBlanks; i++ ) {
		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + question.answers[i] + "</code>" ;

		formattedAnswer = formattedAnswer.replace( strToReplace, replacedText ) ;
	}
	question.formattedAnswer = formattedAnswer ;
}

// -----------------------------------------------------------------------------
}
