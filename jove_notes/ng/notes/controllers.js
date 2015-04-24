dashboardApp.controller( 'NotesController', function( $scope, $http ) {
// -----------------------------------------------------------------------------

$scope.alerts     = [] ;
$scope.pageTitle  = null ;

$scope.wordMeanings = [] ;

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
	constructPageTitle( data ) ;
}

function constructPageTitle( data ) {
	$scope.pageTitle = "[" + data.subjectName + "] " +
					   data.chapterNumber + "." + data.subChapterNumber + " - " +
	                   data.chapterName ;
}
// -----------------------------------------------------------------------------
} ) ;



