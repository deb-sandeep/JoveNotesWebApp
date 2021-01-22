<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class StudentScoreDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
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

    function getScoreLedger( $userName, $startDate, $endDate ) {

$query = <<< QUERY
(
SELECT 
  date_format( pr.redemption_time, '%m-%d-%y' ) as date, 
  redemption_item as comments,
  -1*sum( pr.points ) as points
FROM 
    jove_notes.points_redemption pr
WHERE
    pr.student_name = '$userName' AND 
    pr.redemption_time between '$startDate' and '$endDate'
GROUP BY
    date, comments 
    
UNION

SELECT 
  date_format( ss.last_update, '%m-%d-%y' ) as date, 
  "Earned" as comments,
  sum( ss.score ) as points 
FROM 
  jove_notes.student_score ss
WHERE 
  ss.student_name = '$userName' AND
  ss.last_update between '$startDate' and '$endDate' AND
  ss.score_type = 'INC'
GROUP BY 
  date
ORDER BY
  date desc
)
  
ORDER BY date desc 
QUERY;

        $colNames = [ "date", 
                      "comments", 
                      "points" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }    

    function updateScore( $chapterId, $userName, $incrementValue ) {

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

        if( $incrementValue != 0 ) {
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

    function addPoints( $userName, $subject, $points, $notes ) {

        global $dbConn ;

        if( $points == 0 ) return ;

        parent::executeInsert(
            "insert into jove_notes.student_score " .
            "( student_name, score_type, score, subject_name, last_update, notes ) " .
            "values " .
            "( " .
            "  '$userName', " .
            "  'INC', " .
            "  $points, " .
            "  '$subject', " .
            "  CURRENT_TIMESTAMP, " .
            "  '" . $dbConn->real_escape_string( $notes ) . "' " .
            ")"
        ) ;

        parent::executeUpdate( 
            "update jove_notes.student_score " .
            "set " .
            " score = score + $points, " .
            " last_update = CURRENT_TIMESTAMP " .
            "where " .
            " student_name = '$userName' and " .
            " score_type = 'TOT'"
        ) ;
    }
}
?>

