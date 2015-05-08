// =============================================================================
// 
// =============================================================================
// function XXXFormatter( chapterDetails, question ) {

// 	var textFormatter = new TextFormatter( chapterDetails ) ;

//	this.question = question ;
// 	this.chapterDetails = chapterDetails ;

// 	this.getAnswerLength = function() {

// 	} ;

// 	this.getFormattedQuestion = function() {

// 	} ;

// 	this.getFormattedAnswer = function() {

// 	} ;
// }

// =============================================================================
// Fill in the blanks formatter
// =============================================================================
function FIBFormatter( chapterDetails, question ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	this.answerLength = -1 ;
	this.formattedQuestion = null ;
	this.formattedAnswer = null ;

	{ // -----------------------------------------------------------------------
	this.formattedQuestion = textFormatter.format( question.question ) ;
	this.formattedAnswer   = "&ctdot;&nbsp;" + 
	                         textFormatter.format( question.question ) ;
	this.answerLength      = 0 ;

	var numBlanks = question.answers.length ;

	for( var i=0; i<numBlanks; i++ ) {

		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + question.answers[i] + "</code>" ;

		this.formattedAnswer   = this.formattedAnswer.replace( strToReplace, replacedText ) ;
		this.formattedQuestion = this.formattedQuestion.replace( strToReplace, " ______ " ) ;
		this.answerLength     += question.answers[i].length ;
	}
	} // -----------------------------------------------------------------------

	this.getAnswerLength = function() {
		return this.answerLength ;
	} ;

	this.getFormattedQuestion = function() {
		return this.formattedQuestion ;
	} ;

	this.getFormattedAnswer = function() {
		return this.formattedAnswer ;
	} ;
}

// =============================================================================
// Word Meanings formatter
// =============================================================================
function QAFormatter( chapterDetails, question ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	this.question = question ;
	this.chapterDetails = chapterDetails ;

	this.formattedQuestion = textFormatter.format( question.question ) ;
	this.formattedAnswer = textFormatter.format( question.answer ) ;
	this.answerLength = textFormatter.stripHTMLTags( this.formattedAnswer ).length ;

	this.getAnswerLength = function() {
		return this.answerLength ;
	} ;

	this.getFormattedQuestion = function() {
		return this.formattedQuestion ;
	} ;

	this.getFormattedAnswer = function() {
		return this.formattedAnswer ;
	} ;
}
