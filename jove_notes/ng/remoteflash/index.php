<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/chapter_dao.php" ) ;

// Check if the user has access to use remote flash card feature
if( !Authorizer::hasAccess( "feature:RemoteFlash", "USE" ) ) {
    HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
    return ;
}

global $log ;
$log->info( "Rendering remote flash for user " . ExecutionContext::getCurrentUserName() ) ;

$pageConfig = array(
	"tab_title"  => "Remote Flash Client"
) ;

?>
<!DOCTYPE html>
<html ng-app="remoteFlashCardApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <style>
        .jumbotron {
            background: #000 ;
            color: #C2C2C2;
        }    

        .flashcardbody {
            position:fixed;
            left:0px;
            top:75px;
            bottom:0px;
            width:100%;
            padding:0px;
            overflow-x: auto;
            overflow-y: auto;
        }        
    </style>

    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({ TeX: { extensions: ["mhchem.js"] }});
    </script>
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full"></script>

    <link rel='stylesheet' href='/lib-ext/pure/tables.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>
    <link rel='stylesheet' href='/apps/jove_notes/ng/remoteflash/remoteflash.css'>

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

    <script src="/apps/jove_notes/ng/remoteflash/routes.js"></script>    
    <script src="/apps/jove_notes/ng/remoteflash/filters.js"></script>    
    <script src="/apps/jove_notes/ng/remoteflash/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/remoteflash/directives.js"></script>    

    <script>
    var userName  = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    </script>

    <script>
        let storage = new LocalStorageUtil() ;
        window.addEventListener( 'load', (event)=>{
            if( storage.isAnyPageOpen( [storage.NOTES_PAGE, storage.PRINT_NOTES_PAGE, storage.CHAINED_NOTES_PAGE] ) ) {
                alert( "Close all notes, print notes and review notes pages first." ) ;
                window.open( "/apps/jove_notes/ng/dashboard/index.php#/ProgressSnapshot", "_self" ) ;
            }
            else {
                storage.storeTabOpenInfo( storage.REMOTE_FLASH_PAGE ) ;
            }
        }) ;
        window.addEventListener( 'beforeunload', (event)=>{
            storage.deleteTabOpenInfo( storage.REMOTE_FLASH_PAGE ) ;
        }) ;
        window.addEventListener( 'pagehide', (event)=>{
            storage.deleteTabOpenInfo( storage.REMOTE_FLASH_PAGE ) ;
        }) ;
        window.addEventListener( 'beforeunload', (event)=>{
            storage.deleteTabOpenInfo( storage.REMOTE_FLASH_PAGE ) ;
        }) ;
    </script>
</head>

<body ng-controller="RemoteFlashCardController">
    <?php include( ALERT_DIV_FILE ) ; ?>
    <audio id="audio"></audio>
    <div ng-show="currentScreen == LAUNCH_PAGE" class="ng-hide"
         ng-include="'/apps/jove_notes/ng/remoteflash/fragments/launch_page.html'">
    </div>
    <div ng-show="currentScreen == SCREEN_WAITING_TO_START" class="ng-hide"
         ng-include="'/apps/jove_notes/ng/remoteflash/fragments/waiting_to_start.html'">
    </div>
    <div ng-show="currentScreen == SCREEN_SESSION_SETTINGS" class="ng-hide"
         ng-include="'/apps/jove_notes/ng/remoteflash/fragments/session_settings.html'">
    </div>
    <div ng-show="currentScreen == SCREEN_PRACTICE" class="ng-hide"
         ng-include="'/apps/jove_notes/ng/remoteflash/fragments/session_practice.html'">
    </div>
    <div ng-show="currentScreen == SCREEN_SESSION_END" class="ng-hide"
         ng-include="'/apps/jove_notes/ng/remoteflash/fragments/session_end.html'">
    </div>

    <div id="modalResume" class="modal fade" data-backdrop="static">
      <div class="modal-dialog" style="width:80px;height:95px;top:200px;">
        <div class="modal-content">
          <div class="modal-body" style="padding:2px">
              <span class="glyphicon glyphicon-play-circle" style="font-size: 5em;color: #FF0000"></span>
          </div>
        </div>
      </div>
    </div>
</body>

</html>