<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;

if( !isset( $_REQUEST['chapterId'] ) ) {
    HTTPUtils::redirectTo( "/" ) ;
    return ;
}

global $log ;
$log->info( "Rendering notes for chapter " . $_REQUEST[ 'chapterId' ] . 
            " and user " . ExecutionContext::getCurrentUserName() ) ;

// Check if the user has access to notes for the requested chapter.
$chapterDAO = new ChapterDAO() ;
$guard = $chapterDAO->getChapterGuard( $_REQUEST[ 'chapterId' ] ) ;
if( !Authorizer::hasAccess( $guard, "NOTES" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

// The user has access to notes of this chapter. Proceed with rendering of the page.
$pageConfig = array(
    "tab_title"  => "Chapter Notes"
) ;

define( "PHP_FRAGMENT_PATH",      DOCUMENT_ROOT . "php_fragments" ) ;
define( "NAVBAR_FRAGMENT_PATH",   DOCUMENT_ROOT . "/apps/jove_notes/ng/notes/notes_navbar.php" ) ;
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

    <script src="/apps/jove_notes/ng/notes/js/ne_formatter.js"></script>    
    <script src="/apps/jove_notes/ng/notes/js/ne_group.js"></script>    
    <script src="/apps/jove_notes/ng/notes/js/routes.js"></script>    
    <script src="/apps/jove_notes/ng/notes/js/directives.js"></script>    
    <script src="/apps/jove_notes/ng/notes/js/controllers.js"></script>    

    <script>
    var userName = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = <?php echo $_REQUEST[ 'chapterId' ] ?> ;
    </script>

    <script>
        let storage = new LocalStorageUtil() ;
        window.addEventListener( 'load', (event)=>{
            if( storage.isRemoteFlashPageOpen() ) {
                alert( "Close remote flash page first." ) ;
                window.open( "/apps/jove_notes/ng/dashboard/index.php#/ProgressSnapshot", "_self" ) ;
            }
            else {
                storage.storeTabOpenInfo( storage.NOTES_PAGE, chapterId ) ;
            }
        }) ;
        window.addEventListener( 'unload', (event)=>{
            storage.deleteTabOpenInfo( storage.NOTES_PAGE, chapterId ) ;
        }) ;
        window.addEventListener( 'pagehide', (event)=>{
            storage.deleteTabOpenInfo( storage.NOTES_PAGE, chapterId ) ;
        }) ;
    </script>
</head>

<body ng-controller="NotesController" onload="MathJax.Hub.Queue( ['Typeset', MathJax.Hub] )">

    <?php include( NAVBAR_FRAGMENT_PATH ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>

    <div ng-show="showFilterForm" ng-include="'html_fragments/filter_template.html'">
    </div>
    
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