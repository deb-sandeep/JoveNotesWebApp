<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;

$pageConfig = array(
	"tab_title"  => "Flash Card"
) ;
?>
<!DOCTYPE html>
<html ng-app="flashCardApp">

<head>
    <?php include( HEAD_CONTENT_FILE ); ?>
    <link rel='stylesheet' href='/apps/jove_notes/ng/flashcard/flashcard.css'>

    <script src="/lib-ext/rgraph/RGraph.common.core.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.key.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.line.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.pie.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.bar.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/flashcard/controllers.js"></script>    

    <script src="/apps/jove_notes/ng/flashcard/start_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/practice_page/controllers.js"></script>
    <script src="/apps/jove_notes/ng/flashcard/end_page/controllers.js"></script>

    <script>
    var userName = '<?php echo ExecutionContext::getCurrentUserName() ?>' ;
    var chapterId = 23 ; // TODO: This needs to be done through PHP
    </script>
</head>

<body ng-controller="FlashCardController">
    <?php include( ALERT_DIV_FILE ) ; ?>
  	<div class="ng-view"></div>	
</body>

</html>