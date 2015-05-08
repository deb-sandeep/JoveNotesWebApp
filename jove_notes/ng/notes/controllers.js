notesApp.controller( 'NotesController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

	this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
	this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;

    this.serialize = function() {
        $.cookie.json = true ;
        $.cookie( 'notesCriteria-' + $scope.chapterId, this, { expires: 30 } ) ;
    }

    this.deserialize = function() {
        $.cookie.json = true ;
        var crit = $.cookie( 'notesCriteria-' + $scope.chapterId ) ;
        if( typeof crit != 'undefined' ) {
	        log.debug( "Deserialized filter criteria." ) ;
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

// ---------------- Main logic for the controller ------------------------------
{
	log.debug( "Executing NotesController." ) ;
	$scope.filterCriteria.deserialize() ;
	refreshData() ;
}

// ---------------- Controller methods -----------------------------------------
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

// ---------------- Private functions ------------------------------------------
function refreshData() {

	log.debug( "Requesting notes data from server." ) ;
	$http.get( "/jove_notes/api/ChapterNotes" )
         .success( function( data ){
         	log.debug( "Data received from server." ) ;
         	processServerData( data ) ;
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
	
 	// formatter.createAndInjectFormattedText( data[0] ) ;

 	$scope.chapterDetails = data.chapterDetails ;
 	$scope.notesElements  = data.notesElements ;

	$scope.pageTitle = jnUtil.constructPageTitle( data.chapterDetails ) ;
	log.debug( "Page title = " + $scope.pageTitle ) ;

	textFormatter = new TextFormatter( data.chapterDetails ) ;
 	processNotesElements() ;
}

function processNotesElements() {

	log.debug( "Processing notes elements." ) ;

	// Reset all the arrrays before we fill them with filtered contents
	$scope.filteredNotesElements.length = 0 ;

	$scope.wordMeanings.length      = 0 ;
	$scope.questionAnswers.length   = 0 ;
	$scope.fibs.length              = 0 ;

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
		}
		else {
			log.debug( "Note element " + element.noteElementId + 
				       " did not meet filter criteria." ) ;
		}
	}
}

function qualifiesFilter( element ) {

	var jnUtil = new JoveNotesUtil() ;

	element.difficultyLabel = 
		jnUtil.getDifficultyLevelLabel( element.difficultyLevel ) ;

	element.learningStats.efficiencyLabel = 
		jnUtil.getLearningEfficiencyLabel( element.learningStats.learningEfficiency ) ;

	var lrnEffLabelFilters = $scope.filterCriteria.learningEfficiencyFilters ;
	var diffLabelFilters   = $scope.filterCriteria.difficultyFilters ;

	if( lrnEffLabelFilters.indexOf( element.learningStats.efficiencyLabel ) != -1 ) {
		if( diffLabelFilters.indexOf( element.difficultyLabel ) != -1 ) {
			return true ;
		}
	}
	return false ;
}

function formatWM( wmElement ){
	return wmElement ;
}

function formatFIB( fibElement ){
	
	var formattedAnswer = "&ctdot;&nbsp;" + fibElement.question ;
	var numBlanks       = fibElement.answers.length ;

	for( var i=0; i<numBlanks; i++ ) {
		var strToReplace = "{" + i + "}" ;
		var replacedText = "<code>" + fibElement.answers[i] + "</code>" ;

		formattedAnswer   = formattedAnswer.replace( strToReplace, replacedText ) ;
	}
	fibElement.question = formattedAnswer ;

	return fibElement ;
}

function formatQA( qaElement ){
	qaElement.question = textFormatter.format( qaElement.question ) ;
	qaElement.answer = textFormatter.format( qaElement.answer ) ;

	return qaElement ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



