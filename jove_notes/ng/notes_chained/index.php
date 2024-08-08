<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;

if( !isset( $_REQUEST['chapterIds'] ) ) {
    HTTPUtils::redirectTo( "/" ) ;
    return ;
}

global $log ;

$levels = "NS,L0" ;
if( isset( $_REQUEST['levels'] ) ) {
    $levels = explode( ",", $_REQUEST['levels'] ) ;
}

$requestedChapters         = explode( ",", $_REQUEST[ 'chapterIds' ] ) ;
$chapterIdForThisRequest   = $requestedChapters[0] ;
$remainingChapterIds       = null ;

if( count( $requestedChapters ) > 0 ) {
    array_shift( $requestedChapters ) ;
    $remainingChapterIds = $requestedChapters ;
}

$log->info( "Rendering notes for chapter " . $chapterIdForThisRequest .
            " and user " . ExecutionContext::getCurrentUserName() ) ;

// Check if the user has access to notes for the requested chapter.
$chapterDAO = new ChapterDAO() ;
$guard = $chapterDAO->getChapterGuard( $chapterIdForThisRequest ) ;
if( !Authorizer::hasAccess( $guard, "NOTES" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

// The user has access to notes of this chapter. Proceed with rendering of the page.
$pageConfig = array(
    "tab_title"  => "Chapter Notes"
) ;

define( "PHP_FRAGMENT_PATH",      DOCUMENT_ROOT . "php_fragments" ) ;
define( "NAVBAR_FRAGMENT_PATH",   DOCUMENT_ROOT . "/apps/jove_notes/ng/notes_chained/notes_navbar.php" ) ;
?>

<!DOCTYPE html>
<html ng-app="notesApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <link rel='stylesheet' href='/lib-ext/pure/tables.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/notes/css/notes.css'>

    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({ 
            TeX: { extensions: ["mhchem.js"] },
            displayAlign: "left"
        });
    </script>
    <script src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full"></script>
    <script src="/lib-ext/math/math.min.js"></script>    

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/script_utilities.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_imglabel.js"></script>

    <script src="/apps/jove_notes/ng/notes_chained/js/routes.js"></script>
    <script src="/apps/jove_notes/ng/notes_chained/js/controllers.js"></script>

    <script src="/apps/jove_notes/ng/notes/js/ne_formatter.js"></script>
    <script src="/apps/jove_notes/ng/notes/js/ne_group.js"></script>
    <script src="/apps/jove_notes/ng/notes/js/directives.js"></script>

    <script>
    var userName  = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = <?php echo $chapterIdForThisRequest ?> ;
    var levels    = '<?php echo implode( ",", $levels ) ?>' ;
    <?php
    if( $remainingChapterIds != null ) {
        echo "var remainingChapterIds = [" . implode( ",", $remainingChapterIds ) . "] ;\n" ;
    }
    else {
        echo "var remainingChapterIds = null ;\n" ;
    }
    ?>
    </script>
</head>

<body ng-controller="ChainedNotesController" onload="MathJax.Hub.Queue( ['Typeset', MathJax.Hub] )">

    <?php include( NAVBAR_FRAGMENT_PATH ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>

    <div ng-if="notesLayoutMode == 'linear'"
         ng-init="ng=linearNEGroup" 
         ng-include="'html_fragments/linear_layout.html'">
    </div>

    <div ng-if="notesLayoutMode == 'sections'">
         <div ng-repeat="ngGroup in sectionNEGroups">
            <h1 class="section-header">{{ngGroup.sectionName}}</h1>
            <div ng-init="ng=ngGroup.neGroup" 
                 ng-include="'html_fragments/linear_layout.html'"
                 style="padding-left: 20px;">
            </div>
         </div>
    </div>

    <a name="bottom"></a>
</body>

</html>