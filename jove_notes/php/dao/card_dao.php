<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
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

	function getPeerCardIds( $cardId ) {

$query = <<< QUERY
select card_id 
from jove_notes.card 
where notes_element_id = (
		select notes_element_id 
		from jove_notes.card 
		where card_id = $cardId 
	)
QUERY;

		return parent::getResultAsArray( $query ) ;
	}
}
?>

