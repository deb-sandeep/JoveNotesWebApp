<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

$pageConfig = array(
	"tab_title"  => "Chapter Notes"
) ;
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
    This is the notes page.<p>
    This is the notes page.<p>
</body>
</html>