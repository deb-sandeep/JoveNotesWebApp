<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class StudentScoreDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function getScore( $userName ) {


        $score = parent::selectSingleValue( 
                    "select score from jove_notes.student_score " .
                    "where student_name = '$userName' and score_type = 'TOT'" 
                ) ;

        if( $score == null ) {
            parent::executeInsert( 
                    "insert into jove_notes.student_score " .
                    "(student_name, score, score_type, last_update) " .
                    "values ".
                    "( '$userName', 0, 'TOT', CURRENT_TIMESTAMP )" 
                ) ;

            $score = 0 ;
        }
		return $score ;
	}

    function updateScore( $chapterId, $userName, $incrementValue ) {

        if( $incrementValue == 0 ) return ;

        parent::executeInsert(
                "insert into jove_notes.student_score " .
                "( student_name, score_type, score, subject_name, chapter_id, last_update ) " .
                "values " .
                "( " .
                "  '$userName', " .
                "  'INC', " .
                "  $incrementValue, " .
                "  ( select subject_name from jove_notes.chapter where chapter_id = $chapterId ), " .
                "  $chapterId, " .
                "  CURRENT_TIMESTAMP " .
                ")"
            ) ;

        parent::executeUpdate( 
                "update jove_notes.student_score " .
                "set " .
                " score = score + $incrementValue, " .
                " last_update = CURRENT_TIMESTAMP " .
                "where " .
                " student_name = '$userName' and " .
                " score_type = 'TOT'"
            ) ;
    }
}
?>

