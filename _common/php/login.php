<?php
require_once( $_SERVER['DOCUMENT_ROOT']."/lib-app/php/page_preprocessor.php" ) ;

$requestedPage = HTTPUtils::getValueFromSession( 
	                   WebAuthenticationInterceptor::SESSION_PARAM_REQ_PAGE, "/" ) ;
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Bootstrap Example</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/lib-ext/bootstrap-3.3.4/css/bootstrap.css">
    <script src="/lib-ext/jquery/jquery-2.1.1.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/js/bootstrap.min.js"></script>
    <script src="/lib-ext/bootbox/bootbox.min.js"></script>
    <script>
    	var errMsgs = [] ;
		<?php
			$errMessages = HTTPUtils::getValueFromSession( 
				        WebAuthenticationInterceptor::SESSION_PARAM_ERR_MSGS ) ;

			if( $errMessages != NULL ) { 
				foreach ( $errMessages as $message ) {
					echo "errMsgs[errMsgs.length] = '$message';" ;
				}
			}

			HTTPUtils::eraseKeyFromSession( 
				        WebAuthenticationInterceptor::SESSION_PARAM_ERR_MSGS ) ;
		?>

		function showErrorMessages() {
			if( errMsgs.length != 0 ) {
				var msg = "" ;
				var index;
				for( index=0; index<errMsgs.length; index++ ) {
					msg += errMsgs[index] + "\n" ;
				}
				bootbox.dialog({
				  title: "Input has errors",
				  message: msg
				});
			}
		}
	</script>
  </head>
  <body onload="showErrorMessages()">
    <div class="container">
      <div class="row">
        <div class="col-sm-4">
        	<img src="/apps/_common/media/images/home_server_logo.png"/>
        </div>
        <div class="col-sm-4">
          <h2>Login</h2>
          <form role="form" action="<?php echo $requestedPage ?>" method="POST">
            <div class="form-group">
              <label for="login_element">User Name:</label>
              <input id="login_element"
              type="text"
              name="login"
              class="form-control"
              placeholder="Enter user name">
            </div>
            <div class="form-group">
              <label for="password_element">Password:</label>
              <input id="password_element"
              type="password"
              name="password"
              class="form-control"
              placeholder="Enter password">
            </div>
            <div class="form-group">
              <label for="default_app_element">Default application:</label>
              <select id="default_app_element"
                class="form-control"
                name="default_app">
                <option value="jove_notes" selected>Jove Notes</option>
              </select>
            </div>
            <div class="checkbox">
              <label><input type="checkbox" name="remember_me"> Remember me</label>
            </div>
            <button type="submit" class="btn btn-default pull-right">Submit</button>
          </form>
        </div>
        <div class="col-sm-4"></div>
      </div>
    </div>
  </body>
</html>
