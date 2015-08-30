function MultiChoiceManager( questionObj, textFormatter, $scope ) {

	function Option( value, isCorrect ) {
		this.value     = value ;
		this.isCorrect = isCorrect ;
	} ;

	var numOptionsToShow  = 4 ;
	var numOptionsColumns = 2 ;

	var jnUtils = null ;

	var numCols = 0 ;
	var numRows = 0 ;

	var formattedQuestion    = null ;
	var formattedExplanation = null ;
	var options              = [] ;
	var optionsToDisplay     = [] ;
	var displayedOptionCells = [] ;
	var doneBtn              = null ;
	var incorrectOptions     = [] ;
	var correctOptions       = [] ;

	var questionDiv = null ;

	var selectedAnswers   = [] ;
	var answeredCorrectly = true ;

	var construct = function( questionObj, textFormatter, $scope ) {

		jnUtils = new JoveNotesUtil() ;
		formattedQuestion    = textFormatter.format( questionObj.question ) ;
		formattedExplanation = textFormatter.format( questionObj.explanation ) ;

		for( var i=0; i<questionObj.options.length; i++ ) {
			var optData = questionObj.options[i] ;
			var option  = new Option( textFormatter.format( optData[0] ), optData[1] ) ;
			options.push( option ) ;

			if( option.isCorrect ) {
				correctOptions.push( option ) ;
			}
			else {
				incorrectOptions.push( option ) ;
			}
		}

		if( correctOptions.length > numOptionsToShow ) {
			var msg = "Num correct answers is less than numOptionsToShow.\n" + 
				      "Question ID = " + questionObj.questionId ;
			alert( msg ) ;
			throw msg ;
		}

		if( numOptionsToShow > options.length ) {
			numOptionsToShow = options.length ;
		}
	} ;

	construct( questionObj, textFormatter, $scope ) ;

	// -------------------------------------------------------------------------
	this.initialize = function() {

		answeredCorrectly = true ;

		computeOptionsToDisplay() ;
		prepareQuestionUI() ;
	} ;

	this.getQuestionUI = function() {
		return questionDiv ;
	} ;
	
	this.freezeQuestionUI = function() {
		for( var i=0; i<displayedOptionCells.length; i++ ) {
			displayedOptionCells[i].onclick = null ;
		}
		if( doneBtn != null ) {
			doneBtn.disabled = true ;
		}
	} ;
	
	this.getAnswerUI = function() {

		var divBackground = ( answeredCorrectly ) ? "#D3FFE2" : "#FFCCCC" ;

		var correctOptionsTDs = [] ;
		for( var i=0; i<correctOptions.length; i++ ) {
			correctOptionsTDs.push( TD( { "class" : "selected" }, correctOptions[i].value ) ) ;
		}

		return DIV( { 'style' : 'background-color:' + divBackground, 'align' : 'center' }, 
					TABLE( { "class" : "mcq_option_table" }, TR( correctOptionsTDs ) ),
					P( { innerHTML : formattedExplanation } )
				  ) ;
	} ;

	// -------------------------------------------------------------------------
	var computeOptionsToDisplay = function() {

		optionsToDisplay.length = 0 ;

		correctOptions.shuffle() ;
		incorrectOptions.shuffle() ;

		for( var i=0; i<correctOptions.length; i++ ) {
			optionsToDisplay.push( correctOptions[i] ) ;
		}

		for( var i=0; optionsToDisplay.length < numOptionsToShow; i++ ) {
			optionsToDisplay.push( incorrectOptions[i] ) ;
		}

		optionsToDisplay.shuffle() ;
	}

	var prepareQuestionUI = function() {

		var questionP = P( { innerHTML : formattedQuestion } ) ;
		var tdDOMs    = [] ;
		var trDOMs    = [] ;
		var numRows   = Math.ceil( optionsToDisplay.length / numOptionsColumns ) ;

		displayedOptionCells.length = 0 ;

		for( var i=0; i<optionsToDisplay.length; i++ ) {

			var optionValue = optionsToDisplay[i].value ;
			var td = TD( { "class" : "unselected", innerHTML : optionValue } ) ;
			td.onclick = eventHandlerForChoice( i, td ) ;

			tdDOMs.push( td ) ;
			displayedOptionCells.push( td ) ;

			if( tdDOMs.length == numOptionsColumns ) {
				trDOMs.push( TR( tdDOMs ) ) ;
				tdDOMs.length = 0 ;
			}
		}

		if( tdDOMs.length != 0 ) {
			while( tdDOMs.length < numOptionsColumns ) {
				tdDOMs.push( TD() ) ;
			}
			trDOMs.push( TR( tdDOMs ) ) ;
		}

		if( correctOptions.length > 1 ) {
			doneBtn = BUTTON( { 'class' : 'btn btn-success btn-sm' }, "Done" ) ;
			doneBtn.onclick = evaluateAnswer ;
		}

		if( doneBtn != null ) {
			questionDiv = DIV( questionP, TABLE( { "class" : "mcq_option_table" }, trDOMs ), P(), doneBtn ) ;
		}
		else {
			questionDiv = DIV( questionP, TABLE( { "class" : "mcq_option_table" }, trDOMs ) ) ;
		}
	}

	var eventHandlerForChoice = function( i, td ) {
		return function() {
			td.className = ( td.className == 'selected' )?'unselected' : 'selected' ;
			if( td.className == 'selected' ) {
				if( selectedAnswers.indexOf( i ) == -1 ) {
					selectedAnswers.push( i ) ;
				}
				if( correctOptions.length == 1 ) {
					evaluateAnswer() ;
				}
			}
			else {
				var index = selectedAnswers.indexOf( i ) ;
				if( index > -1 ) {
					selectedAnswers.splice( index, 1 ) ;
				}
			}
		}
	}

	// Options can be segregated into four distinct groups post evaluation
	// 1. Not a correct option and not selected
	// 2. Not a correct option and selected
	// 3. Correct option and selected
	// 4. Correct option but not selected
	//
	// Case 1 and 3 lead us to overall correct answer, while 2 and 4 are incorrect
	// choices.
	//
	// This function renders each of the types separately and shows the answer
	var evaluateAnswer = function() {
		
		answeredCorrectly = true ;
		for( var i=0; i<optionsToDisplay.length; i++ ) {

			var option     = optionsToDisplay[i] ;
			var isSelected = ( selectedAnswers.indexOf( i ) > -1 ) ;
			var td         = displayedOptionCells[i] ;

			if( !option.isCorrect && isSelected ) {
				// Case 2 - Not a correct option and selected
				td.className = "incorrect_selected" ;
				answeredCorrectly = false ;
			}
			else if( option.isCorrect && !isSelected ) {
				// Case 4 - Correct option but not selected
				td.className = "correct_not_selected" ;
				answeredCorrectly = false ;
			}
		}
		
		$scope.showAnswer() ;
		if( answeredCorrectly ) {
			jnUtils.playCorrectAnswerClip() ;
		}
		else {
			jnUtils.playWrongAnswerClip() ;
		}
	}
} ;
