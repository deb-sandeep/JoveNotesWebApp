notesApp.controller( 'NotesController', function( $scope, $http, $sce, $location, $anchorScroll ) {

// ---------------- Local variables --------------------------------------------
var jnUtil      = new JoveNotesUtil() ;
var neFormatter = null ;

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

function NEGroup() {

	this.wordMeanings          = [] ;
	this.questionAnswers       = [] ;
	this.fibs                  = [] ;
	this.definitions           = [] ;
	this.characters            = [] ;
	this.teacherNotes          = [] ;
	this.matchings             = [] ;
	this.events                = [] ;
	this.trueFalseStatements   = [] ;
	this.chemEquations         = [] ;
	this.chemCompounds         = [] ;
	this.spellbeeWords         = [] ;
	this.imageLabels           = [] ;
	this.equations             = [] ;
	this.referenceToContexts   = [] ;
	this.multiChoiceQuestions  = [] ;
	this.voice2TextQuestions   = [] ;

	this.reset = function() {

		this.wordMeanings.length          = 0 ;
		this.questionAnswers.length       = 0 ;
		this.fibs.length                  = 0 ;
		this.definitions.length           = 0 ;
		this.characters.length            = 0 ;
		this.teacherNotes.length          = 0 ;
		this.matchings.length             = 0 ;
		this.events.length                = 0 ;
		this.trueFalseStatements.length   = 0 ;
		this.chemEquations.length         = 0 ;
		this.chemCompounds.length         = 0 ;
		this.spellbeeWords.length         = 0 ;
		this.imageLabels.length           = 0 ;
		this.equations.length             = 0 ;
		this.referenceToContexts.length   = 0 ;
		this.multiChoiceQuestions.length  = 0 ;
		this.voice2TextQuestions.length   = 0 ;
	}

	this.addNote = function( element ) {

		var type = element.elementType ;

		if( type == NotesElementsTypes.prototype.WM ) {
			if( !element.formatted ) {
				element = neFormatter.formatWM( element ) ;
				element.formatted = true ;
			}
			this.wordMeanings.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.QA ) {
			if( !element.formatted ) {
				element = neFormatter.formatQA( element ) ;
				element.formatted = true ;
			}
			this.questionAnswers.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.FIB ) {
			if( !element.formatted ) {
				element = neFormatter.formatFIB( element ) ;
				element.formatted = true ;
			}
			this.fibs.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.DEFINITION ) {
			if( !element.formatted ) {
				element = neFormatter.formatDefinition( element ) ;
				element.formatted = true ;
			}
			this.definitions.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.CHARACTER ) {
			if( !element.formatted ) {
				element = neFormatter.formatCharacter( element ) ;
				element.formatted = true ;
			}
			this.characters.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.MATCHING ) {
			if( !element.formatted ) {
				element = neFormatter.formatMatching( element ) ;
				element.formatted = true ;
			}
			this.matchings.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.EVENT ) {
			if( !element.formatted ) {
				element = neFormatter.formatEvent( element ) ;
				element.formatted = true ;
			}
			this.events.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
			if( !element.formatted ) {
				element = neFormatter.formatTrueFalse( element ) ;
				element.formatted = true ;
			}
			this.trueFalseStatements.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
			if( !element.formatted ) {
				element = neFormatter.formatChemEquation( element ) ;
				element.formatted = true ;
			}
			this.chemEquations.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
			if( !element.formatted ) {
				element = neFormatter.formatChemCompound( element ) ;
				element.formatted = true ;
			}
			this.chemCompounds.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
			if( !element.formatted ) {
				element = neFormatter.formatSpellbeeWord( element ) ;
				element.formatted = true ;
			}
			this.spellbeeWords.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
			if( !element.formatted ) {
				element = neFormatter.formatImageLabel( element ) ;
				element.formatted = true ;
			}
			this.imageLabels.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.EQUATION ) {
			if( !element.formatted ) {
				element = neFormatter.formatEquation( element ) ;
				element.formatted = true ;
			}
			this.equations.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.REF_TO_CONTEXT ) {
			if( !element.formatted ) {
				element = neFormatter.formatRTC( element ) ;
				element.formatted = true ;
			}
			this.referenceToContexts.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
			if( !element.formatted ) {
				element = neFormatter.formatMultiChoiceQuestion( element ) ;
				element.formatted = true ;
			}
			this.multiChoiceQuestions.push( element ) ;
		}
		else if( type == NotesElementsTypes.prototype.VOICE2TEXT ) {
			if( !element.formatted ) {
				element = neFormatter.formatVoice2TextQuestion( element ) ;
				element.formatted = true ;
			}
			this.voice2TextQuestions.push( element ) ;
		}
	}
}

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

$scope.notesLayoutMode = 'sections' ;

// These are the arrays that hold the questions which match the filter criteria
$scope.linearNEGroup         = new NEGroup() ;
$scope.sectionNEGroups       = [] ;

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
    saveSectionSelectionOnServer() ;
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
	    saveSectionSelectionOnServer() ;
    }
}

$scope.toggleNotesLayout = function() {
	$scope.notesLayoutMode = ( $scope.notesLayoutMode == 'sections' ) ? 
	                         'linear' : 'sections' ;
}

// ---------------- Private functions ------------------------------------------
function saveSectionSelectionOnServer() {

    $http.post( '/jove_notes/api/ChapterSection/' + $scope.chapterDetails.chapterId, 
                $scope.chapterDetails.sections ) 
    .success( function( data ){
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

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
	$scope.linearNEGroup.reset() ;
	$scope.sectionNEGroups.length = 0 ;

	var sectionMap = new Map() ;

	for( index=0; index<$scope.notesElements.length; index++ ) {

		var element = jQuery.extend( true, {}, $scope.notesElements[ index ] ) ;

		// Inject the formatted flag to avoid duplicate formatting
		element.formatted = false ;

		neFormatter.preProcessElement( element ) ;
		neFormatter.initializeScriptSupport( element ) ;

		if( qualifiesFilter( element ) ) {

			$scope.linearNEGroup.addNote( element ) ;

			var section = element.section == null ? '99 - Sectionless' : element.section ;
			var sectionGroup = sectionMap.get( section ) ;

			if( sectionGroup === undefined ) {
				sectionGroup = {
					sectionName : section,
					neGroup : new NEGroup()
				} ;
				sectionMap.set( section, sectionGroup ) ;
				$scope.sectionNEGroups.push( sectionGroup ) ;
			}
			sectionGroup.neGroup.addNote( element ) ;
		}
		else {
			//log.debug( "Note element " + element.noteElementId + 
			//	       " did not meet filter criteria." ) ;
		}
	}

	$scope.sectionNEGroups.sort( function( g1, g2 ){
		return g1.sectionName.localeCompare( g2.sectionName ) ;
	}) ;

 	setTimeout( function(){
 		MathJax.Hub.Queue( [ "Typeset", MathJax.Hub ] ) 
 	}, 100 ) ;
}

function qualifiesFilter( element ) {

	if( element.elementType == NotesElementsTypes.prototype.TEACHER_NOTE ) {
		return true ;
	}

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



