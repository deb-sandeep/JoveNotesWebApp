<?php
ini_set( 'display_errors', 'On' ) ;
error_reporting( E_ALL | E_STRICT ) ;

define( "DOCUMENT_ROOT", "/home/sandeep/projects/source/PHPAppFramework" ) ;

require_once( 'log4php/Logger.php' ) ;

$dbConn = NULL ;

Logger::configure( DOCUMENT_ROOT . '/lib-app/php/configs/log4php-config.xml' ) ;
$logger = Logger::getLogger( "GLOBAL_UT_LOGGER" ) ;

function initializeDBConn() {

	global $dbConn, $logger ;
	$dbConn = mysqli_connect( "localhost", "root", getenv( "DB_PASSWORD") ) ;
	if( mysqli_connect_errno() ) {
	    throw new Exception( "Failed to connect to MySQL: " . mysqli_connect_error() ) ;
	}
	$logger->debug( "Initialized the DBConnection" ) ;
}

function closeDBConn() {

	global $dbConn, $logger ;
	if( $dbConn != NULL ) {
		$dbConn->close() ;
		$logger->debug( "Closed the DBConnection" ) ;
	}
}

?>