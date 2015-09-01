// =============================================================================
// Fill in the blanks formatter
// =============================================================================
function FIBHandler( chapterDetails, question, textFormatter ) {

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
			var replacedText = "<span class='fib_answer'>" + question.answers[i] + "</span>" ;

			formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
			formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
			answerLength     += ("" + question.answers[i]).length ;
		}
	}

	this.getAnswerLength = function() { return answerLength ; } ;
	this.getQuestionUI = function() { return formattedQuestion ; } ;
	this.getAnswerUI = function() { return formattedAnswer ; } ;
}

// =============================================================================
// Word Meanings formatter
// =============================================================================
function QAHandler( chapterDetails, question, textFormatter ) {

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
function TFHandler( chapterDetails, questionObj, textFormatter ) {

	var jnUtils = new JoveNotesUtil() ;

	var question = questionObj ;
	var chapterDetails = chapterDetails ;

	var scope = null ;
	var answeredCorrectly = null ;
	var trueBtn  = BUTTON( { 'class' : 'btn btn-success btn-sm' }, "True" ) ;
	var falseBtn = BUTTON( { 'class' : 'btn btn-warning btn-sm' }, "False" ) ;
	var truthValueIcon = ( question.truthValue ) ? "ok" : "remove" ;
	var answerLength = question.statement.length ;

	{
		if( question.hasOwnProperty( 'justification' ) ) {
			answerLength = question.justification.length ;
		}
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

		return DIV( P( { 'class' : 'text-primary' }, 
			           STRONG( P( { innerHTML : question.statement } ) ),
		               P(), 
		               trueBtn, SPAN( " " ), falseBtn 
		             ) 
		          ) ;
	} ;

	this.getAnswerUI = function() {

		var divBackground  = "#FFFFFF" ;
		if( answeredCorrectly != null ) {
			divBackground = ( answeredCorrectly ) ? "#D3FFE2" : "#FFCCCC" ;
		}

		var justificationText = null ;
		if( question.hasOwnProperty( 'justification' ) &&
			                        question.justification != null ) {
			justificationText = question.justification ;
		}
		else {
			justificationText = "" ;
		}

		return DIV( { 'style' : 'background-color:' + divBackground, 'align' : 'center' }, 
					SPAN( { 'class' : 'glyphicon gi-2x glyphicon-' + truthValueIcon } ),
					P(),
					P( { innerHTML : justificationText } )
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
function MatchingHandler( chapterDetails, questionObj, textFormatter ) {

	var question = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager = null ;
	var answerLength = 0 ;

	{
		var matchData = questionObj.matchData ;
		for( var i=0; i<matchData.length; i++ ) {
			var answer = matchData[i][1] ;
			answerLength += answer.length ;
		}
	}

	this.initialize = function( $scope ){ 
		manager = new MatchQuestionManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return answerLength ; } ;

	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;

	this.initializeQuestionUI = function() { manager.refresh() ; } ;

	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;

	this.freezeQuestionUI = function() { manager.freezeQuestionUI() ; } ;
}

// =============================================================================
// Image Label handler
// =============================================================================
function ImageLabelHandler( chapterDetails, questionObj, textFormatter ) {

	var question = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager = null ;
	var answerLength = 0 ;

	{
		var hotSpots = questionObj.hotSpots ;
		for( var i=0; i<hotSpots.length; i++ ) {
			var hsLabel = hotSpots[i][2] ;
			answerLength += hsLabel.length ;
		}
	}

	this.initialize = function( $scope ){ 
		manager = new ImageLabelManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return answerLength ; } ;

	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;

	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;

}

// =============================================================================
// Spell Bee Handler
// =============================================================================
function SpellBeeHandler( chapterDetails, questionObj, textFormatter ) {

	var manager = null ;

	this.initialize = function( $scope ){ 
		manager = new SpellBeeManager( questionObj, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return questionObj.word.length ; } ;

	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;

	this.freezeQuestionUI = function() { manager.freezeQuestionUI() ; } ;

	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;

	this.initializeAnswerUI = function(){ manager.initializeAnswerUI() ; } ;
}

// =============================================================================
// Multi Choice Handler
// =============================================================================
function MultiChoiceHandler( chapterDetails, question, textFormatter ) {

	var manager      = null ;
	var answerLength = textFormatter.stripHTMLTags( question.explanation ).length ;

	this.getAnswerLength = function() { return answerLength ; } ;

	this.initialize = function( $scope ){ 
		manager = new MultiChoiceManager( question, textFormatter, $scope ) ;
		manager.initialize() ;
	}	
	
	this.getQuestionUI = function() { return manager.getQuestionUI() ; } ;
	
	this.freezeQuestionUI = function() { manager.freezeQuestionUI() ; } ;
	
	this.getAnswerUI = function() { return manager.getAnswerUI() ; } ;
}
