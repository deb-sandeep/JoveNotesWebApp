<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function getAllCards( $chapterId ) {

$query = <<< QUERY
select 
	card_id, card_type, difficulty_level, content
from 
	jove_notes.card
where
	chapter_id = $chapterId and
	ready = 1
order by 
	card_id asc ;
QUERY;

		$colNames = [ "card_id", "card_type", "difficulty_level", "content" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames ) ;
	}

}
?>

