function initializeScriptSupport( question, textFormatter ) {

    if( question.scriptObj.hasOwnProperty( 'initialize' ) ) {
        question.scriptObj.initialize( question.learningStats.efficiencyLabel ) ;
    }
    textFormatter.setCurrentObject( question ) ;
    textFormatter.evaluateScriptedVariables() ;
}

// =============================================================================
// Fill in the blanks formatter
// =============================================================================
function FIBHandler( chapterDetails, question, textFormatter ) {

	var answerLength      = 0 ;
	var formattedQuestion = null ;
	var formattedAnswer   = null ;

	this.initialize = function( $scope ) {

		initializeScriptSupport( question, textFormatter ) ;

		formattedQuestion = textFormatter.format( question.question ) ;
		formattedAnswer   = "&ctdot;&nbsp;" + textFormatter.format( question.question ) ;
		answerLength      = 0 ;

		for( var i=0; i<question.answers.length; i++ ) {

			var strToReplace = "{" + i + "}" ;
			var replacedText = "<span class='fib_answer'>" + 
			                   textFormatter.format( question.answers[i] ) + 
			                   "</span>" ;

			formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
			formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
			answerLength     += ( "" + textFormatter.stripHTMLTags( replacedText ) ).length ;
		}
	}

	this.getAnswerLength = function(){ return answerLength ;      } ;
	this.getQuestionUI   = function(){ return formattedQuestion ; } ;
	this.getAnswerUI     = function(){ return formattedAnswer ;   } ;
}

// =============================================================================
// Word Meanings formatter
// =============================================================================
function QAHandler( chapterDetails, question, textFormatter ) {

	var formattedQuestion = null ;
	var formattedAnswer   = null ;
	var answerLength      = null ;

	this.initialize = function( $scope ) {

		initializeScriptSupport( question, textFormatter ) ;

		formattedQuestion = textFormatter.format( question.question ) ;
		formattedAnswer   = textFormatter.format( question.answer ) ;
		answerLength      = textFormatter.stripHTMLTags( formattedAnswer ).length ;
	}

	this.getAnswerLength = function() { return answerLength ;      } ;
	this.getQuestionUI   = function() { return P( { innerHTML : formattedQuestion } ) ; } ;
	this.getAnswerUI     = function() { return P( { innerHTML : formattedAnswer   } ) ; } ;
}

// =============================================================================
// True False handler
// =============================================================================
function TFHandler( chapterDetails, questionObj, textFormatter ) {

	var jnUtils = new JoveNotesUtil() ;

	var question          = questionObj ;
	var chapterDetails    = chapterDetails ;
	var scope             = null ;
	var answeredCorrectly = null ;
	var truthValueIcon    = ( question.truthValue ) ? "ok" : "remove" ;
	var answerLength      = question.statement.length ;
	var trueBtn           = BUTTON( { 'class' : 'btn btn-success btn-sm' }, "True" ) ;
	var falseBtn          = BUTTON( { 'class' : 'btn btn-warning btn-sm' }, "False" ) ;

	this.initialize = function( $scope ) {

		initializeScriptSupport( question, textFormatter ) ;

		scope = $scope ;

		if( question.hasOwnProperty( 'justification' ) ) {
			answerLength = question.justification.length ;
		}
		if( answerLength == 0 ) { this.answerLength = 5 } ;

		trueBtn.onclick  = function() { handleUserRating( true ) ; } ;
		falseBtn.onclick = function() { handleUserRating( false ) ; } ;

		answeredCorrectly = null ;
		trueBtn.disabled  = false ;
		falseBtn.disabled = false ;
	} ;

	this.getAnswerLength = function() { return answerLength ; } ;

	this.freezeQuestionUI = function() {
		trueBtn.disabled = true ;
		falseBtn.disabled = true ;
	} ;

	this.getQuestionUI = function() {

		var fmtStatement = textFormatter.format( question.statement ) ;
		return DIV( P( { 'class' : 'text-primary' }, 
			           STRONG( P( { innerHTML : fmtStatement } ) ),
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

	var question       = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager        = null ;
	var answerLength   = 500 ; // A random value, greater than 100 to ensure
	                           // that the answer is center justified

	this.initialize = function( $scope ){ 
		
		initializeScriptSupport( question, textFormatter ) ;

		manager = new MatchQuestionManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength      = function() { return answerLength ;            } ;
	this.getQuestionUI        = function() { return manager.getQuestionUI() ; } ;
	this.initializeQuestionUI = function() { manager.refresh() ;              } ;
	this.freezeQuestionUI     = function() { manager.freezeQuestionUI() ;     } ;
	this.getAnswerUI          = function() { return manager.getAnswerUI() ;   } ;
}

// =============================================================================
// Image Label handler
// =============================================================================
function ImageLabelHandler( chapterDetails, questionObj, textFormatter ) {

	var question       = questionObj ;
	var chapterDetails = chapterDetails ;
	var manager        = null ;
	var answerLength   = 500 ; // A random value, greater than 100 to ensure
	                           // that the answer is center justified

	this.initialize = function( $scope ){ 
		
		initializeScriptSupport( question, textFormatter ) ;

		manager = new ImageLabelManager( questionObj, textFormatter, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength = function() { return answerLength ;            } ;
	this.getQuestionUI   = function() { return manager.getQuestionUI() ; } ;
	this.getAnswerUI     = function() { return manager.getAnswerUI() ;   } ;
}

// =============================================================================
// Spell Bee Handler
// =============================================================================
function SpellBeeHandler( chapterDetails, questionObj, textFormatter ) {

	var manager        = null ;

	this.initialize = function( $scope ){ 
		
		initializeScriptSupport( questionObj, textFormatter ) ;

		manager = new SpellBeeManager( questionObj, $scope ) ;
		manager.initialize() ;
	}

	this.getAnswerLength    = function() { return questionObj.word.length ; } ;
	this.getQuestionUI      = function() { return manager.getQuestionUI() ; } ;
	this.freezeQuestionUI   = function() { manager.freezeQuestionUI() ;     } ;
	this.getAnswerUI        = function() { return manager.getAnswerUI() ;   } ;
	this.initializeAnswerUI = function() { manager.initializeAnswerUI() ;   } ;
}

// =============================================================================
// Multi Choice Handler
// =============================================================================
function MultiChoiceHandler( chapterDetails, question, textFormatter ) {

	var manager      = null ;
	var answerLength = textFormatter.stripHTMLTags( question.explanation ).length ;

	this.initialize = function( $scope ){ 
		
		initializeScriptSupport( question, textFormatter ) ;

		manager = new MultiChoiceManager( question, textFormatter, $scope ) ;
		manager.initialize() ;
	}	
	
	this.getAnswerLength  = function() { return answerLength ;            } ;
	this.getQuestionUI    = function() { return manager.getQuestionUI() ; } ;
	this.freezeQuestionUI = function() { manager.freezeQuestionUI() ;     } ;
	this.getAnswerUI      = function() { return manager.getAnswerUI() ;   } ;
}
