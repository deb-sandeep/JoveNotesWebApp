<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/vo/user.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/dao/user_dao.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/utils/execution_context.php" ) ;
require_once( DOCUMENT_ROOT . "/lib-app/php/services/authorization_service.php" ) ;

class AuthorizationServiceTest extends PHPUnit_Framework_TestCase {

	private $logger ;

	function __construct() {
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function setUp() { initializeDBConn() ; }

	function tearDown() { closeDBConn() ; }

	private function loadAndSetUserInExecutionContext( $userName ) {

		$userDAO = new UserDAOImpl() ;
		$user = new User( $userName ) ;

		$map = $userDAO->loadUserPreferences( $userName ) ;
		foreach ($map as $key => $value) {
	    	$user->setPreference( $key, $value ) ;
		}

		$roles = $userDAO->getUserRoles( $userName )	;
		$user->addRoles( $roles ) ;

		$ent = $userDAO->getEntitlementsForUser( $userName ) ;
		$user->setEntitlement( $ent ) ;

		ExecutionContext::setCurrentUser( $user ) ;
	}

	// UTUser should have full access to all the syllabus and chapters
	function testUTUserEntitlements() {

		$this->loadAndSetUserInExecutionContext( "UTUser" ) ;

		$guard = "chapter:Class-8/History/12/0/The American Revolution" ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "NOTES" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "CHAPTER_STATS" ) ) ;

		$guard = "chapter:Test Syllabus/Test Subject/1/0/Test Chapter" ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "NOTES" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "CHAPTER_STATS" ) ) ;
	}

	// Deba should have access to only Class-8 chapters
	function testDebaEntitlements() {

		$this->loadAndSetUserInExecutionContext( "Deba" ) ;

		$guard = "chapter:Class-8/History/12/0/The American Revolution" ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "NOTES" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) ;
		$this->assertTrue( Authorizer::hasAccess( $guard, "CHAPTER_STATS" ) ) ;

		$guard = "chapter:Test Syllabus/Test Subject/1/0/Test Chapter" ;
		$this->assertFalse( Authorizer::hasAccess( $guard, "NOTES" ) ) ;
		$this->assertFalse( Authorizer::hasAccess( $guard, "FLASH_CARD" ) ) ;
		$this->assertFalse( Authorizer::hasAccess( $guard, "CHAPTER_STATS" ) ) ;
	}
}