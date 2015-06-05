<?php
require_once( $_SERVER[ "DOCUMENT_ROOT" ] . "/apps/test_app/php/app_bootstrap.php" ) ;

$pageConfig = array(
	"tab_title"  => "Test App",
    "page_title" => "Landing page of Test App",
) ;
?>
<!DOCTYPE html>
<html>
<head>
    <?php include( HEAD_CONTENT_FILE ) ; ?>
	<script>
	function sendAsyncRequest( apiPath, payload ) {

        var serializedRequest = JSON.stringify( payload ) ;

        $.ajax({
            type: 'POST',
            url: apiPath,
            data: serializedRequest,
            headers: {
            	Accept: "application/json"
            },
            async:true
        })
        .done( function( responseStr ) {
        	responseDiv = document.getElementById( "response" ) ;
        	responseDiv.innerHTML = responseStr ;
        }) ;         
	}

	function sendRequest() {

		var payload = {} ;
		payload[ "name" ] = "Sandeep" ;

		sendAsyncRequest( "/api/Greetings", payload ) ;
	}
	</script>
</head>
<body>
	<?php
	echo "<h3>User preferences</h3>" ;
	echo "<p>" ;
	foreach ( ExecutionContext::getCurrentUser()->getPreferences() as $key => $value) {
		echo "<li>$key = $value</li>" ;
	}
	echo "<p>" ;
	echo "<p>" ;
	echo "<h3>User entitlements</h3>" ;
	$ent = ExecutionContext::getCurrentUser()->getEntitlement() ;
	if( !is_null( $ent ) ) {
		echo "<pre>" ;
		echo "" . $ent ;
		echo "</pre>" ;
	}
	?>
	</ul>
	<p>
	<p>
	<input type="button" onclick="sendRequest()" value="Ajax"/>
	<p>
	Server Response:<p>
	<div id="response"><?php echo ExecutionContext::getRequestType() ?></div>
	<p>
	<a href="<?php echo LOGOUT_SERVICE ?>">
        <span class="glyphicon glyphicon-log-out gi-1-5x"></span>
    </a>
</body>
</html>