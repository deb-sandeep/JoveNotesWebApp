dashboardApp.controller( 'NotesController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------
var QT_WM  = "word_meaning" ;
var QT_QA  = "question_answer" ;
var QT_FIB = "fib" ;

function FilterCriteria() {

	this.currentLevelFilters       = [ "NS", "L0", "L1",                 ] ;
	this.learningEfficiencyFilters = [ "A2", "B1", "B2", "C1", "C2", "D" ] ;
	this.difficultyFilters         = [ "VE", "E",  "M",  "H",  "VH"      ] ;

	this.currentLevelOptions = [ 
		{ id : "NS",  name : "Not started" },
		{ id : "L0",  name : "Level 0" },
		{ id : "L1",  name : "Level 1" },
		{ id : "L2",  name : "Level 2" },
		{ id : "L3",  name : "Level 3" },
		{ id : "MAS", name : "Mastered"}
	] ;

	this.learningEfficiencyOptions = [
		{ id : "A1", name : "A1" },
		{ id : "A2", name : "A2" },
		{ id : "B1", name : "B1" },
		{ id : "B2", name : "B2" },
		{ id : "C1", name : "C1" },
		{ id : "C2", name : "C2" },
		{ id : "D" , name : "D"  }
	] ;

	this.difficultyOptions = [
		{ id : "VE", name : "Very easy" },
		{ id : "E",  name : "Easy" },
		{ id : "M",  name : "Moderate" },
		{ id : "H",  name : "Hard" },
		{ id : "VH", name : "Very hard" }
	] ;

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
}

// ---------------- Local variables --------------------------------------------
var jnUtil = new JoveNotesUtil() ;

// ---------------- Controller variables ---------------------------------------
$scope.alerts             = [] ;
$scope.chapterId          = chapterId ;
$scope.pageTitle          = null ;
$scope.showUserStatistics = false ;
$scope.showFilterForm     = false ;
$scope.filterCriteria     = new FilterCriteria() ;

// The deserialized chapter data as returned by the API
$scope.chapterData = null ;

// These are the arrays that hold the questions which match the filter criteria
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

         	jnUtil.associateLearningStatsToQuestions( 
         		                    data[0].questions, data[1].learningStats ) ;

         	$scope.chapterData  = data[0] ;
			$scope.pageTitle    = jnUtil.constructPageTitle( data[0] ) ;

         	applyFilterCriteria() ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function applyFilterCriteria() {

	var questions = $scope.chapterData.questions ;

	// Reset all the arrrays before we fill them with filtered contents
	$scope.wordMeanings.length    = 0 ;
	$scope.questionAnswers.length = 0 ;
	$scope.fibs.length            = 0 ;

	for( index=0; index<questions.length; index++ ) {

		var question = questions[ index ] ;
		var type     = question.questionType ;

		if( qualifiesFilter( question ) ) {
			if( type == QT_WM ) {
				$scope.wordMeanings.push( question ) ;
			}
			else if( type == QT_QA ) {
				$scope.questionAnswers.push( question ) ;
			}
			else if( type == QT_FIB ) {
				injectFIBFormattedText( question ) ;
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



