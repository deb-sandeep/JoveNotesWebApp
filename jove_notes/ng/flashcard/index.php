<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/learning_session_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/student_score_dao.php" ) ;

// Check if the user has access to flash cards for the requested chapter.
$chapterDAO = new ChapterDAO() ;
$guard = $chapterDAO->getChapterGuard( $_REQUEST[ 'chapterId' ] ) ;
if( !Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

// If the user has access, we generate a new session identifier for this study
// session.
$learningSessionDAO = new LearningSessionDAO() ;
$sessionId = $learningSessionDAO->createNewSession( 
            ExecutionContext::getCurrentUserName(), $_REQUEST[ 'chapterId' ] ) ;

$pageConfig = array(
	"tab_title"  => "Flash Card"
) ;

// Get the current score of the user
$scoreDAO = new StudentScoreDAO() ;
$score = $scoreDAO->getScore( ExecutionContext::getCurrentUserName() ) ;

?>
<!DOCTYPE html>
<html ng-app="flashCardApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({ TeX: { extensions: ["mhchem.js"] }});
    </script>
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>

    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>

    <script src="/lib-ext/rgraph/RGraph.common.core.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.key.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.line.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.pie.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.bar.js"></script>    

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/practice_page/question_handlers.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_matching.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_imglabel.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_spellbee.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/filters.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/directives.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/controllers.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/start_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/practice_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/end_page/controllers.js"></script>

    <script>
    var userName  = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = <?php echo $_REQUEST[ 'chapterId' ] ?> ;
    var sessionId = <?php echo $sessionId ?> ;
    var userScore = <?php echo $score ?> ;
    </script>
</head>

<body ng-controller="FlashCardController">
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>
  	<div class="ng-view"></div>	
</body>

</html>