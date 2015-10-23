dashboardApp.controller( 'NotesReviewController', function( $scope, $http, $sce ) {

// ---------------- Constants and inner class definition -----------------------

// ---------------- Local variables --------------------------------------------
var currentOpenedChapter = null ;

// ---------------- Controller variables ---------------------------------------
$scope.$parent.pageTitle     = "Notes Review Page" ;
$scope.$parent.currentReport = 'Review' ;
$scope.reportTitle           = 'Notes Review' ;

$scope.chapters = [];

$scope.wordMeanings          = [] ;
$scope.questionAnswers       = [] ;
$scope.fibs                  = [] ;
$scope.definitions           = [] ;
$scope.characters            = [] ;
$scope.teacherNotes          = [] ;
$scope.matchings             = [] ;
$scope.events                = [] ;
$scope.trueFalseStatements   = [] ;
$scope.chemEquations         = [] ;
$scope.chemCompounds         = [] ;
$scope.spellbeeWords         = [] ;
$scope.imageLabels           = [] ;
$scope.equations             = [] ;
$scope.referenceToContexts   = [] ;
$scope.multiChoiceQuestions  = [] ;

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

function processServerData( data ) {

    if( typeof data === "string" ) {
        log.error( "Server returned invalid data. " + data ) ;
        $scope.addErrorAlert( "Server returned invalid data. " + data ) ;
        return ;
    }
    
    neFormatter = new NotesElementFormatter( data.chapterDetails, $sce ) ;
    processNotesElements( data.notesElements ) ;
    setTimeout( hljs.initHighlighting, 1000 ) ;
}

function processNotesElements( notesElements ) {

    // Reset all the arrrays before we fill them with filtered contents
    $scope.wordMeanings.length          = 0 ;
    $scope.questionAnswers.length       = 0 ;
    $scope.fibs.length                  = 0 ;
    $scope.definitions.length           = 0 ;
    $scope.characters.length            = 0 ;
    $scope.teacherNotes.length          = 0 ;
    $scope.matchings.length             = 0 ;
    $scope.events.length                = 0 ;
    $scope.trueFalseStatements.length   = 0 ;
    $scope.chemEquations.length         = 0 ;
    $scope.chemCompounds.length         = 0 ;
    $scope.spellbeeWords.length         = 0 ;
    $scope.imageLabels.length           = 0 ;
    $scope.equations.length             = 0 ;
    $scope.referenceToContexts.length   = 0 ;
    $scope.multiChoiceQuestions.length  = 0 ;

    for( index=0; index<notesElements.length; index++ ) {

        var element = notesElements[ index ] ;
        var type    = element.elementType ;

        neFormatter.preProcessElement( element ) ;
        neFormatter.initializeScriptSupport( element ) ;

        if( type == NotesElementsTypes.prototype.WM ) {
            $scope.wordMeanings.push( neFormatter.formatWM( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.QA ) {
            $scope.questionAnswers.push( neFormatter.formatQA( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.FIB ) {
            $scope.fibs.push( neFormatter.formatFIB( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.DEFINITION ) {
            $scope.definitions.push( neFormatter.formatDefinition( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHARACTER ) {
            $scope.characters.push( neFormatter.formatCharacter( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.TEACHER_NOTE ) {
            $scope.teacherNotes.push( neFormatter.formatTeacherNote( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.MATCHING ) {
            $scope.matchings.push( neFormatter.formatMatching( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.EVENT ) {
            $scope.events.push( neFormatter.formatEvent( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.TRUE_FALSE ) {
            $scope.trueFalseStatements.push( neFormatter.formatTrueFalse( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHEM_EQUATION ) {
            $scope.chemEquations.push( neFormatter.formatChemEquation( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.CHEM_COMPOUND ) {
            $scope.chemCompounds.push( neFormatter.formatChemCompound( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.SPELLBEE ) {
            $scope.spellbeeWords.push( neFormatter.formatSpellbeeWord( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.IMAGE_LABEL ) {
            $scope.imageLabels.push( neFormatter.formatImageLabel( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.EQUATION ) {
            $scope.equations.push( neFormatter.formatEquation( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.REF_TO_CONTEXT ) {
            $scope.referenceToContexts.push( neFormatter.formatRTC( element ) ) ;
        }
        else if( type == NotesElementsTypes.prototype.MULTI_CHOICE ) {
            $scope.multiChoiceQuestions.push( neFormatter.formatMultiChoiceQuestion( element ) ) ;
        }
    }

    setTimeout( function(){
        MathJax.Hub.Queue( [ "Typeset", MathJax.Hub ] ) 
    }, 100 ) ;    
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
            processServerData( data ) ;
         })
         .error( function( data ){
            log.error( "Server returned error. " + data ) ;
            $scope.addErrorAlert( "API call failed. " + data ) ;
         });
}

// ---------------- End of controller ------------------------------------------
} ) ;
