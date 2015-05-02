    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?php echo $pageConfig[ "tab_title" ]; ?></title>

    <link rel='stylesheet' href='/lib-ext/fonts/Open_Sans/opensans.css'>
    <link rel="stylesheet" href="/lib-ext/bootstrap-3.3.4/css/bootstrap.css">

    <link rel="stylesheet" href="/lib-app/style/app_fw_main.css"></style>
    <link rel="stylesheet" href="/apps/_common/style/main.css"></style>
    <link rel="stylesheet" href="<?php echo APP_MAIN_CSS_PATH ?>"></style>

    <script src="/lib-ext/log4javascript/log4javascript.js"></script>

    <script src="/lib-ext/jquery/jquery-2.1.1.min.js"></script>
    <script src="/lib-ext/jquery/jquery.cookie.js"></script>

    <script src="/lib-ext/bootstrap-3.3.4/js/bootstrap.min.js"></script>
    
    <script src="/lib-ext/angular/angular.min.js"></script>
    <script src="/lib-ext/angular/angular-route.min.js"></script>
    <script src="/lib-ext/angular/angular-sanitize.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/angular/ui-bootstrap-custom-0.12.1.min.js"></script>
    <script src="/lib-ext/bootstrap-3.3.4/angular/ui-bootstrap-custom-tpls-0.12.1.min.js"></script>

    <script src="/apps/_common/scripts/common_utils.js"></script>

    <script type="text/javascript">
        var log      = log4javascript.getLogger( "main" ) ;
        var appender = new log4javascript.BrowserConsoleAppender() ;
        var layout   = new log4javascript.PatternLayout( "[%-5p] %m" ) ;

        appender.setLayout( layout ) ;
        appender.setThreshold( log4javascript.Level.DEBUG ) ;

        log.addAppender( appender ) ;
    </script>

    <script type="text/javascript">
    $( '[data-toggle="tooltip"]' ).tooltip( {
        placement : 'top'
    } ) ;
    </script>
