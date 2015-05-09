function MatchQuestionManager( questionObj ) {

	function CardAnswerWrapper( question, answer ) {
		this.question = question ;
		this.answer   = answer ;
		this.numWrongAttempts = 0 ;
	} ;

	// Derived attributes - initialized during initialize() funciton
	this.caption   = questionObj.caption ;
	this.matchData = questionObj.matchData ;
	this.matchAssociativeArray = [] ;
	this.numTotalQuestions = 0 ;
	this.answerLength = 0 ;

	// Local variables
	var unAnsweredQuestions = [] ;
	var unAnsweredAnswers   = [] ;
	var answeredQuestions   = [] ;
	var answeredAnswers     = [] ;

	var divDOM                   = null ;
	var tableDOM                 = null ;
	var oldUnAnsQuestionRowIndex = -1 ;
	var selectedQuestion         = null ;

	this.initialize = function() {

		for( var i=0; i<this.matchData.length; i++ ) {

			var question = this.matchData[i][0] ;
			var answer   = this.matchData[i][1] ;

			this.matchAssociativeArray[ question ] = 
			                         new CardAnswerWrapper( question, answer ) ;

			unAnsweredQuestions.push( question ) ;
			unAnsweredAnswers.push( answer ) ;
			this.answerLength += answer.length ;
		}

		this.numTotalQuestions = this.matchData.length ;
		unAnsweredQuestions.shuffle() ;
		unAnsweredAnswers.shuffle() ;

		this.initializeTableDOMWithoutData() ;
	} ;

	this.initializeTableDOMWithoutData = function() {
		
		tableDOM = document.createElement( "table" ) ;
		tableDOM.createCaption().innerHTML = this.caption ;

		var tBody = tableDOM.createTBody() ;
		for( var i=0; i<this.numTotalQuestions; i++ ) {
			var tr = tBody.insertRow() ;
			
			tr.insertCell().appendChild( document.createElement( "div" ) ) ;

			var mDiv = document.createElement( "div" ) ;
			var middleTD = tr.insertCell() ;
			middleTD.className = 'separator_td' ;
			middleTD.appendChild( mDiv ) ;

			tr.insertCell().appendChild( document.createElement( "div" ) ) ;
		}

		divDOM = document.createElement( "div" ) ;
		divDOM.appendChild( tableDOM ) ;
		divDOM.setAttribute( "class", "jove_match_question_div" ) ;
	} ;

	this.isRightAnswer = function( question, answer ) {
		
		var verdict = false ;
		var answerWrapper = this.matchAssociativeArray[ question ] ;
		if( typeof answerWrapper === 'undefined') {
			console.log( "ERROR :: Question '" + question + "' is not registered" ) ;
		}
		else {
			verdict = ( answerWrapper.answer == answer ) ;
		}
		return verdict ;
	} ;

	this.getRightAnswer = function( question ) {
		
		var answerWrapper = this.matchAssociativeArray[ question ] ;
		if( typeof answerWrapper === 'undefined') {
			throw "ERROR :: Question '" + question + "' is not registered" ;
		}
		return answerWrapper.answer ;
	} ;

	this.matchQuestionAndUserAnswer = function( question, answer ) {

		var matchResult = false ;
		if( this.isRightAnswer( question, answer ) ) {

			var qIndex = unAnsweredQuestions.indexOf( question ) ;
			var aIndex = unAnsweredAnswers.indexOf( answer ) ;

			if( qIndex == -1 || aIndex == -1 ) {
				console.log( "ERROR: question '" + question + "' not found in " + 
					         "unAnsweredQuestions or answer '" + answer + "' " + 
					         "not found in unAnsweredAnswers" ) ;
			}
			else {
				unAnsweredQuestions.splice( qIndex, 1 ) ;
				unAnsweredAnswers.splice( aIndex, 1 ) ;

				answeredQuestions.splice( 0, 0, question ) ;
				answeredAnswers.splice( 0, 0, answer ) ;

				matchResult = true ;
			}
		}
		return matchResult ;
	} ;

	this.getQuestionUI = function() {
		return divDOM ;
	} ;

	this.refresh = function() {

		log.debug( "Refreshing matching question UI" ) ;
		for( var i=0 ; i<unAnsweredQuestions.length; i++ ) {
			this.renderUnansweredQuestion( i, 
				                           unAnsweredQuestions[i], 
				                           unAnsweredAnswers[i] ) ;
		}

		for( var i=0 ; i<answeredQuestions.length; i++ ) {
			this.renderAnsweredQuestion( i+unAnsweredQuestions.length,
				                         answeredQuestions[i], 
				                         answeredAnswers[i] ) ;
		}
	} ;

	this.renderUnansweredQuestion = function( rowIndex, question, answer ) {

		var qDiv = getCellDiv( rowIndex, 0 ) ;
		var mDiv = getCellDiv( rowIndex, 1 ) ;
		var aDiv = getCellDiv( rowIndex, 2 ) ;

		qDiv.innerHTML = question ;
		aDiv.innerHTML = answer ;
		mDiv.innerHTML = "..." ;

		qDiv.className = "unans_question" ;
		aDiv.className = "unans_answer" ;
		
		var thisInstance = this ;
		qDiv.onclick = function() {
			thisInstance.unAnsweredQuestionClicked( rowIndex, question ) ;
		} ;
		aDiv.onclick = function() {
			thisInstance.unAnsweredAnswerClicked( rowIndex, answer ) ;
		} ;
	}

	this.unAnsweredQuestionClicked = function( rowIndex, question ) {

		var oldQDiv = null ;
		var newQDiv = null ;

		if( oldUnAnsQuestionRowIndex != rowIndex ) {

			if( oldUnAnsQuestionRowIndex != -1 ) {
				oldQDiv = getCellDiv( oldUnAnsQuestionRowIndex, 0 ) ;
				oldQDiv.className = "unans_question" ;
			}

			newQDiv = getCellDiv( rowIndex, 0 ) ;
			newQDiv.className = "sel_unans_question";

			oldUnAnsQuestionRowIndex = rowIndex ;
			selectedQuestion = question ;
		}
	} ;

	this.unAnsweredAnswerClicked = function( rowIndex, answer ) {

		if( selectedQuestion != null ) {

			if( this.matchQuestionAndUserAnswer( selectedQuestion, answer ) ) {
				this.refresh() ;
				selectedQuestion = null ;
				oldUnAnsQuestionRowIndex = -1 ;

				this.checkAnswerCompleted() ;
			}
			else {
				var answerWrapper = this.matchAssociativeArray[ selectedQuestion ] ;
				var div = getCellDiv( rowIndex, 2 ) ;
				div.className = "wrong_unans_answer" ;
				setTimeout( function() { div.className = "unans_answer" ; }, 250 ) ;
				answerWrapper.numWrongAttempts++ ;
			}
		}
	} ;

	this.checkAnswerCompleted = function() {

		if( unAnsweredQuestions.length == 0 ) {

			var incorrect = false ;
			for( var question in this.matchAssociativeArray ) {
				var answerWrapper = this.matchAssociativeArray[ question ] ;
				if( answerWrapper.numWrongAttempts > 0 ) {
					incorrect = true ;
					break ;
				}
			}

			if( incorrect ) {
				playWrongAnswerClip() ;
			}
			else {
				playCorrectAnswerClip() ;
			}
		}
	} ;

	this.renderAnsweredQuestion = function( rowIndex, question, answer ) {

		var qDiv = getCellDiv( rowIndex, 0 ) ;
		var mDiv = getCellDiv( rowIndex, 1 ) ;
		var aDiv = getCellDiv( rowIndex, 2 ) ;

		qDiv.innerHTML = question ;
		aDiv.innerHTML = answer ;

		var answerWrapper = this.matchAssociativeArray[ question ] ;
		mDiv.innerHTML = answerWrapper.numWrongAttempts ;
		if( answerWrapper.numWrongAttempts > 0 ) {
			mDiv.style.background = 'red' ;
		}
		else {
			mDiv.style.background = '#00FF00' ;
			mDiv.style.color      = '#00FF00' ;
		}
		
		qDiv.className = "ans_question" ;
		aDiv.className = "ans_answer" ;

		qDiv.onclick = null ;
		aDiv.onclick = null ;
	}

	var getCellDiv = function( rowIndex, colIndex ) {
		return tableDOM.rows[rowIndex].cells[colIndex].children[0] ;
	}
} ;
