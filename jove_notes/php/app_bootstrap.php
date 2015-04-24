<?php
require_once( $_SERVER['DOCUMENT_ROOT']."/lib-app/php/page_preprocessor.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/_common/php/common_app_config.php" ) ;

define( "APP_NAME", "jove_notes" ) ;

define( "APP_PAGE_FRAG_PATH",    DOCUMENT_ROOT . "/apps/" . APP_NAME . "/php/page_fragments" ) ;

define( "FIXED_NAVBAR_FILE",     APP_PAGE_FRAG_PATH    . "/page_hdr_navbar_fixed.php" ) ;
define( "SCROLL_NAVBAR_FILE",    APP_PAGE_FRAG_PATH    . "/page_hdr_navbar_scroll.php" ) ;

define( "APP_LOGO_PATH",         "/apps/" . APP_NAME . "/media/images/logo_for_navbar.png" ) ;
define( "APP_MAIN_CSS_PATH",     "/apps/" . APP_NAME . "/style/main.css" ) ;

?>