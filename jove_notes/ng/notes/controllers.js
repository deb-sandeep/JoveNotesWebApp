dashboardApp.controller( 'NotesController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------
function FilterCriteria() {

	this.currentLevelFilters       = [ "NS", "L0", "L1", "L2", "L3", "MAS" ] ;
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
			this.currentLevelFilters       = crit.currentLevelFilters ;
			this.learningEfficiencyFilters = crit.learningEfficiencyFilters ;
			this.difficultyFilters         = crit.difficultyFilters ;
        } ;
    }

    this.setDefaultCriteria = function() {
		this.currentLevelFilters       = [ "NS", "L0", "L1", "L2", "L3", "MAS" ] ;
		this.learningEfficiencyFilters = [ "A1", "A2", "B1", "B2", "C1", "C2", "D" ] ;
		this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH" ] ;
    }
}

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;
var formatter = new QuestionFormatter() ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts             = [] ;
$scope.userName           = userName ;
$scope.chapterId          = chapterId ;
$scope.pageTitle          = null ;
$scope.showUserStatistics = false ;
$scope.showFilterForm     = false ;
$scope.filterCriteria     = new FilterCriteria() ;
$scope.filterOptions      = new NotesFilterOptions() ;

// The deserialized chapter data as returned by the API
$scope.chapterData = null ;

// These are the arrays that hold the questions which match the filter criteria
$scope.filteredQuestions = [] ;
$scope.wordMeanings    = [] ;
$scope.questionAnswers = [] ;
$scope.fibs            = [] ;

// ---------------- Main logic for the controller ------------------------------
$scope.filterCriteria.deserialize() ;
refreshData() ;

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
	applyFilterCriteria() ;
}

$scope.cancelFilter = function() {
	$scope.showFilterForm = false ;
	$scope.filterCriteria.deserialize() ;
}

// ---------------- Private functions ------------------------------------------
function refreshData() {

	$http.get( "/jove_notes/api/ChapterNotes" )
         .success( function( data ){
         	processServerData( data ) ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function processServerData( data ) {

	if( typeof data === "string" ) {
		$scope.addErrorAlert( "Server returned invalid data. " + data ) ;
		return ;
	}
	
 	formatter.createAndInjectFormattedText( data[0] ) ;
 	jnUtil.associateLearningStatsToQuestions( 
 		                    data[0].questions, data[1].learningStats ) ;

 	$scope.chapterData  = data[0] ;
	$scope.pageTitle    = jnUtil.constructPageTitle( data[0] ) ;

 	applyFilterCriteria() ;
}

function applyFilterCriteria() {

	var questions = $scope.chapterData.questions ;

	// Reset all the arrrays before we fill them with filtered contents
	$scope.filteredQuestions.length      = 0 ;
	$scope.wordMeanings.length    = 0 ;
	$scope.questionAnswers.length = 0 ;
	$scope.fibs.length            = 0 ;

	for( index=0; index<questions.length; index++ ) {

		var question = questions[ index ] ;
		var type     = question.questionType ;

		if( qualifiesFilter( question ) ) {

			$scope.filteredQuestions.push( question ) ;

			if( type == QuestionTypes.prototype.QT_WM ) {
				$scope.wordMeanings.push( question ) ;
			}
			else if( type == QuestionTypes.prototype.QT_QA ) {
				$scope.questionAnswers.push( question ) ;
			}
			else if( type == QuestionTypes.prototype.QT_FIB ) {
				$scope.fibs.push( question ) ;
			}
		}
	}
}

function injectFIBFormattedText( question ) {

	if( !question.hasOwnProperty( 'formattedText' ) ) {
		
		var formattedText = "&ctdot;&nbsp;" + question.question ;
		var numBlanks = question.answers.length ;

		for( i=0; i<numBlanks; i++ ) {
			var strToReplace = "{" + i + "}" ;
			var replacedText = "<code>" + question.answers[i] + "</code>" ;

			formattedText = formattedText.replace( strToReplace, replacedText ) ;
		}
		question.formattedText = formattedText ;
	}
}

function qualifiesFilter( question ) {

	var currentLevel = question.learningStats.currentLevel ;
	var lrnEffLabel  = question.learningEfficiencyLabel ;
	var diffLabel    = question.difficultyLevelLabel ;

	var currentLevelFilters = $scope.filterCriteria.currentLevelFilters ;
	var lrnEffLabelFilters  = $scope.filterCriteria.learningEfficiencyFilters ;
	var diffLabelFilters    = $scope.filterCriteria.difficultyFilters ;

	if( currentLevelFilters.indexOf( currentLevel ) != -1 ) {
		if( lrnEffLabelFilters.indexOf( lrnEffLabel ) != -1 ) {
			if( diffLabelFilters.indexOf( diffLabel ) != -1 ) {
				return true ;
			}
		}
	}
	return false ;
}

// ---------------- End of controller ------------------------------------------
} ) ;



