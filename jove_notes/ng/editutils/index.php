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
    <script type="text/x-mathjax-config">
      MathJax.Hub.Config({ TeX: { extensions: ["mhchem.js"] }});
    </script>
    <script type="text/javascript" src="/lib-ext/MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>

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