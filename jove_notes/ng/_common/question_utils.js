function QuestionTypes(){}

QuestionTypes.prototype.QT_FIB = "fib" ;
QuestionTypes.prototype.QT_WM  = "word_meaning" ;
QuestionTypes.prototype.QT_QA  = "question_answer" ;

function StudyStrategyTypes(){}

StudyStrategyTypes.prototype.SSR        = "SSR" ;
StudyStrategyTypes.prototype.EFF_HARD   = "EFF_HARD" ;
StudyStrategyTypes.prototype.EFF_EASY   = "EFF_EASY" ;
StudyStrategyTypes.prototype.OBJECTIVE  = "OBJECTIVE" ;
StudyStrategyTypes.prototype.SUBJECTIVE = "SUBJECTIVE" ;

function CardLevels(){}
CardLevels.prototype.NS  = "NS" ;
CardLevels.prototype.L0  = "L0" ;
CardLevels.prototype.L1  = "L1" ;
CardLevels.prototype.L2  = "L2" ;
CardLevels.prototype.L3  = "L3" ;
CardLevels.prototype.MAS = "MAS" ;


// =============================================================================
// =============================================================================

function QuestionFormatter() {
// -----------------------------------------------------------------------------
var chapter = null ;
var imgResourcePath = "" ;

this.createAndInjectFormattedText = function( chapterData ) {

	var chapter = chapterData ;
	var questions = chapterData.questions ;

	imgResourcePath = "/apps/jove_notes/workspace/" + 
	                  chapter.syllabusName + "/" + 
	                  chapter.subjectName  + "/" + 
	                  chapter.chapterNumber + "/" + 
	                  chapter.subChapterNumber + "/img/" ;

	for( i=0; i<questions.length; i++ ) {

		var question = questions[i] ;
		var type = question.questionType ;

		if( type == QuestionTypes.prototype.QT_FIB ) {
			formatFIB( question ) ;
		}
		else if( type == QuestionTypes.prototype.QT_WM ) {
			formatWM( question ) ;
		}
		else if( type == QuestionTypes.prototype.QT_QA ) {
			formatQA( question ) ;
		}
	}
}

// -----------------------------------------------------------------------------

function formatFIB( question ) {

	var formattedQuestion = question.question ;
	var formattedAnswer   = "&ctdot;&nbsp;" + question.question ;
	var numBlanks         = question.answers.length ;
	var answerLength      = 0 ;

	var i=0 ;
	for( ; i<numBlanks; i++ ) {
		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + question.answers[i] + "</code>" ;

		formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
		formattedQuestion = formattedQuestion.replace( strToReplace, " ______ " ) ;
		answerLength     += question.answers[i].length ;
	}
	
	question.formattedQuestion = formattedQuestion ;
	question.formattedAnswer   = formattedAnswer ;
	question.answerLength      = answerLength ;
}

function formatWM( question ) {

	question.formattedQuestion = "What is the meaning of : <p><code>" + question.word + "</code>" ;
	question.formattedAnswer   = question.meaning ;
	question.answerLength      = question.meaning.length ;
}

function formatQA( question ) {

	question.formattedQuestion = question.question ;
	question.formattedAnswer   = formatAnswer( question.answer ) ;
	question.answerLength      = stripHTMLTags( question.answer ).length ;
}

function stripHTMLTags( html ) {
   var tmp = document.createElement( "DIV" ) ;
   tmp.innerHTML = html ;
   return tmp.textContent || tmp.innerText || "" ;
}

function formatAnswer( answer ) {

	var regexp = /{{([^{]*)}}/g ;
	var formattedStr = answer ;
	var match = regexp.exec( answer ) ;

	while( match != null ) {

		var handleBarContents  = match[1].match(/\S+/g) ;
		var hint = handleBarContents[0] ;
		
		handleBarContents.shift() ;
		var parameters = handleBarContents ;

		var replacementContent = getReplacementContent( hint, parameters ) ;

		formattedStr = formattedStr.replace( match[0], replacementContent ) ;

		match = regexp.exec( answer ) ;
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

// -----------------------------------------------------------------------------
}
