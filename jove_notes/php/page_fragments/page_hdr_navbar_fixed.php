<nav class="navbar navbar-inverse navbar-fixed-top">
    <div class="container-fluid">

        <div class="navbar-header">
            <button type="button" class="navbar-toggle" 
                    data-toggle="collapse" 
                    data-target="#example-navbar-collapse">
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>            
            <a class="navbar-brand" href="#">
                <img style="margin-top: -12px" 
                     src="<?php echo APP_LOGO_PATH ?>" />
            </a>
            <p class="navbar-text gi-1-5x" style="margin-top: 6px">
            {{pageTitle}}
            </p>
        </div>

        <div class="collapse navbar-collapse" 
             id="example-navbar-collapse">

            <ul class="nav navbar-nav navbar-right">
                <li>
                    <span class="navbar-text small">
                    [ <?php echo ExecutionContext::getCurrentUserName(); ?> ]&nbsp;
                    </span>
                </li>
                <li>
                    <a href="#">
                        <span class="glyphicon glyphicon-cog gi-1-5x"></span>
                    </a>
                </li>
                <li>
                    <a href="<?php echo LOGOUT_SERVICE ?>">
                        <span class="glyphicon glyphicon-log-out gi-1-5x"></span>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>
