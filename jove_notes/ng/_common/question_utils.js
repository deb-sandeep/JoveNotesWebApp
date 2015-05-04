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

function CardLevels(){}
CardLevels.prototype.NS  = "NS" ;
CardLevels.prototype.L0  = "L0" ;
CardLevels.prototype.L1  = "L1" ;
CardLevels.prototype.L2  = "L2" ;
CardLevels.prototype.L3  = "L3" ;
CardLevels.prototype.MAS = "MAS" ;


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
	var answerLength      = 0 ;

	var i=0 ;
	for( ; i<numBlanks; i++ ) {
		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + question.answers[i] + "</code>" ;

		formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
		formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
		answerLength     += question.answers[i].length ;
	}
	
	question.formattedQuestion = formattedQuestion ;
	question.formattedAnswer   = formattedAnswer ;
	question.answerLength      = answerLength ;
}

function formatWM( question ) {

	question.formattedQuestion = "What is the meaning of : <p><code>" + question.word + "</code>" ;
	question.formattedAnswer   = question.meaning ;
	question.answerLength      = question.meaning.length ;
}

function formatQA( question ) {

	question.formattedQuestion = question.question ;
	question.formattedAnswer   = question.answer ;
	question.answerLength      = $(question.answer).text().length ;
}

// -----------------------------------------------------------------------------
}
