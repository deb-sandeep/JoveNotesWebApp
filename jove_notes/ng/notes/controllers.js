dashboardApp.controller( 'NotesController', function( $scope, $http ) {
// -----------------------------------------------------------------------------
var QT_WM = "word_meaning" ;
var QT_QA = "question_answer" ;

function FilterCriteria() {

	this.msg = "This is the filter criteria" ;
	this.currentLevelFilters = [ "NS", "L0", "L1", "L2", "L3", "MAS" ] ;

	this.currentLevelOptions = [ 
		{ id : "NS",  name : "Not started" },
		{ id : "L0",  name : "Level 0" },
		{ id : "L1",  name : "Level 1" },
		{ id : "L2",  name : "Level 2" },
		{ id : "L3",  name : "Level 3" },
		{ id : "MAS", name : "Mastered"}
	] ;
}

// -----------------------------------------------------------------------------
$scope.alerts             = [] ;
$scope.pageTitle          = null ;
$scope.showUserStatistics = true ;
$scope.showFilterForm     = true ;
$scope.filterCriteria     = new FilterCriteria() ;

var rawData = null ;

// These are the arrays that hold the questions which match the filter criteria
$scope.wordMeanings    = [] ;
$scope.questionAnswers = [] ;

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

// -----------------------------------------------------------------------------
function refreshData() {

	$http.get( "/jove_notes/api/ChapterNotes" )
         .success( function( data ){
         	prepareControllerData( data ) ;
         })
         .error( function( data ){
         	$scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

function prepareControllerData( data ) {
	rawData = data ;
	constructPageTitle( data ) ;
	categorizeQuestions( data.questions ) ;
}

function constructPageTitle( data ) {
	$scope.pageTitle = "[" + data.subjectName + "] " +
					   data.chapterNumber + "." + data.subChapterNumber + " - " +
	                   data.chapterName ;
}

function categorizeQuestions( questions ) {

	for( index=0; index<questions.length; index++ ) {

		var question = questions[ index ] ;
		var type     = question.questionType ;

		injectLabelsForValues( question ) ;

		if( type == QT_WM ) {
			$scope.wordMeanings.push( question ) ;
		}
		else if( type == QT_QA ) {
			$scope.questionAnswers.push( question ) ;
		}
	}
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



