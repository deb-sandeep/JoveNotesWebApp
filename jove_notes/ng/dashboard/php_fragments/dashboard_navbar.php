
<div class="container-fluid"
     style="position: fixed; top:0; right:0; left:0;">
  <div class="row">

    <div class="col-sm-2 nav_element">
        <img src="<?php echo APP_LOGO_PATH ?>" 
             style="height: 30px"/>
    </div>

    <div class="col-sm-7 nav_element">
        <b>{{pageTitle}}</b>
    </div>

    <div class="col-sm-3 nav_element">
        <span class="small">
        [ <?php echo ExecutionContext::getCurrentUserName(); ?> ]
        </span>
        <div class="pull-right" style="margin-top: 3px">
            <a href="<?php echo LOGOUT_SERVICE ?>">
                <span class="glyphicon glyphicon-log-out gi-1-5x"></span>
            </a>
        </div>
    </div>
  </div>
</div>
