<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ExerciseEventDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	public function saveEvent( $event ) {
		$createQuery = <<< QUERY
INSERT INTO jove_notes.exercise_event
( exercise_id, timestamp, question_id, action )
VALUES
( $event->exerciseId, '$event->timestamp', $event->questionId, '$event->action' )
QUERY;
		return parent::executeInsert( $createQuery );
	}

	public function getEventsForExercise( $exerciseId ) {
		$selectQuery = <<< QUERY
SELECT 
    timestamp, 
    question_id as questionId, 
    action
FROM 
    jove_notes.exercise_event
WHERE
    exercise_id = $exerciseId
ORDER BY
    id ASC, timestamp ASC
QUERY;

		$colNames = [ "timestamp",
			          "questionId",
			          "action" ] ;

		return parent::getResultAsAssociativeArray( $selectQuery, $colNames, false ) ;
	}
}
?>

