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
NotesElementsTypes.prototype.IMAGE_LABEL   = "image_label" ;
NotesElementsTypes.prototype.SPELLBEE      = "spellbee" ;
NotesElementsTypes.prototype.CHEM_EQUATION = "chem_equation" ;
NotesElementsTypes.prototype.CHEM_COMPOUND = "chem_compound" ;
NotesElementsTypes.prototype.EQUATION      = "equation" ;

// -----------------------------------------------------------------------------
function QuestionTypes(){}

QuestionTypes.prototype.QT_FIB      = "fib" ;
QuestionTypes.prototype.QT_QA       = "question_answer" ;
QuestionTypes.prototype.QT_TF       = "true_false" ;
QuestionTypes.prototype.QT_MATCHING = "matching" ;
QuestionTypes.prototype.QT_IMGLABEL = "image_label" ;
QuestionTypes.prototype.QT_SPELLBEE = "spellbee" ;

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
function TextFormatter( chapterDetails ) {

	var imgResourcePath = new JoveNotesUtil().getImgResourcePath( chapterDetails ) ;

	this.stripHTMLTags = function( html ) {
	   var tmp = document.createElement( "DIV" ) ;
	   tmp.innerHTML = html ;
	   return tmp.textContent || tmp.innerText || "" ;
	}

	this.getAbsolutePathForImage = function( imgName ) {
		return imgResourcePath + imgName ;
	}

	this.format = function( inputText ) {

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
		return formattedStr ;
	}

	function getReplacementContent( hint, parameters ) {

		var replacementContent = "[[ COULD NOT SUBSTITUTE " + hint + 
		                         " - " + parameters + " ]]" ;
		if( hint == "@img" ) {
			replacementContent = "<img src='" + imgResourcePath + parameters[0] + "'/>" ;
		}
		return replacementContent ;
	}
}

