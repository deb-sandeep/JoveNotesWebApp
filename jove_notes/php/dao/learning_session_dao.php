<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class LearningSessionDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

  /** Creates a new session and returns the unique session identifier. */
	function createNewSession( $userName, $chapterId ) {

$query = <<< QUERY
INSERT INTO jove_notes.learning_session
( student_name, chapter_id )
VALUES
( '$userName', $chapterId )
QUERY;

		$sessionId = parent::executeInsert( $query ) ;
        $this->refreshProgressSnapshot( $userName, $chapterId, $sessionId ) ;

        return $sessionId ;
	}

    function refreshProgressSnapshot( $userName, $chapterId, $sessionId ) {

$selQuery = <<< SEL_QUERY
select current_level, count(*) as count
from jove_notes.card_learning_summary
where
    student_name = '$userName' and
    chapter_id = $chapterId
group by
    current_level
SEL_QUERY;

        $levelCounts = parent::getResultAsAssociativeArray( $selQuery, 
                                        [ "current_level", "count" ], false ) ;

        $numNS = 0; $numL0 = 0; $numL1 = 0; $numL2 = 0; $numL3 =0; $numMAS = 0 ;

        foreach( $levelCounts as $pair ) {
            if     ( $pair[ "current_level" ] == 'NS'  ) $numNS  = $pair[ "count" ] ;
            else if( $pair[ "current_level" ] == 'L0'  ) $numL0  = $pair[ "count" ] ;
            else if( $pair[ "current_level" ] == 'L1'  ) $numL1  = $pair[ "count" ] ;
            else if( $pair[ "current_level" ] == 'L2'  ) $numL2  = $pair[ "count" ] ;
            else if( $pair[ "current_level" ] == 'L3'  ) $numL3  = $pair[ "count" ] ;
            else if( $pair[ "current_level" ] == 'MAS' ) $numMAS = $pair[ "count" ] ;
        }

$updQuery = <<< UPD_QUERY
update jove_notes.learning_session
set
    num_NS  = $numNS,
    num_L0  = $numL0,
    num_L1  = $numL1,
    num_L2  = $numL2,
    num_L3  = $numL3,
    num_MAS = $numMAS
where
    session_id = $sessionId
UPD_QUERY;

        parent::executeUpdate( $updQuery ) ;
    }

    function updateSessionStat( $sessionId, $incrTimeSpent, 
                                $incrE, $incrA, $incrP, $incrH,
                                $incrNS, $incrL0, $incrL1, 
                                $incrL2, $incrL3, $incrMAS, 
                                $score ) {

$query = <<< QUERY
update 
  jove_notes.learning_session 
set
  time_spent          = time_spent          + $incrTimeSpent , 
  num_cards_practiced = num_cards_practiced + 1              , 
  num_E               = num_E               + $incrE         , 
  num_A               = num_A               + $incrA         , 
  num_P               = num_P               + $incrP         , 
  num_H               = num_H               + $incrH         ,
  num_NS              = num_NS              + $incrNS        ,
  num_L0              = num_L0              + $incrL0        ,
  num_L1              = num_L1              + $incrL1        ,
  num_L2              = num_L2              + $incrL2        ,
  num_L3              = num_L3              + $incrL3        ,
  num_MAS             = num_MAS             + $incrMAS       ,
  points_earned       = points_earned       + $score 
where
  session_id = $sessionId
QUERY;

        parent::executeUpdate( $query ) ;
    }

    function getProgressSnapshots( $userName, $chapterId ) {

$query = <<< SEL_QUERY
select 
    time_spent, num_NS, num_L0, num_L1, num_L2, num_L3, num_MAS
from 
    jove_notes.learning_session
where
    student_name = '$userName' and
    chapter_id = $chapterId
order by
    timestamp asc
SEL_QUERY;

        $colNames = [ "time_spent", "num_NS", "num_L0", "num_L1", 
                      "num_L2", "num_L3", "num_MAS" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }
}
?>

