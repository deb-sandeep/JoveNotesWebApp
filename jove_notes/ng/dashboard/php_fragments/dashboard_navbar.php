<div class="row">
  <div class="col-sm-12 nav_element">
      <img src="<?php echo APP_LOGO_PATH ?>" 
           style="height: 30px"/>
      &nbsp;&nbsp;&nbsp;
      <b>{{pageTitle}}</b>
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
