<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

$pageConfig = array(
	"tab_title"  => "Chapter Notes"
) ;

define( "NOTES_TEMPLATE_PATH", "/apps/jove_notes/ng/notes/templates" ) ;
define( "WM_TEMPLATE_PATH",    NOTES_TEMPLATE_PATH . "/wm_template.html" ) ;
define( "QA_TEMPLATE_PATH",    NOTES_TEMPLATE_PATH . "/qa_template.html" ) ;

?>
<!DOCTYPE html>
<html ng-app="notesApp">
<head>
    <?php include( HEAD_CONTENT_FILE ); ?>
    <style>
    </style>
    <script src="/apps/jove_notes/ng/notes/routes.js"></script>    
    <script src="/apps/jove_notes/ng/notes/controllers.js"></script>    
</head>
<body ng-controller="NotesController">
    <?php include( SCROLL_NAVBAR_FILE ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <p>
    <div ng-if="wordMeanings.length">
        <div ng-include="'<?php echo WM_TEMPLATE_PATH ?>'">
        </div>
    </div>

    <div ng-if="questionAnswers.length">
        <div ng-include="'<?php echo QA_TEMPLATE_PATH ?>'">
        </div>
    </div>

</body>
</html>