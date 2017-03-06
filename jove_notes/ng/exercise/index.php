<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

global $log ;

if( !isset( $_REQUEST['chapterId'] ) ) {
    $log->warn( "chapterId not found as request parameter. Redirecting to home page." ) ;
    HTTPUtils::redirectTo( "/" ) ;
    return ;
}

$log->info( "Rendering exercise for chapter " . $_REQUEST[ 'chapterId' ] . 
            " and user " . ExecutionContext::getCurrentUserName() ) ;

$pageConfig = array(
    "tab_title"  => "Exercise"
) ;

?>
<!DOCTYPE html>
<html ng-app="exerciseApp">
<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({ TeX: { extensions: ["mhchem.js"] }});
    </script>
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full"></script>

    <script src="/lib-ext/rgraph/RGraph.common.core.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.key.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.line.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.pie.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.bar.js"></script>    
    <script src="/lib-ext/bootbox/bootbox.min.js"></script>

    <link rel='stylesheet' href='/lib-ext/pure/tables.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/exercise/exercise.css'>

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/script_utilities.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/practice_page/question_handlers.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_matching.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_imglabel.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_spellbee.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_multichoice.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/dynq_exercise.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/practice_page/diff_av_time_manager.js"></script>    

    <script src="/apps/jove_notes/ng/exercise/routes.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/filters.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/directives.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/controller.js"></script>    

    <script src="/apps/jove_notes/ng/exercise/ex_configure/controller.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/ex_execute/controller.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/ex_evaluate/controller.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/ex_summary/controller.js"></script>    
    <script src="/apps/jove_notes/ng/exercise/ex_list/controller.js"></script>    

    <script>
    var userName   = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterIds = '<?php echo $_REQUEST[ "chapterId" ] ?>' ;
    </script>
</head>

<body ng-controller="ExerciseController">
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
              <span class="glyphicon glyphicon-play-circle" style="font-size: 5em">
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
</body>
</html>