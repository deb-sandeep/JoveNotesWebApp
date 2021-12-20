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

    <link rel="stylesheet" type="text/css" href="/lib-ext/jquery/css/jquery.treegrid.css">
    <link rel="stylesheet" type="text/css" href="/lib-ext/treetable/jquery.treetable.css">
    <link rel="stylesheet" type="text/css" href="/lib-ext/treetable/jquery.treetable.theme.css">
    <link rel="stylesheet" type="text/css" href="/lib-ext/bootstrap-3.3.4/angular/calendar/angular-bootstrap-calendar.min.css" >
    <link rel="stylesheet" type="text/css" href="/lib-ext/bootstrap-3.3.4/angular/colorpicker/colorpicker.min.css" >
    <link rel="stylesheet" type="text/css" href="/apps/jove_notes/ng/dashboard/calendar/settings.css" >

    <script src="/lib-ext/angular/angular-ui-indeterminate.min.js"></script>

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

    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({ 
            TeX: { extensions: ["mhchem.js"] },
            displayAlign: "left"
        });
    </script>
    <script src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_SVG-full"></script>
    <script src="/lib-ext/math/math.min.js"></script>    
    <script src="/lib-ext/bootstrap-3.3.4/angular/calendar/angular-bootstrap-calendar-tpls.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/angular/colorpicker/bootstrap-colorpicker-module.min.js"></script>

    <script src="/lib-app/js/simple_pivot/simple_pivot.js"></script> 
    <script src="/apps/jove_notes/ng/_common/jove_notes_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/question_utils.js"></script>    
    <script src="/apps/jove_notes/ng/_common/script_utilities.js"></script>    
    <script src="/apps/jove_notes/ng/notes/ne_formatter.js"></script>    

    <script src="/apps/jove_notes/ng/dashboard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/directives.js"></script>   
    <script src="/apps/jove_notes/ng/dashboard/filters.js"></script>   

    <script src="/apps/jove_notes/ng/dashboard/progress_snapshot/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/redeem/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/pivots/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/chapter_progress_snapshot/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/notes_review/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/exercises/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/calendar/controllers.js"></script>    

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
       href="#Redeem" 
       ng-class="getBtnActiveClass( 'Reports' )"
       ng-click="setActiveReport( 'Reports' )">
  	Redeem Points
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

    <a type="button" class="btn btn-default btn-md" 
       href="#Exercises" 
       ng-class="getBtnActiveClass( 'Exercises' )"
       ng-click="setActiveReport( 'Exercises' )">
    Exercises
    </a>

    <a type="button" class="btn btn-info btn-md" 
       href="/apps/jove_notes/ng/remoteflash/index.php">
    Remote Flash
    </a>

    <a type="button" class="btn btn-default btn-md" 
       href="#Calendar" 
       ng-class="getBtnActiveClass( 'Calendar' )"
       ng-click="setActiveReport( 'Calendar' )">
      <span class="glyphicon glyphicon-calendar"></span>
    </a>

  	<div class="ng-view"></div>	
</body>
</html>