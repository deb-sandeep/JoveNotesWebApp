<?php
require_once( $_SERVER['DOCUMENT_ROOT']."/lib-app/php/page_preprocessor.php" ) ;
?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Unauthorized</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="/lib-ext/bootstrap-3.3.4/css/bootstrap.css">

    <script src="/lib-ext/jquery/jquery-2.1.1.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/js/bootstrap.min.js"></script>
  </head>
  <body bgcolor="pink">
    <div class="container">
      <div class="row">
        <div class="col-sm-4">
        	<img src="/apps/_common/media/images/home_server_logo.png"/>
        </div>
        <div class="col-sm-8">
          <h2>You have tried to access an unauthorized page. </h2>
          <h4>Please contact your server administator for the required access.</h4>
          <p>
          <p>
          <h5>You have been logged out.</h5>
          <p>
          <a href="/">Login back again with the right credentials.</a>
        </div>
      </div>
    </div>
  </body>
</html>
