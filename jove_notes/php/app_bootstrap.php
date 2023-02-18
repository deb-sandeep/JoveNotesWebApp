<?php
require_once( $_SERVER['DOCUMENT_ROOT']."/lib-app/php/page_preprocessor.php" ) ;

require_once( DOCUMENT_ROOT . "/lib-app/php/services/authorization_service.php" ) ;
require_once( DOCUMENT_ROOT . "/apps/_common/php/common_app_config.php" ) ;

const APP_NAME = "jove_notes";

const APP_LOGO_PATH = "/apps/" . APP_NAME . "/media/images/logo_for_navbar.png";
const APP_MAIN_CSS_PATH = "/apps/" . APP_NAME . "/style/main.css";

if( !Authorizer::isUserInRole( "JN_USER" ) ) {
	
	HTTPUtils::redirectTo( ServerContext::getUnauthRedirPage() ) ;
	return ;
}

?>