dashboardApp.controller( 'NotesReviewController', function( $scope, $http ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var currentOpenedChapter = null ;

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Notes Review Page" ;
$scope.$parent.currentReport = 'Review' ;
$scope.reportTitle           = 'Notes Review' ;

$scope.chapters = [];

// ---------------- Main logic for the controller ------------------------------
// At the time of initialization, we ask the server to give us a list of chapters
// for which there are notes elements marked for review.
callNEReviewAPIForChapterList() ;

// ---------------- Controller methods -----------------------------------------
$scope.accordionTabClicked = function( chapter ) {

    chapter.open = !chapter.open ;
    if( chapter != currentOpenedChapter ) {
        if( currentOpenedChapter != null ) {
            currentOpenedChapter.open = false ;
            currentOpenedChapter.notesElements.length = 0 ;
        }
        currentOpenedChapter = chapter ;
    }

    if( chapter.open ) {
        callChapterNotesAPI( chapter.chapterId ) ;
    }
    else {
        chapter.notesElements.length = 0 ;
    }

    for( var index=0; index<$scope.chapters.length; index++ ) {
        var c = $scope.chapters[index] ;
        log.debug( "Chapter " + c.chapterNum + ":" + c.subChapterNum + " - " + c.open ) ;
    }
}

// ---------------- Private functions ------------------------------------------
function processChapterList( chapterList ) {

    for( var index=0; index<chapterList.length; index++ ) {

        var chapter = chapterList[index] ;
        chapter.open = false ;
        chapter.notesElements = [] ;

        $scope.chapters.push( chapter ) ;
    }
}

// ---------------- Server calls -----------------------------------------------
function callNEReviewAPIForChapterList() {

    $http.get( '/jove_notes/api/NEReview/ChapterList' )
    .success( function( data ){
        processChapterList( data ) ;
    })
    .error( function( data ){
        log.error( "API error " + data ) ;
        $scope.addErrorAlert( "API error " + data ) ;
    }) ;
}

function callChapterNotesAPI( chapterId ) {

    log.debug( "Requesting notes review data for chapter " + chapterId + "." ) ;
    $http.get( "/jove_notes/api/ChapterNotes/" + chapterId + "?elementType=marked_for_review" )
         .success( function( data ){
            log.debug( "Data received from server." + data ) ;
         })
         .error( function( data ){
            log.error( "Server returned error. " + data ) ;
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

// ---------------- End of controller ------------------------------------------
} ) ;
