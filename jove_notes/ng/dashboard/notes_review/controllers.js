dashboardApp.controller( 'NotesReviewController', function( $scope, $http, $sce ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var currentOpenedChapter = null ;

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Notes Review Page" ;
$scope.$parent.currentReport = 'Review' ;
$scope.reportTitle           = 'Notes Review' ;

$scope.chapters = [];

$scope.notesElements = [] ;
$scope.ng = new NEGroup() ;

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
        }
        currentOpenedChapter = chapter ;
    }

    if( chapter.open ) {
        callChapterNotesAPI( chapter.chapterId ) ;
    }
}

$scope.markReviewed = function( element ) {
    callNEReviewAPItoMarkReviewed( element.noteElementId, function(){
        var index = $scope.notesElements.indexOf( element ) ;
        $scope.notesElements.splice( index, 1 ) ;
        currentOpenedChapter.numReviewItems-- ;

        if( currentOpenedChapter.numReviewItems == 0 ) {
            index = $scope.chapters.indexOf( currentOpenedChapter ) ;
            $scope.chapters.splice( index, 1 ) ;
        }

        processNotesElements() ;
    } ) ;
}

// ---------------- Private functions ------------------------------------------
function processChapterList( chapterList ) {

    for( var index=0; index<chapterList.length; index++ ) {
        var chapter = chapterList[index] ;
        chapter.open = false ;
        $scope.chapters.push( chapter ) ;
    }
}

function processServerData( data ) {

    if( typeof data === "string" ) {
        log.error( "Server returned invalid data. " + data ) ;
        $scope.addErrorAlert( "Server returned invalid data. " + data ) ;
        return ;
    }
    
    neFormatter = new NotesElementFormatter( data.chapterDetails, $sce ) ;
    $scope.notesElements = data.notesElements ;

    $scope.ng.setFormatter( neFormatter ) ;

    processNotesElements() ;
}

function processNotesElements() {

    $scope.ng.reset() ;
    currentOpenedChapter.numReviewItems = $scope.notesElements.length ;

    for( index=0; index<$scope.notesElements.length; index++ ) {

        var element = $scope.notesElements[ index ] ;

        neFormatter.preProcessElement( element ) ;
        neFormatter.initializeScriptSupport( element ) ;

        $scope.ng.addNote( element ) ;
    }

    setTimeout( function(){
        MathJax.Hub.Queue( [ "Typeset", MathJax.Hub ] ) 
    }, 100 ) ;  
    setTimeout( hljs.initHighlighting, 100 ) ;
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

function callNEReviewAPItoMarkReviewed( notesElementId, callback ) {

    $http.post( '/jove_notes/api/NEReview', { 
        opType : 'mark_reviewed',
        noteElementId : notesElementId
    })
    .success( function( data ){
        log.debug( data ) ;
        callback() ;
    })
    .error( function( data ){
        var message = "Could not mark notes element " + notesElementId + " as reviewed." ;
        log.error( message ) ;
        log.error( "Server says - " + data ) ;
        $scope.addErrorAlert( message ) ;
    }) ;
}

function callChapterNotesAPI( chapterId ) {

    log.debug( "Requesting notes review data for chapter " + chapterId + "." ) ;
    $http.get( "/jove_notes/api/ChapterNotes/" + chapterId + "?elementType=marked_for_review" )
         .success( function( data ){
            processServerData( data ) ;
         })
         .error( function( data ){
            log.error( "Server returned error. " + data ) ;
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

// ---------------- End of controller ------------------------------------------
} ) ;
