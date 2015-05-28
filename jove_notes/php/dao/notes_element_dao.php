<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class NotesElementDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	/**
	 * Always returns an array of possibly zero or more associate arrays of
	 * column names. 
	 */
	function getNoteElements( $chapterId ) {

$query = <<< QUERY
select 
	ne.notes_element_id, ne.element_type, ne.difficulty_level, ne.content,
	CEIL( AVG( cls.learning_efficiency ) ) as learning_efficiency
from 
	jove_notes.notes_element ne,
	jove_notes.card_learning_summary cls
where
	ne.chapter_id = $chapterId and
	ne.ready = 1 and
	ne.notes_element_id = cls.notes_element_id and
	cls.student_name = 'UTUser'
group by
	ne.notes_element_id
order by 
	ne.notes_element_id asc
QUERY;

		$colNames = [ "notes_element_id", "element_type", 
		              "difficulty_level", "content", "learning_efficiency" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

}
?>

