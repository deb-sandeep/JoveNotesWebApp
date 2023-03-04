<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ExerciseEventDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	public function saveEvent( $event ) {
		if( -1 == $event->questionId) {
			$event->questionId = 'NULL' ;
		}
		$createQuery = <<< QUERY
INSERT INTO jove_notes.exercise_event
( exercise_id, timestamp, phase_name, event_name, event_type, question_id )
VALUES
( 
 $event->exerciseId, 
 $event->timestamp, 
 '$event->phaseName',
 '$event->eventName',
 '$event->eventType',
 $event->questionId
)
QUERY;
		return parent::executeInsert( $createQuery );
	}

	public function getEventsForExercise( $exerciseId ) {
		$selectQuery = <<< QUERY
SELECT 
    timestamp,
    phase_name as phaseName,
    event_name as eventName,
    event_type as eventType,
    question_id as questionId
FROM 
    jove_notes.exercise_event
WHERE
    exercise_id = $exerciseId
ORDER BY
    id timestamp ASC
QUERY;

		$colNames = [ "timestamp",
					  "phaseName",
			          "eventName",
			          "eventType",
			          "questionId" ] ;

		return parent::getResultAsAssociativeArray( $selectQuery, $colNames, false ) ;
	}
}
?>

