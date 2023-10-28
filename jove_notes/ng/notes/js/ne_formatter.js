function NotesElementFormatter( chapterDetails, $sce ) {

	var jnUtil = new JoveNotesUtil() ;
	var textFormatter  = new TextFormatter( chapterDetails, $sce ) ;

	this.preProcessElement = function( element ) {

		element.difficultyLabel = 
			jnUtil.getDifficultyLevelLabel( element.difficultyLevel ) ;

		element.learningStats.efficiencyLabel = 
			jnUtil.getLearningEfficiencyLabel( element.learningStats.learningEfficiency ) ;

		element.learningStats.absEfficiencyLabel =
			jnUtil.getLearningEfficiencyLabel( element.learningStats.absLearningEfficiency ) ;

	}

	this.initializeScriptSupport = function( element ) {

		if( !element.hasOwnProperty( 'scriptInitialized' ) ) {

			element.scriptObj      = null ;		
			element.evalVarsValues = null ;

			element.scriptObj = jnUtil.makeObjectInstanceFromString( 
										element.scriptBody, 
										textFormatter.getChapterScript() ) ;
			if( element.scriptObj.hasOwnProperty( 'initialize' ) ) {
				element.scriptObj.initialize( element.learningStats.efficiencyLabel ) ;
			}

			textFormatter.setCurrentObject( element ) ;
			textFormatter.evaluateScriptedVariables() ;

			element.scriptInitialized = true ;
		}
	}

	this.formatWM = function( wmElement ){
		
		return wmElement ;
	}

	this.formatFIB = function( fibElement ){
		
		var formattedAnswer         = "&ctdot;&nbsp;&nbsp;" + textFormatter.format( fibElement.question ) ;
		var formattedPracticeAnswer = "&ctdot;&nbsp;&nbsp;" + fibElement.question ;
		var numBlanks               = fibElement.answers.length ;

		for( var i=0; i<numBlanks; i++ ) {
			var strToReplace = "{" + i + "}" ;
			var replacedText = "<span class='fib_answer'>" + fibElement.answers[i] + "</span>" ;

			formattedAnswer = formattedAnswer.replace( strToReplace, replacedText ) ;

			var ansLength = textFormatter.stripHTMLTags( replacedText ).length ;
			var blank = "" ;
			for( var j=0; j<ansLength; j++ ) {
				blank += "__" ;
			}
			formattedPracticeAnswer = formattedPracticeAnswer.replace( strToReplace, blank ) ; 
		}
		
		fibElement.question = formattedAnswer ;
		fibElement.practiceQuestion = formattedPracticeAnswer ;

		return fibElement ;
	}

	this.formatQA = function( qaElement ){

		qaElement.question = textFormatter.format( qaElement.question ) ;
		qaElement.answer   = textFormatter.format( qaElement.answer ) ;
		qaElement.ansRuler = getPrintRulers( qaElement.answer ) ;

		return qaElement ;
	}

	this.formatDefinition = function( defElement ) {

		defElement.term       = textFormatter.format( defElement.term ) ;
		defElement.definition = textFormatter.format( defElement.definition ) ;
		defElement.ansRuler   = getPrintRulers( defElement.definition ) ;

		return defElement ;
	}

	this.formatCharacter = function( charElement ) {

		charElement.character = textFormatter.format( charElement.character ) ;
		charElement.estimate  = textFormatter.format( charElement.estimate ) ;
		charElement.ansRuler  = getPrintRulers( charElement.estimate ) ;

		return charElement ;
	}

	this.formatTeacherNote = function( tnElement ) {

		tnElement.note = textFormatter.format( tnElement.note ) ;

		// Backward compatibility for all those teacher notes elements which 
		// did not get processed with caption
		if( tnElement.hasOwnProperty( 'caption' ) ){
			tnElement.caption = textFormatter.format( tnElement.caption ) ;
		}	
		else {
			tnElement.caption = "Teacher Note" ;
		}

		return tnElement ;
	}

	this.formatMatching = function( matchElement ) {

		var keys=[], values=[], practiceData=[] ;

		for( var i=0; i<matchElement.matchData.length; i++ ) {
			var pair = matchElement.matchData[i] ;
			pair[0] = textFormatter.format( pair[0] ) ;
			pair[1] = textFormatter.format( pair[1] ) ;

			keys.push( pair[0] ) ;
			values.push( pair[1] ) ;
		}

		keys.shuffle() ;
		values.shuffle() ;

		for( var i=0; i<keys.length; i++ ) {
			var pair=[] ;
			pair.push( keys[i] ) ;
			pair.push( values[i] ) ;
			practiceData.push( pair ) ;
		}

		matchElement.caption = textFormatter.format( matchElement.caption ) ;
		matchElement.practiceData = practiceData ;

		return matchElement ;
	}

	this.formatEvent = function( eventElement ) {

		eventElement.time = textFormatter.format( eventElement.time ) ;
		eventElement.event = textFormatter.format( eventElement.event ) ;

		return eventElement ;
	}

	this.formatTrueFalse = function( tfElement ) {

		tfElement.statement = textFormatter.format( tfElement.statement ) ;
		tfElement.justification = textFormatter.format( tfElement.justification ) ;

		return tfElement ;
	}

	this.formatChemEquation = function( chemEqElement ) {

		chemEqElement.description = textFormatter.format( chemEqElement.description ) ;
		chemEqElement.notes = textFormatter.format( chemEqElement.notes ) ;
		chemEqElement.fib   = formatChemEquationToFIB( chemEqElement.equation ) ;

		return chemEqElement ;
	}

	function formatChemEquationToFIB( eqStr ) {
	  
		var strippedEqStr = eqStr.replace( "}$$", "" ) ;
		var rSideStartIndex = Math.max( strippedEqStr.lastIndexOf( '>' ), 
		                                strippedEqStr.lastIndexOf( ']' ) ) ;
		var rSide = strippedEqStr.substring( rSideStartIndex + 1 ).trim() ;
		var rSideComponents = rSide.split( '+' ) ;

		for( var i=0; i<rSideComponents.length; i++ ) {

			var product = rSideComponents[i].trim() ;
			var index = eqStr.lastIndexOf( product ) ;

			var str = eqStr.substring( 0, index ) ;
			str += '\\_\\_\\_\\_\\_\\_\\_\\_\\_' ;
			str += eqStr.substring( index + product.length ) ;

			eqStr = str ;
		}
		return eqStr ;
	}

	this.formatChemCompound = function( chemCompoundElement ) {

		if( chemCompoundElement.chemicalName == null ) {
			chemCompoundElement.chemicalNamePrompt = "" ;
		}
		else {
			chemCompoundElement.chemicalNamePrompt = "___________________" ;
		}

		if( chemCompoundElement.commonName == null ) {
			chemCompoundElement.commonNamePrompt = "" ;
		}
		else {
			chemCompoundElement.commonNamePrompt = "___________________" ;
		}

		return chemCompoundElement ;
	}

	this.formatSpellbeeWord = function( spellbeeWord ) {
		return spellbeeWord ;
	}

	this.formatImageLabel = function( imageLabelElement ) {
		return imageLabelElement ;
	}

	this.formatEquation = function( eqElement ) {
		eqElement.description = textFormatter.format( eqElement.description ) ;
		for( var i=0; i<eqElement.symbols.length; i++ ) {
			var symbol = eqElement.symbols[i] ;
			symbol[1] = textFormatter.format( symbol[1] ) ;
		}
		return eqElement ;
	}

	this.formatRTC = function( rtcElement ) {
		rtcElement.context = textFormatter.format( rtcElement.context ) ;
		for( var i=0; i<rtcElement.notesElements.length; i++ ) {

			var ne = rtcElement.notesElements[i] ;
			var type = ne.elementType ;

			if( type == NotesElementsTypes.prototype.WM ) {
				this.formatWM( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.QA ) {
				this.formatQA( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.FIB ) {
				this.formatFIB( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.DEFINITION ) {
				this.formatDefinition( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHARACTER ) {
				this.formatCharacter( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.TEACHER_NOTE ) {
				this.formatTeacherNote( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.MATCHING ) {
				this.formatMatching( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.EVENT ) {
				this.formatEvent( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
				this.formatTrueFalse( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
				this.formatChemEquation( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
				this.formatChemCompound( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
				this.formatSpellbeeWord( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
				this.formatImageLabel( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.EQUATION ) {
				this.formatEquation( ne ) ;
			}
			else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
				this.formatMultiChoiceQuestion( ne ) ;
			}
		}
		return rtcElement ;
	}

	this.formatMultiChoiceQuestion = function( mcElement ) {
		mcElement.question = textFormatter.format( mcElement.question ) ;
		mcElement.answer = textFormatter.format( mcElement.answer ) ;

		return mcElement ;
	}

	this.formatVoice2TextQuestion = function( v2tElement ) {
		v2tElement.text = textFormatter.format( v2tElement.text ) ;
		return v2tElement ;
	}

	var getPrintRulers = function( formattedText ) {

		var ansLength = textFormatter.stripHTMLTags( formattedText ).length ;
		var numLines  = Math.round( ansLength / 35 ) ;
		var ansRuler  = "" ;

		if( numLines == 0 ) numLines = 1 ;
		for( var i=0; i<numLines; i++ ) {
			ansRuler += "<hr class='print_rule'>" ;
		}
		return ansRuler ;
	}
}