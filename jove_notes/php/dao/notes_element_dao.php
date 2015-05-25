<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class NotesElementDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function getNoteElements( $chapterId ) {

$query = <<< QUERY
select 
	notes_element_id, element_type, difficulty_level, content
from 
	jove_notes.notes_element
where
	chapter_id = $chapterId and
	ready = 1
order by 
	notes_element_id asc ;
QUERY;

		$colNames = [ "notes_element_id", "element_type", 
		              "difficulty_level", "content" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames ) ;
	}

}
?>

