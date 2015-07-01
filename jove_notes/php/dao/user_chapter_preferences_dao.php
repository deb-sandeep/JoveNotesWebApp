<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class UserChapterPrefsDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function updateHiddenPreference( $userName, $chapterId, $hidden ) {

		$hiddenBool = $hidden ? 1 : 0 ;

$query = <<< QUERY
insert into 
	jove_notes.user_chapter_preferences( student_name, chapter_id, is_hidden ) 
values( '$userName', $chapterId, $hiddenBool ) 
on duplicate key update    
	is_hidden = values( is_hidden )
QUERY;

		parent::executeUpdate( $query, 0 ) ;
	}

	/**
	 * This function returns an associative array with key as the chapter ID and
	 * value as either 0 or 1.. implying whether the chapter is visible or
	 * hidden respectively.
	 */
	function getHiddenPreferencesForUser( $userName ) {

$query = <<< QUERY
select chapter_id, is_hidden
from jove_notes.user_chapter_preferences
where
	student_name = '$userName'
QUERY;

		return parent::getResultAsMap( $query ) ;
	}
}
?>

