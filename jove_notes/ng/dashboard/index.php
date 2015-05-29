<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/jove_notes/php/dao/card_learning_summary_dao.php" ) ;

global $log;

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
    <style>
      body {
        padding-top: 45px ;
        padding-left: 10px ;
        padding-right: 10px ;
      }
    </style>

    <link rel="stylesheet" href="/lib-ext/jquery/css/jquery.treegrid.css">

    <script src="/lib-ext/jquery/jquery.treegrid.js"></script>
    <script src="/lib-ext/jquery/jquery.treegrid.bootstrap3.js"></script>    

    <script src="/apps/jove_notes/ng/dashboard/routes.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/directives.js"></script>   

    <script src="/apps/jove_notes/ng/dashboard/progress_snapshot/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/study_per_day/controllers.js"></script>    
    <script src="/apps/jove_notes/ng/dashboard/chapter_progress_snapshot/controllers.js"></script>    
</head>
<body ng-controller="DashboardController">
    <?php include( NAVBAR_FRAGMENT_PATH ) ; ?>
    <?php include( ALERT_DIV_FILE ) ; ?>
    <a type="button" class="btn btn-default btn-md" 
       href="#ProgressSnapshot"
       ng-class="getBtnActiveClass( 'ProgressSnapshot' )"
       ng-click="setActiveReport( 'ProgressSnapshot' )">
  	Progress Snapshot
  	</a>

    <a type="button" class="btn btn-default btn-md" 
       href="#StudyPerDay" 
       ng-class="getBtnActiveClass( 'StudyPerDay' )"
       ng-click="setActiveReport( 'StudyPerDay' )">
  	Study per Day
  	</a>

    <a type="button" class="btn btn-info btn-md" 
       href="/apps/jove_notes/ng/remoteflash/index.php">
    Remote Flash
    </a>
  	<div class="ng-view"></div>	
</body>
</html>