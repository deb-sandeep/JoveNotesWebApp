// -----------------------------------------------------------------------------
function NotesElementsTypes(){}

NotesElementsTypes.prototype.WM            = "word_meaning" ;
NotesElementsTypes.prototype.QA            = "question_answer" ;
NotesElementsTypes.prototype.FIB           = "fib" ;
NotesElementsTypes.prototype.DEFINITION    = "definition" ;
NotesElementsTypes.prototype.CHARACTER     = "character" ;
NotesElementsTypes.prototype.TEACHER_NOTE  = "teacher_note" ;
NotesElementsTypes.prototype.MATCHING      = "matching" ;
NotesElementsTypes.prototype.EVENT         = "event" ;
NotesElementsTypes.prototype.TRUE_FALSE    = "true_false" ;
NotesElementsTypes.prototype.CHEM_EQUATION = "chem_equation" ;
NotesElementsTypes.prototype.CHEM_COMPOUND = "chem_compound" ;
NotesElementsTypes.prototype.SPELLBEE      = "spellbee" ;
NotesElementsTypes.prototype.IMAGE_LABEL   = "image_label" ;
NotesElementsTypes.prototype.EQUATION      = "equation" ;
NotesElementsTypes.prototype.REF_TO_CONTEXT= "rtc" ;
NotesElementsTypes.prototype.MULTI_CHOICE  = "multi_choice" ;

// -----------------------------------------------------------------------------
function QuestionTypes(){}

QuestionTypes.prototype.QT_FIB       = "fib" ;
QuestionTypes.prototype.QT_QA        = "question_answer" ;
QuestionTypes.prototype.QT_TF        = "true_false" ;
QuestionTypes.prototype.QT_MATCHING  = "matching" ;
QuestionTypes.prototype.QT_IMGLABEL  = "image_label" ;
QuestionTypes.prototype.QT_SPELLBEE  = "spellbee" ;
QuestionTypes.prototype.MULTI_CHOICE = "multi_choice" ;

// -----------------------------------------------------------------------------
function StudyStrategyTypes(){}

StudyStrategyTypes.prototype.SSR        = "SSR" ;
StudyStrategyTypes.prototype.EFF_HARD   = "EFF_HARD" ;
StudyStrategyTypes.prototype.EFF_EASY   = "EFF_EASY" ;
StudyStrategyTypes.prototype.OBJECTIVE  = "OBJECTIVE" ;
StudyStrategyTypes.prototype.SUBJECTIVE = "SUBJECTIVE" ;

// -----------------------------------------------------------------------------
function CardLevels(){}

CardLevels.prototype.NS  = "NS" ;
CardLevels.prototype.L0  = "L0" ;
CardLevels.prototype.L1  = "L1" ;
CardLevels.prototype.L2  = "L2" ;
CardLevels.prototype.L3  = "L3" ;
CardLevels.prototype.MAS = "MAS" ;

// =============================================================================
// =============================================================================
function TextFormatter( chapterDetails, $sce ) {

	var jnUtils = new JoveNotesUtil() ;

	var imgResourcePath   = jnUtils.getImgResourcePath( chapterDetails ) ;
	var audioResourcePath = jnUtils.getAudioResourcePath( chapterDetails ) ;
	var docResourcePath   = jnUtils.getDocResourcePath( chapterDetails ) ;

	this.stripHTMLTags = function( html ) {
	   var tmp = document.createElement( "DIV" ) ;
	   tmp.innerHTML = html ;
	   return tmp.textContent || tmp.innerText || "" ;
	}

	this.getAbsolutePathForImage = function( imgName ) {
		return imgResourcePath + imgName ;
	}

	this.format = function( inputText ) {

		// Why? Because once the input text is fomatted via $sce, it is transformed
		// into an object. There is no point in trying to process it again. This
		// scenario is relevant when the notes is being recomputed based on
		// user selected filter criteria.
		if( typeof inputText != 'string' ) {
			return inputText ;
		}

		var regexp = /{{([^{]*)}}/g ;
		var formattedStr = inputText ;
		var match = regexp.exec( inputText ) ;

		while( match != null ) {

			var handleBarContents  = match[1].match(/\S+/g) ;
			var hint = handleBarContents[0] ;
			
			handleBarContents.shift() ;
			var parameters = handleBarContents ;

			var replacementContent = getReplacementContent( hint, parameters ) ;

			formattedStr = formattedStr.replace( match[0], replacementContent ) ;

			match = regexp.exec( inputText ) ;
		}

		var formattedObj = formattedStr ;
		if( $sce != null ) {
			formattedObj = $sce.trustAsHtml( formattedStr ) ;
		}
		return formattedObj ;
	}

	function getReplacementContent( hint, parameters ) {

		var fileName = parameters.join( ' ' ) ;

		var replacementContent = "[[ COULD NOT SUBSTITUTE " + hint + 
		                         " - " + parameters + " ]]" ;
		if( hint == "@img" ) {
			replacementContent = "<img src='" + imgResourcePath + fileName + "'/>" ;
		}
		else if( hint == "@audio" ) {
			replacementContent = getAudioPlayButton( audioResourcePath + fileName ) ;
		}
		else if( hint == '@doc' ) {
			replacementContent = getDocLink( fileName ) ;
		}
		return replacementContent ;
	}

	function getAudioPlayButton( clipName ) {

		var btnHTML = "<button type='button' class='btn btn-default gi-1-5x' " +
		              "onClick=\"playSoundClip( '" + clipName + "')\">" + 
		              "<span class='glyphicon glyphicon-volume-up'></span>" + 
		              "</button>" ;
		return btnHTML ;
	}

	function getDocLink( linkHint ) {

		var fileName ;
		var displayName ;

		if( linkHint.indexOf( "|" ) != -1 ) {
			var parts = linkHint.split( "|" ) ;
			fileName = parts[0].trim() ;
			displayName = parts[1].trim() ;
		}
		else {
			fileName = linkHint ;
			displayName = linkHint ;
		}

		return "<a target='_blank' href='"  +
			       docResourcePath + fileName + "'>" + 
			       displayName + 
			       "</a>" ;
	}
}
