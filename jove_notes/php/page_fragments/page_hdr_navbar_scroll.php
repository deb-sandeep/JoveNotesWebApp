<div class="container-fluid">

  <div class="row">

    <div class="col-xs-2 nav_element">
        <img src="<?php echo APP_LOGO_PATH ?>" 
             style="height: 30px"/>
    </div>

    <div class="col-xs-7 nav_element">
        <b>{{pageTitle}}</b>
    </div>

    <div class="col-xs-3 nav_element">
        <span class="small">
        [ <?php echo ExecutionContext::getCurrentUserName(); ?> ]
        </span>
        <div class="pull-right" style="margin-top: 3px">
            <a href="/apps/jove_notes/ng/dashboard/index.php">
                <span class="glyphicon glyphicon-eye-open gi-1-5x"></span>
            </a>
        </div>
    </div>
  </div>
</div>
