dashboardApp.controller( 'NotesController', function( $scope, $http ) {
// -----------------------------------------------------------------------------
var QT_WM  = "word_meaning" ;
var QT_QA  = "question_answer" ;
var QT_FIB = "fib" ;

function FilterCriteria() {

	this.currentLevelFilters       = [ "NS", "L0", "L1",                   ] ;
	this.learningEfficiencyFilters = [ "A2", "B1", "B2", "C1", "C2", "D"   ] ;
	this.difficultyFilters =         [ "VE", "E",  "M",  "H",  "VH"        ] ;

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
		$.cookie( 'currentLevelFilters', this.currentLevelFilters,
			      { expires: 30 } ) ;

		$.cookie( 'learningEfficiencyFilters', this.learningEfficiencyFilters,
			      { expires: 30 } ) ;

		$.cookie( 'difficultyFilters', this.difficultyFilters,
			      { expires: 30 } ) ;
	}

	this.deserialize = function() {

		$.cookie.json = true ;
		if( typeof $.cookie( 'currentLevelFilters' ) != 'undefined' ) {
			this.currentLevelFilters = $.cookie( 'currentLevelFilters' ) ;
		} ;
		if( typeof $.cookie( 'learningEfficiencyFilters' ) != 'undefined' ) {
			this.learningEfficiencyFilters = $.cookie( 'learningEfficiencyFilters' ) ;
		} ;
		if( typeof $.cookie( 'difficultyFilters' ) != 'undefined' ) {
			this.difficultyFilters = $.cookie( 'difficultyFilters' ) ;
		} ;
	}
}

// -----------------------------------------------------------------------------
$scope.alerts             = [] ;
$scope.pageTitle          = null ;
$scope.showUserStatistics = false ;
$scope.showFilterForm     = false ;
$scope.filterCriteria     = new FilterCriteria() ;

var rawData = null ;

// These are the arrays that hold the questions which match the filter criteria
$scope.wordMeanings    = [] ;
$scope.questionAnswers = [] ;
$scope.fibs            = [] ;

$scope.filterCriteria.deserialize() ;
refreshData() ;

// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
function refreshData() {

	$http.get( "/jove_notes/api/ChapterNotes" )
         .success( function( data ){
         	rawData = data ;
         	applyFilterCriteria() ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function applyFilterCriteria() {
	constructPageTitle( rawData ) ;
	filterAndCategorizeQuestions( rawData.questions ) ;
}

function constructPageTitle( data ) {
	$scope.pageTitle = "[" + data.subjectName + "] " +
					   data.chapterNumber + "." + data.subChapterNumber + " - " +
	                   data.chapterName ;
}

function filterAndCategorizeQuestions( questions ) {

	$scope.wordMeanings.length    = 0 ;
	$scope.questionAnswers.length = 0 ;
	$scope.fibs.length            = 0 ;

	for( index=0; index<questions.length; index++ ) {

		var question = questions[ index ] ;
		var type     = question.questionType ;

		if( !question.hasOwnProperty( 'difficultyLevelLabel' ) ) {
			injectLabelsForValues( question ) ;
		}

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

function injectLabelsForValues( question ) {

	question.difficultyLevelLabel = 
		getDifficultyLevelLabel( question.difficultyLevel ) ;

	question.learningEfficiencyLabel = 
		getLearningEfficiencyLabel( question.learningStats.learningEfficiency ) ;
}

function getDifficultyLevelLabel( level ) {

	if     ( level >= 0  && level < 30 ) { return "VE" ; }
	else if( level >= 30 && level < 50 ) { return "E"  ; }
	else if( level >= 50 && level < 70 ) { return "M"  ; }
	else if( level >= 70 && level < 85 ) { return "H"  ; }
	return "VH" ;
}

function getLearningEfficiencyLabel( score ) {

	if      ( score >= 90 && score <= 100 ) { return "A1" ; }
	else if ( score >= 80 && score <  90  ) { return "A2" ; }
	else if ( score >= 70 && score <  80  ) { return "B1" ; }
	else if ( score >= 60 && score <  70  ) { return "B2" ; }
	else if ( score >= 50 && score <  60  ) { return "C1" ; }
	else if ( score >= 40 && score <  50  ) { return "C2" ; }
	else                                    { return "D"  ; }
}

// -----------------------------------------------------------------------------
} ) ;



