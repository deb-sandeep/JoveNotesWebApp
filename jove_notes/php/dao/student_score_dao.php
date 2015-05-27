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
                    "where student_name = '$userName'" 
                ) ;

        if( $score == null ) {
            parent::executeInsert( 
                    "insert into jove_notes.student_score " .
                    "(student_name, score, last_update) " .
                    "values ".
                    "( '$userName', 0, CURRENT_TIMESTAMP )" 
                ) ;

            $score = 0 ;
        }
		return $score ;
	}

    function updateScore( $userName, $incrementValue ) {

        parent::executeUpdate( 
                "update jove_notes.student_score " .
                "set " .
                " score = score + $incrementValue, " .
                " last_update = CURRENT_TIMESTAMP " .
                "where " .
                " student_name = '$userName'" 
            ) ;
    }
}
?>

