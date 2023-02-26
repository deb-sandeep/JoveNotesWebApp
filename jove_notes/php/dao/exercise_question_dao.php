<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ExerciseQuestionDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	public function createMapping( $sessionId, $questionId ) {
		$createQuery = <<< QUERY
INSERT INTO jove_notes.exercise_question
( exercise_id, question_id )
VALUES
( $sessionId, $questionId )
QUERY;
		return parent::executeInsert( $createQuery );
	}

	public function getMapping( $sessionId, $questionId ) {
		$selectQuery = <<< QUERY
SELECT 
    exercise_id as exerciseId, 
    question_id as questionId, 
    total_time_taken as totalTimeTaken, 
    study_time as studyTime, 
    review_time as reviewTime, 
    result as result, 
    marks_obtained as marksObtained 
FROM 
    jove_notes.exercise_question
WHERE
    exercise_id = $sessionId AND
    question_id = $questionId
QUERY;

		$colNames = [ "exerciseId",
			          "questionId",
			          "totalTimeTaken",
			          "studyTime",
			          "reviewTime",
			          "result",
			          "marksObtained" ] ;

		return parent::getResultAsAssociativeArray( $selectQuery, $colNames, true ) ;
	}
	public function getAllMappingsForSession( $sessionId ) {
		$selectQuery = <<< QUERY
SELECT 
    exercise_id as exerciseId, 
    question_id as questionId, 
    total_time_taken as totalTimeTaken, 
    study_time as studyTime, 
    review_time as reviewTime, 
    result as result, 
    marks_obtained as marksObtained 
FROM 
    jove_notes.exercise_question
WHERE
    exercise_id = $sessionId
QUERY;

		$colNames = [ "exerciseId",
			          "questionId",
			          "totalTimeTaken",
			          "studyTime",
			          "reviewTime",
			          "result",
			          "marksObtained" ] ;

		return parent::getResultAsAssociativeArray( $selectQuery, $colNames, false ) ;
	}

	public function updateMapping( $sessionId, $questionId,
	                               $totalTimeTaken, $studyTime, $reviewTime,
	                               $result, $marksObtained ) {
		$updateQuery = <<< QUERY
UPDATE jove_notes.exercise_question
SET
    total_time_taken = $totalTimeTaken, 
    study_time       = $studyTime, 
    review_time      = $reviewTime, 
    result           = '$result', 
    marks_obtained   = $marksObtained 
WHERE
    exercise_id = $sessionId AND
    question_id = $questionId
QUERY;
		parent::executeUpdate( $updateQuery ) ;
	}
}
?>

