<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardRatingDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function insertRating( $cardId, $userName, $sessionId, $rating, $score, $timeTaken ) {

$query = <<< QUERY
insert into jove_notes.card_rating
( 
  student_name, session_id, chapter_id, notes_element_id, card_id, 
  timestamp, rating, score, time_spent 
)
values
( '$userName', 
  $sessionId,
  ( select chapter_id from jove_notes.card where card_id = $cardId ), 
  ( select notes_element_id from jove_notes.card where card_id = $cardId ), 
  $cardId, 
  NOW(), 
  '$rating', 
  $score, 
  $timeTaken 
)
QUERY;

		return parent::executeInsert( $query ) ;
	}
}
?>

