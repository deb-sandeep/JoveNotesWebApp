dashboardApp.controller( 'NotesController', function( $scope, $http ) {
// -----------------------------------------------------------------------------
var QT_WM = "word_meaning" ;
var QT_QA = "question_answer" ;

$scope.alerts     = [] ;
$scope.pageTitle  = null ;

var rawData = null ;

$scope.wordMeanings = [] ;
$scope.questionAnswers = [] ;

refreshData() ;

// -----------------------------------------------------------------------------
$scope.addErrorAlert = function( msgString ) {
	$scope.alerts.push( { type: 'danger', msg: msgString } ) ;
}

$scope.closeAlert = function(index) {
	$scope.alerts.splice(index, 1);
};

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
		var type = question.questionType ;

		if( type == QT_WM ) {
			$scope.wordMeanings.push( question ) ;
		}
		else if( type == QT_QA ) {
			$scope.questionAnswers.push( question ) ;
		}
	}
}
// -----------------------------------------------------------------------------
} ) ;



