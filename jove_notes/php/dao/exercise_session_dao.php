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
}
?>

