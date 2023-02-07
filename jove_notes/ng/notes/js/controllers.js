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
	$scope.linearNEGroup.setFormatter( neFormatter ) ;
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

				sectionGroup.neGroup.setFormatter( neFormatter ) ;

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



