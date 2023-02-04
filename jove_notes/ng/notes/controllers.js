notesApp.controller( 'NotesController', function( $scope, $http, $sce, $location, $anchorScroll ) {

// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

	this.useAbsoluteEfficiency     = false ;
	this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
	this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
	this.levelFilters              = [ "NS", "L0" ] ;
	this.sectionFilters            = [] ;

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
			this.levelFilters              = crit.levelFilters ;

			// Set the section filters to an empty array because they are
			// contextual per chapter and will be loaded afresh everytime
			this.sectionFilters = [] ;
        } ;
    }

    this.setDefaultCriteria = function() {
		this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
		this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
		this.levelFilters              = [ "NS", "L0" ] ;
		this.sectionFilters            = [] ;
    }
}

// ---------------- Local variables --------------------------------------------
var jnUtil      = new JoveNotesUtil() ;
var neFormatter = null ;

// ---------------- Controller variables ---------------------------------------
$scope.textFormatter = null ;
$scope.alerts        = [] ;
$scope.userName      = userName ;
$scope.chapterId     = chapterId ;
$scope.pageTitle     = null ;

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
$scope.voice2TextQuestions   = [] ;

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
	
	var audioFolder = jnUtil.getAudioResourcePath( $scope.chapterDetails ) ;
	var clipPath = audioFolder + clipName ;
	jnUtil.playSoundClip( clipPath ) ;
}

$scope.sectionFilterChanged = function() {

    for( var i=0; i<$scope.chapterDetails.sections.length; i++ ) {

        var masterSec = $scope.chapterDetails.sections[i] ;
        var selected = false ;

        for( var j=0; j<$scope.filterCriteria.sectionFilters.length; j++ ) {

            var selSec = $scope.filterCriteria.sectionFilters[j] ;
            if( masterSec.section == selSec.section ) {
                selected = true ;
            }
        }
        masterSec.selected = selected ? 1 : 0 ;
    }

    $http.post( '/jove_notes/api/ChapterSection/' + $scope.chapterDetails.chapterId, 
                $scope.chapterDetails.sections ) 
    .success( function( data ){
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

$scope.getSectionDisplayClass = function( section ) {
    return (section.selected == 1) ? "sel-section" : "unsel-section" ;
}

$scope.selectAllSections = function() {

    if( $scope.chapterDetails != null && 
        $scope.chapterDetails.sections.length>0 ) {

        $scope.filterCriteria.sectionFilters.length = 0 ;
        
        for( var i=0; i<$scope.chapterDetails.sections.length; i++ ) {
            var section = $scope.chapterDetails.sections[i] ;
            section.selected = 1 ;
            $scope.filterCriteria.sectionFilters.push( section ) ;
        }
    }
}

// ---------------- Private functions ------------------------------------------
function refreshData() {

	log.debug( "Requesting notes data from server." ) ;
	$http.get( "/jove_notes/api/ChapterNotes/" + chapterId + "?elementType=all" )
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
	$scope.pageTitle      = jnUtil.constructPageTitle( data.chapterDetails ) ;
	$scope.textFormatter  = new TextFormatter( data.chapterDetails, $sce ) ;

	neFormatter = new NotesElementFormatter( $scope.chapterDetails, $sce ) ;

	refreshSectionFilters() ;
 	processNotesElements() ;
}

function refreshSectionFilters() {

    if( $scope.chapterDetails != null ) {
        $scope.filterCriteria.sectionFilters.length = 0 ;
        for( var i=0; i<$scope.chapterDetails.sections.length; i++ ) {
            var section = $scope.chapterDetails.sections[i] ;
            if( section.selected == 1 ) {
                $scope.filterCriteria.sectionFilters.push( section ) ;
            }
        }
    }
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
	$scope.voice2TextQuestions.length   = 0 ;

	for( index=0; index<$scope.notesElements.length; index++ ) {

		var element = jQuery.extend( true, {}, $scope.notesElements[ index ] ) ;
		var type    = element.elementType ;

		neFormatter.preProcessElement( element ) ;
		neFormatter.initializeScriptSupport( element ) ;

		if( type == NotesElementsTypes.prototype.TEACHER_NOTE ) {
			$scope.filteredNotesElements.push( element ) ;
			$scope.teacherNotes.push( neFormatter.formatTeacherNote( element ) ) ;
		}
		else if( qualifiesFilter( element ) ) {

			$scope.filteredNotesElements.push( element ) ;

			if( type == NotesElementsTypes.prototype.WM ) {
				$scope.wordMeanings.push( neFormatter.formatWM( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.QA ) {
				$scope.questionAnswers.push( neFormatter.formatQA( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.FIB ) {
				$scope.fibs.push( neFormatter.formatFIB( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.DEFINITION ) {
				$scope.definitions.push( neFormatter.formatDefinition( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHARACTER ) {
				$scope.characters.push( neFormatter.formatCharacter( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.MATCHING ) {
				$scope.matchings.push( neFormatter.formatMatching( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.EVENT ) {
				$scope.events.push( neFormatter.formatEvent( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
				$scope.trueFalseStatements.push( neFormatter.formatTrueFalse( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
				$scope.chemEquations.push( neFormatter.formatChemEquation( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
				$scope.chemCompounds.push( neFormatter.formatChemCompound( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
				$scope.spellbeeWords.push( neFormatter.formatSpellbeeWord( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
				$scope.imageLabels.push( neFormatter.formatImageLabel( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.EQUATION ) {
				$scope.equations.push( neFormatter.formatEquation( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.REF_TO_CONTEXT ) {
				$scope.referenceToContexts.push( neFormatter.formatRTC( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
				$scope.multiChoiceQuestions.push( neFormatter.formatMultiChoiceQuestion( element ) ) ;
			}
			else if( type == NotesElementsTypes.prototype.VOICE2TEXT ) {
				$scope.voice2TextQuestions.push( neFormatter.formatVoice2TextQuestion( element ) ) ;
			}
		}
		else {
			//log.debug( "Note element " + element.noteElementId + 
			//	       " did not meet filter criteria." ) ;
		}
	}

 	setTimeout( function(){
 		MathJax.Hub.Queue( [ "Typeset", MathJax.Hub ] ) 
 	}, 100 ) ;
}

function qualifiesFilter( element ) {

	var lrnEffLabelFilters = $scope.filterCriteria.learningEfficiencyFilters ;
	var diffLabelFilters   = $scope.filterCriteria.difficultyFilters ;
	var levelFilters       = $scope.filterCriteria.levelFilters ;
	var sectionFilters     = $scope.filterCriteria.sectionFilters ;

    var filteredBySelectedSections = false ;

    if( sectionFilters.length > 0 ) {
        if( element.section != null ) {
            filteredBySelectedSections = true ;
            for( var i=0; i<sectionFilters.length; i++ ) {
                var selSec = sectionFilters[i] ;
                if( selSec.section == element.section ) {
                    filteredBySelectedSections = false ;
                    break ;
                }
            }
        }
    }

    if( filteredBySelectedSections ) {
        return false ;
    }

	var efficiencyLabel = element.learningStats.efficiencyLabel ;
	if( $scope.filterCriteria.useAbsoluteEfficiency ) {
		efficiencyLabel = element.learningStats.absEfficiencyLabel ;
	}

	if( lrnEffLabelFilters.indexOf( efficiencyLabel ) != -1 ) {
		for( var index=0; index<element.currentLevels.length; index++ ) {
			var curLevelOfACard = element.currentLevels[ index ] ;
			if( levelFilters.indexOf( curLevelOfACard ) != -1 ) {
				return true ;
			}
		}
	}
	return false ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



