<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;
// require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/learning_session_dao.php" ) ;

global $log ;

if( !isset( $_REQUEST['chapterId'] ) ) {
    $log->warn( "chapterId not found as request paramter. Redirecting to home page." ) ;
    HTTPUtils::redirectTo( "/" ) ;
    return ;
}

$log->info( "Rendering test paper for chapter " . $_REQUEST[ 'chapterId' ] . 
            " and user " . ExecutionContext::getCurrentUserName() ) ;

// Check if the user has access to test paper for the requested chapter.
$chapterDAO = new ChapterDAO() ;
$guard = $chapterDAO->getChapterGuard( $_REQUEST['chapterId'] ) ;
if( !Authorizer::hasAccess( $guard, "TEST_PAPER" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

// If the user has access, we generate a new test session identifier for this study
// session.
$sessionId = 0 ;
// $learningSessionDAO = new LearningSessionDAO() ;
// $sessionId = $learningSessionDAO->createNewSession( 
//             ExecutionContext::getCurrentUserName(), $chapterIdForThisSession ) ;

$pageConfig = array(
    "tab_title"  => "Test Paper"
) ;

?>
<!DOCTYPE html>
<html ng-app="testPaperApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({ TeX: { extensions: ["mhchem.js"] }});
    </script>
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>

    <link rel='stylesheet' href='/lib-ext/pure/tables.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/test_paper/test_paper.css'>

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/script_utilities.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/practice_page/question_handlers.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_matching.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_imglabel.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_spellbee.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_multichoice.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/diff_av_time_manager.js"></script>    

    <script src="/apps/jove_notes/ng/test_paper/routes.js"></script>    
    <script src="/apps/jove_notes/ng/test_paper/directives.js"></script>    
    <script src="/apps/jove_notes/ng/test_paper/controllers.js"></script>    

    <script>
    var userName  = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = <?php echo $_REQUEST['chapterId'] ?> ;
    var sessionId = <?php echo $sessionId ?> ;
    </script>
</head>

<body ng-controller="TestPaperController">
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>
    <a name="top"></a>

    <!-- The start screen, where we show the jumbotron -->
    <div class="test_paper_start_screen" 
         ng-show="sessionState == STATE_YET_TO_START"
         ng-include="'/apps/jove_notes/ng/test_paper/fragments/start_screen.html'">
    </div>

    <!-- The test screen -->
    <div class="test_paper_body"
         ng-hide="sessionState == STATE_YET_TO_START" 
         ng-include="'/apps/jove_notes/ng/test_paper/fragments/test_body.html'">
    </div>

    <div class="test_paper_footer"
         ng-hide="sessionState == STATE_YET_TO_START" 
         ng-include="'/apps/jove_notes/ng/test_paper/fragments/test_footer.html'">
    </div>
</body>
</html>