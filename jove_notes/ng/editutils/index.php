<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

$pageConfig = array(
	"tab_title"  => "Latex Editor"
) ;

?>
<!DOCTYPE html>
<html ng-app="editUtilsApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>
    <?php include( MATHJAX_INCLUDE_FILE ); ?>

    <script src="/apps/jove_notes/ng/editutils/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/editutils/directives.js"></script>    
</head>

<body ng-controller="EditUtilsController">
    <?php include( ALERT_DIV_FILE ) ; ?>
    <div ng-include="'/apps/jove_notes/ng/editutils/fragments/latex_editor.html'">
    </div>
    <div ng-include="'/apps/jove_notes/ng/editutils/fragments/hindi_editor.html'">
    </div>
</body>

</html>