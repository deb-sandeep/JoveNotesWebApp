notesApp.controller( 'NotesController', function( $scope, $http, $sce, $location, $anchorScroll ) {

// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

	this.useAbsoluteEfficiency     = false ;
	this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
	this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'notesCriteria', this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'notesCriteria' ) ;
        if( typeof crit != 'undefined' ) {
	        log.debug( "Deserialized filter criteria." ) ;
	        this.useAbsoluteEfficiency     = crit.useAbsoluteEfficiency ;
			this.learningEfficiencyFilters = crit.learningEfficiencyFilters ;
			this.difficultyFilters         = crit.difficultyFilters ;
        } ;
    }

    this.setDefaultCriteria = function() {
		this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
		this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
    }
}

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var textFormatter = null ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts    = [] ;
$scope.userName  = userName ;
$scope.chapterId = chapterId ;
$scope.pageTitle = null ;

$scope.filterCriteria = new FilterCriteria() ;
$scope.filterOptions  = new NotesFilterOptions() ;

$scope.showUserStatistics = false ;
$scope.showFilterForm     = false ;

// The deserialized chapter data as returned by the API
$scope.chapterDetails = null ;
$scope.notesElements  = null ;

// These are the arrays that hold the questions which match the filter criteria
$scope.filteredNotesElements = [] ;
$scope.wordMeanings          = [] ;
$scope.questionAnswers       = [] ;
$scope.fibs                  = [] ;
$scope.definitions           = [] ;
$scope.characters            = [] ;
$scope.teacherNotes          = [] ;
$scope.matchings             = [] ;
$scope.events                = [] ;
$scope.trueFalseStatements   = [] ;
$scope.chemEquations         = [] ;
$scope.chemCompounds         = [] ;
$scope.spellbeeWords         = [] ;
$scope.imageLabels           = [] ;
$scope.equations             = [] ;
$scope.referenceToContexts   = [] ;
$scope.multiChoiceQuestions  = [] ;

// ---------------- Main logic for the controller ------------------------------
{
	log.debug( "Executing NotesController." ) ;
	$scope.filterCriteria.deserialize() ;
	refreshData() ;
}

// ---------------- Controller methods -----------------------------------------
$scope.scrollTo = function( id ) {
  $location.hash( id ) ; 
  $anchorScroll() ;
}

$scope.addErrorAlert = function( msgString ) {
	$scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
	$scope.alerts.splice(index, 1);
};

$scope.toggleUserStatistics = function() {
	$scope.showUserStatistics = !$scope.showUserStatistics ;
}

$scope.toggleFilterForm = function() {
	$scope.showFilterForm = !$scope.showFilterForm ;
}

$scope.applyFilter = function() {
	$scope.filterCriteria.serialize() ;
	$scope.toggleFilterForm() ;
	processNotesElements() ;
}

$scope.cancelFilter = function() {
	$scope.showFilterForm = false ;
	$scope.filterCriteria.deserialize() ;
}

$scope.playWordSound = function( word ) {
	jnUtil.playWordSound( word ) ;
}

$scope.playSoundClip = function( clipName ) {

	alert( clipName ) ;
	
	var audioFolder = jnUtil.getAudioResourcePath( $scope.chapterDetails ) ;
	var clipPath = audioFolder + clipName ;
	jnUtil.playSoundClip( clipPath ) ;
}

// ---------------- Private functions ------------------------------------------
function refreshData() {

	log.debug( "Requesting notes data from server." ) ;
	$http.get( "/jove_notes/api/ChapterNotes/" + chapterId )
         .success( function( data ){
         	log.debug( "Data received from server." ) ;
         	processServerData( data ) ;
			setTimeout( hljs.initHighlighting, 1000 ) ;
         })
         .error( function( data ){
         	log.error( "Server returned error. " + data ) ;
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function processServerData( data ) {

	if( typeof data === "string" ) {
		log.error( "Server returned invalid data. " + data ) ;
		$scope.addErrorAlert( "Server returned invalid data. " + data ) ;
		return ;
	}
	
 	$scope.chapterDetails = data.chapterDetails ;
 	$scope.notesElements  = data.notesElements ;

	$scope.pageTitle = jnUtil.constructPageTitle( data.chapterDetails ) ;
	log.debug( "Page title = " + $scope.pageTitle ) ;

	textFormatter = new TextFormatter( data.chapterDetails, $sce ) ;
 	processNotesElements() ;
}

function processNotesElements() {

	log.debug( "Processing notes elements." ) ;

	// Reset all the arrrays before we fill them with filtered contents
	$scope.filteredNotesElements.length = 0 ;
	$scope.wordMeanings.length          = 0 ;
	$scope.questionAnswers.length       = 0 ;
	$scope.fibs.length                  = 0 ;
	$scope.definitions.length           = 0 ;
	$scope.characters.length            = 0 ;
	$scope.teacherNotes.length          = 0 ;
	$scope.matchings.length             = 0 ;
	$scope.events.length                = 0 ;
	$scope.trueFalseStatements.length   = 0 ;
	$scope.chemEquations.length         = 0 ;
	$scope.chemCompounds.length         = 0 ;
	$scope.spellbeeWords.length         = 0 ;
	$scope.imageLabels.length           = 0 ;
	$scope.equations.length             = 0 ;
	$scope.referenceToContexts.length   = 0 ;
	$scope.multiChoiceQuestions.length  = 0 ;

	for( index=0; index<$scope.notesElements.length; index++ ) {

		var element = $scope.notesElements[ index ] ;
		var type    = element.elementType ;

		if( qualifiesFilter( element ) ) {

			$scope.filteredNotesElements.push( element ) ;

			if( type == NotesElementsTypes.prototype.WM ) {
				$scope.wordMeanings.push( formatWM( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.QA ) {
				$scope.questionAnswers.push( formatQA( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.FIB ) {
				$scope.fibs.push( formatFIB( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.DEFINITION ) {
				$scope.definitions.push( formatDefinition( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHARACTER ) {
				$scope.characters.push( formatCharacter( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.TEACHER_NOTE ) {
				$scope.teacherNotes.push( formatTeacherNote( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.MATCHING ) {
				$scope.matchings.push( formatMatching( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.EVENT ) {
				$scope.events.push( formatEvent( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
				$scope.trueFalseStatements.push( formatTrueFalse( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
				$scope.chemEquations.push( formatChemEquation( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
				$scope.chemCompounds.push( formatChemCompound( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
				$scope.spellbeeWords.push( formatSpellbeeWord( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
				$scope.imageLabels.push( formatImageLabel( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.EQUATION ) {
				$scope.equations.push( formatEquation( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.REF_TO_CONTEXT ) {
				$scope.referenceToContexts.push( formatRTC( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
				$scope.multiChoiceQuestions.push( formatMultiChoiceQuestion( element ) ) ;
			}
		}
		else {
			//log.debug( "Note element " + element.noteElementId + 
			//	       " did not meet filter criteria." ) ;
		}
	}
}

function qualifiesFilter( element ) {

	var jnUtil = new JoveNotesUtil() ;

	element.difficultyLabel = 
		jnUtil.getDifficultyLevelLabel( element.difficultyLevel ) ;

	element.learningStats.efficiencyLabel = 
		jnUtil.getLearningEfficiencyLabel( element.learningStats.learningEfficiency ) ;

	element.learningStats.absEfficiencyLabel =
		jnUtil.getLearningEfficiencyLabel( element.learningStats.absLearningEfficiency ) ;

	var lrnEffLabelFilters = $scope.filterCriteria.learningEfficiencyFilters ;
	var diffLabelFilters   = $scope.filterCriteria.difficultyFilters ;

	var efficiencyLabel = element.learningStats.efficiencyLabel ;
	if( $scope.filterCriteria.useAbsoluteEfficiency ) {
		efficiencyLabel = element.learningStats.absEfficiencyLabel ;
	}

	if( lrnEffLabelFilters.indexOf( efficiencyLabel ) != -1 ) {
		if( diffLabelFilters.indexOf( element.difficultyLabel ) != -1 ) {
			return true ;
		}
	}
	return false ;
}

function getPrintRulers( formattedText ) {

	var ansLength = textFormatter.stripHTMLTags( formattedText ).length ;
	var numLines  = Math.round( ansLength / 35 ) ;
	var ansRuler  = "" ;

	if( numLines == 0 ) numLines = 1 ;
	for( var i=0; i<numLines; i++ ) {
		ansRuler += "<hr class='print_rule'>" ;
	}
	return ansRuler ;
}

function formatWM( wmElement ){
	return wmElement ;
}

function formatFIB( fibElement ){
	
	var formattedAnswer         = "&ctdot;&nbsp;" + fibElement.question ;
	var formattedPracticeAnswer = "&ctdot;&nbsp;" + fibElement.question ;
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

function formatQA( qaElement ){
	qaElement.question = textFormatter.format( qaElement.question ) ;
	qaElement.answer   = textFormatter.format( qaElement.answer ) ;
	qaElement.ansRuler = getPrintRulers( qaElement.answer ) ;

	return qaElement ;
}

function formatDefinition( defElement ) {
	defElement.term       = textFormatter.format( defElement.term ) ;
	defElement.definition = textFormatter.format( defElement.definition ) ;
	defElement.ansRuler   = getPrintRulers( defElement.definition ) ;

	return defElement ;
}

function formatCharacter( charElement ) {
	charElement.character = textFormatter.format( charElement.character ) ;
	charElement.estimate  = textFormatter.format( charElement.estimate ) ;
	charElement.ansRuler  = getPrintRulers( charElement.estimate ) ;

	return charElement ;
}

function formatTeacherNote( tnElement ) {
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

function formatMatching( matchElement ) {
	for( var i=0; i<matchElement.matchData.length; i++ ) {
		var pair = matchElement.matchData[i] ;
		pair[0] = textFormatter.format( pair[0] ) ;
		pair[1] = textFormatter.format( pair[1] ) ;
	}
	return matchElement ;
}

function formatEvent( eventElement ) {
	eventElement.time = textFormatter.format( eventElement.time ) ;
	eventElement.event = textFormatter.format( eventElement.event ) ;

	return eventElement ;
}

function formatTrueFalse( tfElement ) {
	tfElement.statement = textFormatter.format( tfElement.statement ) ;
	tfElement.justification = textFormatter.format( tfElement.justification ) ;

	return tfElement ;
}

function formatChemEquation( chemEqElement ) {
	chemEqElement.description = textFormatter.format( chemEqElement.description ) ;
	chemEqElement.notes = textFormatter.format( chemEqElement.notes ) ;

	return chemEqElement ;
}

function formatChemCompound( chemCompoundElement ) {

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

function formatSpellbeeWord( spellbeeWord ) {
	return spellbeeWord ;
}

function formatImageLabel( imageLabelElement ) {
	return imageLabelElement ;
}

function formatEquation( eqElement ) {
	eqElement.description = textFormatter.format( eqElement.description ) ;
	for( var i=0; i<eqElement.symbols.length; i++ ) {
		var symbol = eqElement.symbols[i] ;
		symbol[1] = textFormatter.format( symbol[1] ) ;
	}
	return eqElement ;
}

function formatRTC( rtcElement ) {

	rtcElement.context = textFormatter.format( rtcElement.context ) ;
	for( var i=0; i<rtcElement.questions.length; i++ ) {
		var qa = rtcElement.questions[i] ;
		qa.question = textFormatter.format( qa.question ) ;
		qa.answer   = textFormatter.format( qa.answer ) ;
		qa.ansRuler = getPrintRulers( qa.answer ) ;
	}
	return rtcElement ;
}

function formatMultiChoiceQuestion( mcElement ) {

	mcElement.question = textFormatter.format( mcElement.question ) ;
	mcElement.answer = textFormatter.format( mcElement.answer ) ;

	return mcElement ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



