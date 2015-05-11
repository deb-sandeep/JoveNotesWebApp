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

	var answerLength = -1 ;
	var formattedQuestion = null ;
	var formattedAnswer = null ;

	{ 
		formattedQuestion = textFormatter.format( question.question ) ;
		formattedAnswer   = "&ctdot;&nbsp;" + 
		                         textFormatter.format( question.question ) ;
		answerLength = 0 ;

		var numBlanks = question.answers.length ;

		for( var i=0; i<numBlanks; i++ ) {

			var strToReplace = "{" + i + "}" ;
			var replacedText = "<code>" + question.answers[i] + "</code>" ;

			formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
			formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
			answerLength     += question.answers[i].length ;
		}
	}

	this.getAnswerLength = function() { return answerLength ; } ;
	this.getQuestionUI = function() { return formattedQuestion ; } ;
	this.getAnswerUI = function() { return formattedAnswer ; } ;
}

// =============================================================================
// Word Meanings formatter
// =============================================================================
function QAHandler( chapterDetails, question ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	var formattedQuestion = textFormatter.format( question.question ) ;
	var formattedAnswer = textFormatter.format( question.answer ) ;
	var answerLength = textFormatter.stripHTMLTags( formattedAnswer ).length ;

	this.getAnswerLength = function() { return answerLength ; } ;
	this.getQuestionUI = function() { return formattedQuestion ; } ;
	this.getAnswerUI = function() { return formattedAnswer ; } ;
}

// =============================================================================
// True False handler
// =============================================================================
function TFHandler( chapterDetails, questionObj ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;
	var jnUtils = new JoveNotesUtil() ;

	var question = questionObj ;
	var chapterDetails = chapterDetails ;

	var scope = null ;
	var answeredCorrectly = null ;
	var answerLength = question.justification.length ;
	var trueBtn  = BUTTON( { 'class' : 'btn btn-success btn-sm' }, "True" ) ;
	var falseBtn = BUTTON( { 'class' : 'btn btn-warning btn-sm' }, "False" ) ;
	var truthValueIcon = ( question.truthValue ) ? "ok" : "remove" ;
	
	{
		if( answerLength == 0 ) { this.answerLength = 5 } ;

		trueBtn.onclick = function() {
			handleUserRating( true ) ;
		} ;

		falseBtn.onclick = function() {
			handleUserRating( false ) ;
		} ;
	}

	this.initialize = function( $scope ) {
		scope = $scope ;

		answeredCorrectly = null ;
		trueBtn.disabled = false ;
		falseBtn.disabled = false ;
	} ;

	this.getAnswerLength = function() { return answerLength ; } ;

	this.freezeQuestionUI = function() {
		trueBtn.disabled = true ;
		falseBtn.disabled = true ;
	} ;

	this.getQuestionUI = function() {

		return DIV( P( { 'class' : 'text-primary' }, STRONG( question.statement ) ),
		            P(), 
		            trueBtn, SPAN( " " ), falseBtn 
		          ) ;
	} ;

	this.getAnswerUI = function() {

		var divBackground  = "#FFFFFF" ;
		if( answeredCorrectly != null ) {
			divBackground = ( answeredCorrectly ) ? "#D3FFE2" : "#FFCCCC" ;
		}

		return DIV( { 'style' : 'background-color:' + divBackground }, 
					SPAN( { 'class' : 'glyphicon gi-2x glyphicon-' + truthValueIcon } ),
					P(),
					P( question.justification )
				  ) ;
	} ;

	function handleUserRating( userChoice ) {
		answeredCorrectly = ( question.truthValue == userChoice ) ? true : false ;
		scope.showAnswer() ;
		if( answeredCorrectly ) {
			jnUtils.playCorrectAnswerClip() ;
		}
		else {
			jnUtils.playWrongAnswerClip() ;
		}
	}
}

// =============================================================================
// Matching handler
// =============================================================================
function MatchingHandler( chapterDetails, questionObj ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	var question = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager = null ;

	this.initialize = function( $scope ){ 
		log.debug( "Initializing matching handler." ) ;
		manager = new MatchQuestionManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return manager.answerLength ; } ;

	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;

	this.initializeQuestionUI = function() { manager.refresh() ; } ;

	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;

	this.freezeQuestionUI = function() { manager.freezeQuestionUI() ; } ;
}

// =============================================================================
// Image Label handler
// =============================================================================
function ImageLabelHandler( chapterDetails, questionObj ) {

	var textFormatter = new TextFormatter( chapterDetails ) ;

	var question = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager = null ;

	this.initialize = function( $scope ){ 
		log.debug( "Initializing image label handler." ) ;
		manager = new ImageLabelManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return manager.answerLength ; } ;

	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;

	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;

}
