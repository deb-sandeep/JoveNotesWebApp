<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

// TODO - Authorization check for chapterId

$pageConfig = array(
	"tab_title"  => "Chapter Notes"
) ;

define( "HTML_FRAGMENT_PATH",   "/apps/jove_notes/ng/notes/html_fragments" ) ;
define( "WM_FRAGMENT_PATH",     HTML_FRAGMENT_PATH . "/wm_template.html" ) ;
define( "QA_FRAGMENT_PATH",     HTML_FRAGMENT_PATH . "/qa_template.html" ) ;
define( "FIB_FRAGMENT_PATH",    HTML_FRAGMENT_PATH . "/fib_template.html" ) ;
define( "FILTER_FRAGMENT_PATH", HTML_FRAGMENT_PATH . "/filter_template.html" ) ;
define( "DEFN_FRAGMENT_PATH",   HTML_FRAGMENT_PATH . "/definition_template.html" ) ;
define( "CHAR_FRAGMENT_PATH",   HTML_FRAGMENT_PATH . "/character_template.html" ) ;
define( "TN_FRAGMENT_PATH",     HTML_FRAGMENT_PATH . "/teacher_note_template.html" ) ;
define( "MATCH_FRAGMENT_PATH",  HTML_FRAGMENT_PATH . "/matching_template.html" ) ;
define( "EVENT_FRAGMENT_PATH",  HTML_FRAGMENT_PATH . "/event_template.html" ) ;
define( "TF_FRAGMENT_PATH",     HTML_FRAGMENT_PATH . "/true_false_template.html" ) ;

define( "PHP_FRAGMENT_PATH",    DOCUMENT_ROOT . "/apps/jove_notes/ng/notes/php_fragments" ) ;
define( "NAVBAR_FRAGMENT_PATH", PHP_FRAGMENT_PATH . "/notes_navbar.php" ) ;
?>

<!DOCTYPE html>
<html ng-app="notesApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>

    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    

    <script src="/apps/jove_notes/ng/notes/routes.js"></script>    
    <script src="/apps/jove_notes/ng/notes/filters.js"></script>    
    <script src="/apps/jove_notes/ng/notes/controllers.js"></script>    

    <script>
    var userName = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = <?php echo $_REQUEST[ 'chapterId' ] ?> ;
    </script>
</head>

<body ng-controller="NotesController">
    <?php include( NAVBAR_FRAGMENT_PATH ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <div ng-show="showFilterForm" ng-include="'<?php echo FILTER_FRAGMENT_PATH ?>'">
    </div>
    <p>
    <div ng-if="wordMeanings.length">
        <div ng-include="'<?php echo WM_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="fibs.length">
        <div ng-include="'<?php echo FIB_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="definitions.length">
        <div ng-include="'<?php echo DEFN_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="characters.length">
        <div ng-include="'<?php echo CHAR_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="teacherNotes.length">
        <div ng-include="'<?php echo TN_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="matchings.length">
        <div ng-include="'<?php echo MATCH_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="events.length">
        <div ng-include="'<?php echo EVENT_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="trueFalseStatements.length">
        <div ng-include="'<?php echo TF_FRAGMENT_PATH ?>'"></div>
    </div>

    <div ng-if="questionAnswers.length">
        <div ng-include="'<?php echo QA_FRAGMENT_PATH ?>'"></div>
    </div>
</body>

</html>