<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class LearningSessionDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

  /** Creates a new session and returns the unique session identifier. */
	function createNewSession( $userName, $chapterId ) {

$query = <<< QUERY
INSERT INTO jove_notes.learning_session
( student_name, chapter_id )
VALUES
( '$userName', $chapterId )
QUERY;

		return parent::executeInsert( $query ) ;
	}

  function updateSessionStat( $sessionId, $incrTimeSpent, 
                              $incrE, $incrA, $incrP, $incrH ) {

$query = <<< QUERY
update 
  jove_notes.learning_session 
set
  time_spent = time_spent + $incrTimeSpent, 
  num_cards_practiced = num_cards_practiced + 1, 
  num_E = num_E + $incrE, 
  num_A = num_A + $incrA, 
  num_P = num_P + $incrP, 
  num_H = num_H + $incrH 
where
  session_id = $sessionId
QUERY;

      parent::executeUpdate( $query ) ;
  }

}
?>

