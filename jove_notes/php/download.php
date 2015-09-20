<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/jove_notes/php/app_bootstrap.php" ) ;
$pageConfig = array(
	"tab_title"  => "JN Downloads"
) ;
?>
<!DOCTYPE html>
<html>
<head>
    <?php include( HEAD_CONTENT_FILE ); ?>
</head>
<body>
	<div class="row">
	  <div class="col-sm-12 nav_element">
	      <img src="<?php echo APP_LOGO_PATH ?>" 
	           style="height: 30px"/>
	      &nbsp;&nbsp;&nbsp;
	      <b>JoveNotes downloadables</b>
	      <div class="pull-right" style="margin-top: 3px">
	          <a href="<?php echo LOGOUT_SERVICE ?>">
	              <span class="glyphicon glyphicon-log-out gi-1-5x"></span>
	          </a>
	      </div>
	      <span class="small pull-right">
	      [ <?php echo ExecutionContext::getCurrentUserName(); ?> ]&nbsp;&nbsp;&nbsp;
	      </span>
	  </div>
	</div>

	<h3>JoveNotes utility downloads</h3>

	<table class="table table-bordered table-striped">
		<thead>
			<tr>
				<th>Artifact</th>
				<th>Link</th>
				<th>Description</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Prebundled Editor</td>
				<td>
					<a href="/download/JoveNotesEditor.tar">JoveNotesEditor.tar</a>
				</td>
				<td>A prebundled eclipse installation, ready for JoveNotes digitization.</td>
			</tr>
			<?php
			$files = scandir( "/home/sandeep/Downloads" ) ;
			foreach( $files as $file ) {
				if( strpos( $file, "com.sandy.xtext.jovenotes.ui_" ) === 0 ) {
					echo "<tr>" ;
					echo "<td>DSL UI Plugin</td>" ;
					echo "<td><a href=\"/download/$file\">$file</a></td>" ;
					echo "<td>JoveNotes DSL UI Eclipse Plugin</td>" ;
					echo "</tr>" ;
				}
				else if( strpos( $file, "com.sandy.xtext.jovenotes_" ) === 0 ) {
					echo "<tr>" ;
					echo "<td>DSL Plugin</td>" ;
					echo "<td><a href=\"/download/$file\">$file</a></td>" ;
					echo "<td>JoveNotes DSL Eclipse Plugin</td>" ;
					echo "</tr>" ;
				}
			}
			?>
		</tbody>
	</table>
	<p>
	After you download both the DSL plugins, delete the old jars in the 
	eclipse_install_dir/dropins/ directory and copy the new ones there.
	<p>
	You would need to restart eclipse once you have installed the new plugins.
</body>
</html>
