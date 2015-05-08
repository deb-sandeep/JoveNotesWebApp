// =============================================================================

// =============================================================================
// function XXXHandler( chapterDetails, question ) {

// 	var textFormatter = new TextFormatter( chapterDetails ) ;

// 	this.question = question ;
// 	this.chapterDetails = chapterDetails ;
// 	this.scope = null ;

// 	this.initialize = function( $scope ){ this.scope = $scope ; }
// 	this.getAnswerLength = function() { return 0 ; } ;
// 	this.getQuestionUI = function() {} ;
// 	this.initializeQuestionUI = function() {} ;
// 	this.getAnswerUI = function() {} ;
// 	this.initializeAnswerUI = function() {} ;
// 	this.freezeQuestionUI = function() {} ;
// }

// =============================================================================
// Fill in the blanks formatter
// =============================================================================
function FIBHandler( chapterDetails, question ) {

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

	this.getQuestionUI = function() {
		return this.formattedQuestion ;
	} ;

	this.getAnswerUI = function() {
		return this.formattedAnswer ;
	} ;
}

// =============================================================================
// Word Meanings formatter
// =============================================================================
function QAHandler( chapterDetails, question ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	this.question = question ;
	this.chapterDetails = chapterDetails ;

	this.formattedQuestion = textFormatter.format( question.question ) ;
	this.formattedAnswer = textFormatter.format( question.answer ) ;
	this.answerLength = textFormatter.stripHTMLTags( this.formattedAnswer ).length ;

	this.getAnswerLength = function() {
		return this.answerLength ;
	} ;

	this.getQuestionUI = function() {
		return this.formattedQuestion ;
	} ;

	this.getAnswerUI = function() {
		return this.formattedAnswer ;
	} ;
}

// =============================================================================
// Test question formatter
// =============================================================================
function TQHandler( chapterDetails, question ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	this.question = question ;
	this.chapterDetails = chapterDetails ;
	this.scope = null ;

	this.answerLength = question.guessWord.length ;

	this.initialize = function( $scope ) {
		this.scope = $scope ;
	}

	this.getAnswerLength = function() {
		return this.answerLength ;
	} ;

	this.getQuestionUI = function() {

		var button = document.createElement( "button" ) ;
		button.innerHTML = "Guess the word" ;
		$this = this ;
		button.onclick = function() {
			log.debug( "Dynamic button clicked. Showing answer." ) ;
			$this.scope.showAnswer() ;
		} ;

		return button ;
	} ;

	this.getAnswerUI = function() {
		return this.question.guessWord ;
	} ;
}
