<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/card_learning_summary_dao.php" ) ;

global $log;
$log->info( "Rendering dashboard for user " . ExecutionContext::getCurrentUserName() ) ;

$log->debug( "Refreshing card learning summaries" ) ;
$clsDAO = new CardLearningSummaryDAO() ;
$clsDAO->refresh( ExecutionContext::getCurrentUserName() ) ;

$pageConfig = array(
	"tab_title"  => "Dashboard"
) ;

define( "PHP_FRAGMENT_PATH",    DOCUMENT_ROOT . "/apps/jove_notes/ng/dashboard/php_fragments" ) ;
define( "NAVBAR_FRAGMENT_PATH", PHP_FRAGMENT_PATH . "/dashboard_navbar.php" ) ;

?>
<!DOCTYPE html>
<html ng-app="dashboardApp">
<head>
    <?php include( HEAD_CONTENT_FILE ); ?>

    <link rel="stylesheet" href="/lib-ext/jquery/css/jquery.treegrid.css">
    <link rel="stylesheet" type="text/css" href="/lib-ext/treetable/jquery.treetable.css">
    <link rel="stylesheet" type="text/css" href="/lib-ext/treetable/jquery.treetable.theme.css">

    <script src="/lib-ext/jquery/jquery.treegrid.js"></script>
    <script src="/lib-ext/jquery/jquery.treegrid.bootstrap3.js"></script>
    <script src="/lib-ext/treetable/jquery.treetable.js"></script>
    <script src="/lib-ext/bootbox/bootbox.min.js"></script>

    <script src="/lib-ext/rgraph/RGraph.common.core.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.key.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.dynamic.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.effects.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.common.tooltips.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.drawing.yaxis.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.line.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.pie.js"></script>    
    <script src="/lib-ext/rgraph/RGraph.bar.js"></script>    

    <script src="/lib-ext/moment/moment.min.js"></script> 
    <script src="/lib-ext/daterangepicker/daterangepicker.js"></script> 
    <link rel="stylesheet" href="/lib-ext/daterangepicker/daterangepicker-bs3.css">

    <script src="/lib-app/js/simple_pivot/simple_pivot.js"></script> 

    <script src="/apps/jove_notes/ng/dashboard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/directives.js"></script>   

    <script src="/apps/jove_notes/ng/dashboard/progress_snapshot/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/reports/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/pivots/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/chapter_progress_snapshot/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/notes_review/controllers.js"></script>    

    <script>
      var currentUserName = "<?php echo ExecutionContext::getCurrentUserName(); ?>" ;
    </script>
</head>
<body ng-controller="DashboardController">
    <?php include( NAVBAR_FRAGMENT_PATH ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <div style="height:2px"></div>
    <a type="button" class="btn btn-default btn-md" 
       href="#ProgressSnapshot"
       ng-class="getBtnActiveClass( 'ProgressSnapshot' )"
       ng-click="setActiveReport( 'ProgressSnapshot' )">
  	Snapshot
  	</a>

    <a type="button" class="btn btn-default btn-md" 
       href="#Reports" 
       ng-class="getBtnActiveClass( 'Reports' )"
       ng-click="setActiveReport( 'Reports' )">
  	Reports
  	</a>

    <a type="button" class="btn btn-default btn-md" 
       href="#Pivots" 
       ng-class="getBtnActiveClass( 'Pivots' )"
       ng-click="setActiveReport( 'Pivots' )">
    Pivots
    </a>

    <a type="button" class="btn btn-default btn-md" 
       href="#Review" 
       ng-class="getBtnActiveClass( 'Review' )"
       ng-click="setActiveReport( 'Review' )">
    Notes Review
    </a>

    <a type="button" class="btn btn-info btn-md" 
       href="/apps/jove_notes/ng/remoteflash/index.php">
    Remote Flash
    </a>
  	<div class="ng-view"></div>	
</body>
</html>