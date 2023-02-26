<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;
require_once( APP_ROOT      . "/php/dao/learning_session_dao.php" ) ;

class ExerciseSessionDAO extends AbstractDAO {

    private $lsDAO = null ;

	function __construct() {
		parent::__construct() ;
        $this->lsDAO = new LearningSessionDAO() ;
	}

    /** 
     * Creates a new session and returns the unique session identifier. 
     * 
     * @param $userName The name of the user for whom the session is being created.
     * @param $chapterIds An array of chapterIds included in this session.
     *
     * @return An associative array of the following structure:
     *    {
     *        'sessionId' : <int, learning session id>,
     *        'exChapterSessionIdMap' : {
     *            '<chapter id>' : <learning session id for chapter>,
     *            ...
     *        }
     *    }
     */
    function createNewSession( $userName, $chapterIds ) {

        $retVal = array() ;

$exSessionCreateQuery = <<< QUERY
INSERT INTO jove_notes.exercise_session
( student_name )
VALUES
( '$userName' )
QUERY;

$exChapterSessionMapCreateQuery = <<< QUERY
INSERT INTO jove_notes.exercise_session_chapter_map
( exercise_session_id, chapter_session_id )
VALUES 
QUERY;

		$sessionId = parent::executeInsert( $exSessionCreateQuery ) ;
        $retVal[ 'sessionId' ] = $sessionId ;

        $exChapSessionIdMap = array() ;
        $numChapterIds      = count( $chapterIds ) ;

        for( $i=0; $i<$numChapterIds; $i++ ) {
            $chapterSessionId = $this->lsDAO->createNewSession( $userName, $chapterIds[$i] ) ;
            $exChapSessionIdMap[ $chapterIds[$i] ] = $chapterSessionId ;

            $exChapterSessionMapCreateQuery .= "( $sessionId, $chapterSessionId )" ;
            if( $i < ( $numChapterIds -1 ) ) {
                $exChapterSessionMapCreateQuery .= "," ;
            }
        }

        parent::executeInsert( $exChapterSessionMapCreateQuery ) ;
        $retVal[ 'exChapterSessionIdMap' ] = $exChapSessionIdMap ;

        return $retVal ;
	}

    function getSession( $sessionId ) {

        $selectQuery = <<< QUERY
SELECT 
    session_id       as sessionId,
    completed        as completed, 
    total_solve_time as totalSolveTime, 
    pause_time       as pauseTime, 
    review_time      as reviewTime, 
    study_time       as studyTime, 
    total_questions  as totalQuestions, 
    num_correct      as numCorrect, 
    total_marks      as totalMarks
FROM
    jove_notes.exercise_session
WHERE
    session_id = $sessionId
QUERY;

        $colNames = [
            "sessionId",
            "completed",
            "totalSolveTime",
            "pauseTime",
            "reviewTime",
            "studyTime",
            "totalQuestions",
            "numCorrect",
            "totalMarks"
        ] ;
        return parent::getResultAsAssociativeArray( $selectQuery, $colNames, true ) ;
    }

    /**
     * Gets an array of session objects which are completed. Note that this
     * will effectively not pick up any exercise sessions from before class IX
     * since the exercise extention happened in class IX.
     *
     * [{
     *      'sessionId'      : <int>,
     *      'completed'      : 0 or 1,
     *      'totalSolveTime' : <int>,
     *      'pauseTime'      : <int>,
     *      'reviewTime'     : <int>,
     *      'studyTime'      : <int>,
     *      'totalQuestions' : <int>,
     *      'numCorrect'     : <int>,
     *      'totalMarks'     : <int>
     * },
     * ...
     * ]
     */
    function getAllCompletedSessions() {

        $selectQuery = <<< QUERY
SELECT 
    session_id       as sessionId,
    completed        as completed, 
    total_solve_time as totalSolveTime, 
    pause_time       as pauseTime, 
    review_time      as reviewTime, 
    study_time       as studyTime, 
    total_questions  as totalQuestions, 
    num_correct      as numCorrect, 
    total_marks      as totalMarks
FROM
    jove_notes.exercise_session
WHERE
    completed = b'1'
QUERY;

        $colNames = [
            "sessionId",
            "completed",
            "totalSolveTime",
            "pauseTime",
            "reviewTime",
            "studyTime",
            "totalQuestions",
            "numCorrect",
            "totalMarks"
        ] ;
        return parent::getResultAsAssociativeArray( $selectQuery, $colNames, false ) ;
    }

    /**
     * Updates an existing session and returns the updated session instance.
     *
     * @param An object with the following properties.
     * {
     *      'sessionId'      : <int>,
     *      'completed'      : 0 or 1,
     *      'totalSolveTime' : <int>,
     *      'pauseTime'      : <int>,
     *      'reviewTime'     : <int>,
     *      'studyTime'      : <int>,
     *      'totalQuestions' : <int>,
     *      'numCorrect'     : <int>,
     *      'totalMarks'     : <int>
     * }
     *
     * @return The updated record. The object format is the same as the request.
     */
    function updateSession( $updatedRow ) {

        $updateQuery = <<< QUERY
UPDATE jove_notes.exercise_session
SET
    completed       = b'$updatedRow->completed', 
    total_solve_time= $updatedRow->totalSolveTime, 
    pause_time      = $updatedRow->pauseTime, 
    review_time     = $updatedRow->reviewTime, 
    study_time      = $updatedRow->studyTime, 
    total_questions = $updatedRow->totalQuestions, 
    num_correct     = $updatedRow->numCorrect, 
    total_marks     = $updatedRow->totalMarks 
WHERE
    session_id = $updatedRow->sessionId
QUERY;

		parent::executeUpdate( $updateQuery ) ;
	}
}
?>

