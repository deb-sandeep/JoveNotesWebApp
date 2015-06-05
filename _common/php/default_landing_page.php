<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Logged out</title>

    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="stylesheet" href="/lib-ext/bootstrap-3.3.4/css/bootstrap.css">

    <script src="/lib-ext/jquery/jquery-2.1.1.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/js/bootstrap.min.js"></script>
  </head>
  <body>
    <div class="container">
      <div class="row">
        <div class="col-sm-4">
        	<img src="/apps/_common/media/images/home_server_logo.png"/>
        </div>
        <div class="col-sm-8">
          <h2>Welcome <?php echo ExecutionContext::getCurrentUser()->getUserName() ?></h2>
          <p>
          While you have successfully logged in, you don't seem to have a preferred
          application configured, or the application you are trying to access does
          not have a landing page configured. 
          <p>
          <p>
          <a href="<?php echo LOGOUT_SERVICE ?>">
            <span class="glyphicon glyphicon-log-out gi-1-5x"></span> Logout
          </a>
        </div>
      </div>
    </div>
  </body>
</html>
