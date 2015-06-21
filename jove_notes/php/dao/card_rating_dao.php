<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardRatingDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function insertRating( $cardId, $userName, $sessionId, $rating, $score, $timeTaken ) {

$query = <<< QUERY
insert into jove_notes.card_rating
( 
  student_name, session_id, chapter_id, notes_element_id, card_id, 
  timestamp, rating, score, time_spent 
)
values
( '$userName', 
  $sessionId,
  ( select chapter_id from jove_notes.card where card_id = $cardId ), 
  ( select notes_element_id from jove_notes.card where card_id = $cardId ), 
  $cardId, 
  NOW(), 
  '$rating', 
  $score, 
  $timeTaken 
)
QUERY;

		return parent::executeInsert( $query ) ;
	}

    function getDistinctSubjectNames( $userName ) {

$query = <<< QUERY
select distinct c.subject_name
from 
  jove_notes.card_rating cr, jove_notes.chapter c
where
  cr.chapter_id = c.chapter_id and 
    cr.student_name = '$userName' 
order by
  subject_name asc
QUERY;

        return parent::getResultAsArray( $query ) ;
    }

    function getCumulativeScorePriorToDate( $userName, $time ) {

$query = <<<QUERY
select sum(score)
from
    jove_notes.student_score
where
    student_name = '$userName' and
    score_type = 'INC' and
    last_update < '$time'
QUERY;

        return parent::selectSingleValue( $query, 0 ) ;
    }

    function getCumulativeScores( $userName, $subject, $frequency, $startDate, $endDate ) {

        $partitionFormat = $this->getPartitionFormat( $frequency ) ;

        $subjectClause = "" ;
        if( $subject != 'All' ) {
          $subjectClause = "and subject_name = '$subject'" ;
        }

        if( $frequency != 'intraday' ) {
          
$query = <<<QUERY
select date_format( last_update, '$partitionFormat' ) as partition_name, 
       sum(score) as score
from jove_notes.student_score 
where 
    student_name = '$userName' and 
    score_type = 'INC' and 
    last_update between '$startDate' and '$endDate' 
    $subjectClause
group by
    partition_name
QUERY;
          return parent::getResultAsMap( $query ) ;
        }
        else {

$intradayQuery = <<<ITD_QUERY
select id as partition_name, score
from jove_notes.student_score
where 
    student_name = '$userName' and 
    score_type = 'INC' and 
    last_update between '$startDate' and '$endDate' 
    $subjectClause
order by 
    id asc
ITD_QUERY;

          return parent::getResultAsMap( $intradayQuery ) ;
        }
    }

    function getCumulativeTimePriorToDate( $userName, $time ) {

$query = <<<QUERY
select sum(time_spent)/3600
from
    jove_notes.card_rating
where
    student_name = '$userName' and
    timestamp < '$time'
QUERY;

        return parent::selectSingleValue( $query, 0 ) ;
    }

    function getCumulativeTime( $userName, $subject, $frequency, $startDate, $endDate ) {

        $partitionFormat = $this->getPartitionFormat( $frequency ) ;
        if( $frequency == 'intraday' ){ 
          $partitionFormat = "%m-%d-%y:%H" ; 
        }

        $subjectWhereClause = "" ;
        $subjectJoinClause  = "" ;
        if( $subject != 'All' ) {
          $subjectJoinClause = ", jove_notes.chapter c " ;
          $subjectWhereClause = "and cr.chapter_id = c.chapter_id " .
                           "and c.subject_name = '$subject'" ;
        }

$query = <<<QUERY
select date_format( cr.timestamp, '$partitionFormat' ) as partition_name, 
       sum( cr.time_spent )/3600 as time_spent
from 
    jove_notes.card_rating cr $subjectJoinClause 
where 
    cr.student_name = '$userName' and 
    cr.time_spent < 90 and
    cr.timestamp between '$startDate' and '$endDate' 
    $subjectWhereClause
group by
    partition_name ;
QUERY;

        return parent::getResultAsMap( $query ) ;
    }

    private function getPartitionFormat( $frequency ) {

        $partitionFormat = "%m-%d-%y" ;

        if     ($frequency == 'intraday'){ $partitionFormat = "%m-%d-%y:%H%i%s" ; }
        else if($frequency == 'daily'   ){ $partitionFormat = "%m-%d-%y"    ; }
        else if($frequency == 'weekly'  ){ $partitionFormat = "%m-%y:%u"    ; }
        else if($frequency == 'monthly' ){ $partitionFormat = "%m-%y"       ; }

        return $partitionFormat ;
    }

}
?>

