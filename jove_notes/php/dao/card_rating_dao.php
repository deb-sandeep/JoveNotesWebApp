<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardRatingDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
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

  function getPivotDataForNumQuestions( $userName, $startDate, $endDate )  {

$query = <<< QUERY
select 
  date_format( cr.timestamp, '%m-%d-%y (%a)' ) as date, 
  c.subject_name, 
  concat( c.chapter_num, ".", c.sub_chapter_num, " - ", c.chapter_name) as chapter_name, 
  count( cr.id ) as value 
from 
  jove_notes.chapter c, 
  jove_notes.card_rating cr 
where 
  c.chapter_id = cr.chapter_id and 
  cr.student_name = '$userName' and 
  cr.timestamp between '$startDate' and '$endDate' 
group by 
  date, subject_name, chapter_name, cr.chapter_id 
order by 
  date desc 
QUERY;

    $colNames = [ "date", "subject_name", "chapter_name", "value" ] ;
    return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
  }

  function getPivotDataForTime( $userName, $startDate, $endDate )  {

$query = <<< QUERY
select 
  date_format( cr.timestamp, '%m-%d-%y (%a)' ) as date, 
  c.subject_name, 
  concat( c.chapter_num, ".", c.sub_chapter_num, " - ", c.chapter_name) as chapter_name, 
  sum( cr.time_spent ) as value 
from 
  jove_notes.chapter c, 
  jove_notes.card_rating cr 
where 
  c.chapter_id = cr.chapter_id and 
  cr.student_name = '$userName' and 
  cr.timestamp between '$startDate' and '$endDate' 
group by 
  date, subject_name, chapter_name, cr.chapter_id 
order 
  by date desc 
QUERY;

    $colNames = [ "date", "subject_name", "chapter_name", "value" ] ;
    return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
  }

  function getPivotDataForScore( $userName, $startDate, $endDate )  {

$query = <<< QUERY
select 
  date_format( cr.timestamp, '%m-%d-%y (%a)' ) as date, 
  c.subject_name, 
  concat( c.chapter_num, ".", c.sub_chapter_num, " - ", c.chapter_name) as chapter_name, 
  sum( cr.score ) as value 
from 
  jove_notes.chapter c, 
  jove_notes.card_rating cr 
where 
  c.chapter_id = cr.chapter_id and 
  cr.student_name = '$userName' and 
  cr.timestamp between '$startDate' and '$endDate' 
group by 
  date, subject_name, chapter_name, cr.chapter_id 
order 
  by date desc 
QUERY;

    $colNames = [ "date", "subject_name", "chapter_name", "value" ] ;
    return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
  }

  function getStudyTimeForToday( $userName )  {

$query = <<< QUERY
SELECT sum(time_spent) 
FROM 
  jove_notes.card_rating 
WHERE
  DATE(timestamp) = CURDATE()
QUERY;

    return parent::selectSingleValue( $query, 0 ) ;
  }
}
?>