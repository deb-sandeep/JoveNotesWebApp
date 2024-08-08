notesApp.controller( 'ChainedNotesController', function( $scope, $http, $sce, $location, $anchorScroll ) {

	// ---------------- Local variables --------------------------------------------
	const jnUtil = new JoveNotesUtil();
	let neFormatter = null;

	// ---------------- Controller variables ---------------------------------------
	$scope.textFormatter      = null ;
	$scope.alerts             = [] ;
	$scope.userName           = userName ;
	$scope.chapterId          = chapterId ;
	$scope.levels             = levels.split( ',' ) ;
	$scope.remainingChaperIds = remainingChapterIds ;
	$scope.pageTitle          = null ;

	$scope.showUserStatistics = false ;

	$scope.sectionFilters = [] ;

	// The deserialized chapter data as returned by the API
	$scope.chapterDetails = null ;
	$scope.notesElements  = null ;

	$scope.notesLayoutMode = 'sections' ;

	// These are the arrays that hold the questions which match the filter criteria
	$scope.linearNEGroup         = new NEGroup() ;
	$scope.sectionNEGroups       = [] ;

	// ---------------- Main logic for the controller ------------------------------
	{
		log.debug( "Executing ChainedNotesController." ) ;
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

	$scope.playWordSound = function( word ) {
		jnUtil.playWordSound( word ) ;
	}

	$scope.playSoundClip = function( clipName ) {

		const audioFolder = jnUtil.getAudioResourcePath($scope.chapterDetails);
		const clipPath = audioFolder + clipName;
		jnUtil.playSoundClip( clipPath ) ;
	}

	$scope.getSectionDisplayClass = function( section ) {
		return (section.selected === 1) ? "sel-section" : "unsel-section" ;
	}

	$scope.toggleNotesLayout = function() {
		$scope.notesLayoutMode = ( $scope.notesLayoutMode === 'sections' ) ?
								 'linear' : 'sections' ;
	}

	$scope.getNotesHighlightClass = function( element ) {

		let le  = element.learningStats.learningEfficiency ;
		let ale = element.learningStats.absLearningEfficiency ;
		let na  = element.learningStats.numAttempts ;

		if( na >= 15 ) {
			if( ale < 80 ) {
				return 'highlight-note-m' ;
			}
		}
		else if( na >= 9 ) {
			if( le < 90 ) {
				return 'highlight-note-h' ;
			}
			else if( ale <= 75 ) {
				return 'highlight-note-h' ;
			}
		}
		else {
			if( le <= 75 && ale <= 75 ) {
				return 'highlight-note-m' ;
			}
		}
		return "" ;
	}

	$scope.nextChapter = function() {

		if( $scope.remainingChaperIds != null ) {
			window.location.href = "/apps/jove_notes/ng/notes_chained/index.php?" +
				"levels=" + $scope.levels +
				"&chapterIds=" + $scope.remainingChaperIds ;
		}
		else {
			window.location.href = "/apps/jove_notes/ng/dashboard/index.php" ;
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
			$scope.sectionFilters.length = 0 ;
			for( let i=0; i<$scope.chapterDetails.sections.length; i++ ) {
				const section = $scope.chapterDetails.sections[i];
				if( section.selected === 1 ) {
					$scope.sectionFilters.push( section ) ;
				}
			}
		}
	}

	function processNotesElements() {

		if( $scope.notesElements == null || $scope.notesElements.length === 0 ) {
			return ;
		}

		log.debug( "Processing notes elements." ) ;

		// Reset all the arrrays before we fill them with filtered contents
		$scope.linearNEGroup.setFormatter( neFormatter ) ;
		$scope.sectionNEGroups.length = 0 ;

		const sectionMap = new Map();

		for( let index=0; index<$scope.notesElements.length; index++ ) {

			const element = jQuery.extend(true, {}, $scope.notesElements[index]);

			// Inject the formatted flag to avoid duplicate formatting
			element.formatted = false ;

			neFormatter.preProcessElement( element ) ;
			neFormatter.initializeScriptSupport( element ) ;

			if( qualifiesFilter( element ) ) {

				$scope.linearNEGroup.addNote( element ) ;

				const section = element.section == null ? '99 - Sectionless' : element.section;
				let sectionGroup = sectionMap.get(section);

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

		if( element.elementType === NotesElementsTypes.prototype.TEACHER_NOTE ) {
			return true ;
		}

		let filteredBySelectedSections = false;
		if( $scope.sectionFilters.length > 0 ) {
			if( element.section != null ) {
				filteredBySelectedSections = true ;
				for( let i=0; i<$scope.sectionFilters.length; i++ ) {
					const selSec = $scope.sectionFilters[i];
					if( selSec.section === element.section ) {
						filteredBySelectedSections = false ;
						break ;
					}
				}
			}
		}
		if( filteredBySelectedSections ) {
			return false ;
		}

		for( let index=0; index<element.currentLevels.length; index++ ) {
			const curLevelOfACard = element.currentLevels[index];
			if( $scope.levels.indexOf( curLevelOfACard ) !== -1 ) {
				return true ;
			}
		}
		return false ;
	}

	// ---------------- End of controller ------------------------------------------
} ) ;



