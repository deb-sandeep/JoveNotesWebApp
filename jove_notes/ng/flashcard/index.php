<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/learning_session_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/student_score_dao.php" ) ;

global $log ;

$firstShow = true ;
if( isset( $_REQUEST['firstShow'] ) ) {
    $firstShow = $_REQUEST[ 'firstShow' ] ;
}

if( !isset( $_REQUEST['chapterId'] ) ) {
    $log->warn( "chapterId not found as request paramter. Redirecting to home page." ) ;
    HTTPUtils::redirectTo( "/" ) ;
    return ;
}

$log->info( "Rendering flashcard for chapter " . $_REQUEST[ 'chapterId' ] . 
            " and user " . ExecutionContext::getCurrentUserName() ) ;

$requestedChapters         = explode( ",", $_REQUEST[ 'chapterId' ] ) ;
$chapterIdForThisSession   = $requestedChapters[0] ;
$chapterIdsForNextSessions = null ;

if( count( $requestedChapters ) > 0 ) {
    array_shift( $requestedChapters ) ;
    $chapterIdsForNextSessions = $requestedChapters ;
}

// Check if the user has access to flash cards for the requested chapter.
$chapterDAO = new ChapterDAO() ;
$guard = $chapterDAO->getChapterGuard( $chapterIdForThisSession ) ;
if( !Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

// If the user has access, we generate a new session identifier for this study
// session.
$learningSessionDAO = new LearningSessionDAO() ;
$sessionId = $learningSessionDAO->createNewSession( 
            ExecutionContext::getCurrentUserName(), $chapterIdForThisSession ) ;

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
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full"></script>

    <link rel='stylesheet' href='/lib-ext/pure/tables.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>

    <script src="/lib-ext/rgraph/RGraph.common.core.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.key.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.line.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.pie.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.bar.js"></script>    
    <script src="/lib-ext/math/math.min.js"></script>    

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/script_utilities.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/practice_page/question_handlers.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_matching.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_imglabel.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_spellbee.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_multichoice.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_voice2text.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/diff_av_time_manager.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/filters.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/directives.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/question_sorter.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/strategies.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/filtered_card_stats.js"></script> 

    <script src="/apps/jove_notes/ng/flashcard/start_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/practice_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/end_page/controllers.js"></script>

    <script>
    var userName  = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var firstShow = <?php echo $firstShow ?> ;
    var chapterId = <?php echo $chapterIdForThisSession ?> ;
    var sessionId = <?php echo $sessionId ?> ;
    var userScore = <?php echo $score ?> ;
    <?php
    if( $chapterIdsForNextSessions != null ) {
        echo "var chapterIdsForNextSessions = [" . implode( ",", $chapterIdsForNextSessions ) . "] ;\n" ;
    }
    else {
        echo "var chapterIdsForNextSessions = null ;\n" ;
    }
    ?>
    </script>
</head>

<body ng-controller="FlashCardController">
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>
  	<div class="ng-view"></div>	
    <div id="modalResume" class="modal fade" data-backdrop="static">
      <div class="modal-dialog" style="width:100px;height:100px;top:200px;">
        <div class="modal-content">
          <div class="modal-body" style="padding:0px">
            <button type="button" class="btn btn-info btn-lg" 
                    style="width:100px;height:100px;padding:3px" 
                    ng-click="resumeSession()">
              <span class="glyphicon glyphicon-play-circle" style="font-size: 5em" ></span>
            </button>
          </div>
        </div>
      </div>
      <div id="resume-page-turner-host-div"
           class="page-turner-ctrl-host">
        <button type="button"
                class="page-turner-button"
                ng-click="resumeSession()">
        </button>
      </div>
    </div>
</body>

</html>
