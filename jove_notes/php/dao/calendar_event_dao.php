<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CalendarEventDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	function getPossibleSubjects( $userName ) {

$query = <<< QUERY
SELECT distinct c.subject_name
FROM jove_notes.student_score sc, jove_notes.chapter c
WHERE
	sc.chapter_id = c.chapter_id AND
    sc.student_name = '$userName' AND
    sc.last_update > DATE_SUB( NOW(), INTERVAL 6 MONTH ) 
ORDER BY 
	c.subject_name ASC ;
QUERY;

		return parent::getResultAsArray( $query ) ;
	}

	function getAllEvents( $userName ) {

$query = <<< QUERY
select 
	id, type, subject, title, UNIX_TIMESTAMP(date) as date, color
from 
	jove_notes.calendar_event
where
	student_name = '$userName'
order by 
	date asc ;
QUERY;

		$colNames = [ "id", "type", "subject", "title", "date", "color" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

	function update( $userName, $event ) {

        global $dbConn ;

		$subject = $dbConn->real_escape_string( $event->subject ) ;
		$title   = $dbConn->real_escape_string( $event->title ) ;
		$color   = $dbConn->real_escape_string( $event->color ) ;

$query = <<< QUERY
UPDATE jove_notes.calendar_event
SET
	student_name = '$userName',
	type         = '$event->type',
	subject      = '$subject',
	title        = '$title',
	date         = FROM_UNIXTIME( $event->startsAt, '%Y-%m-%d' ),
	color        = '$color'
WHERE 
	id = $event->id;
QUERY;

		return parent::executeUpdate( $query ) ;
	}

	function insert( $userName, $event ) {

        global $dbConn ;
        
		$subject = $dbConn->real_escape_string( $event->subject ) ;
		$title   = $dbConn->real_escape_string( $event->title ) ;
		$color   = $dbConn->real_escape_string( $event->color ) ;

$query = <<< QUERY
INSERT INTO jove_notes.calendar_event(
	student_name,
	type,
	subject,
	title,
	date,
	color
)
VALUES(
	'$userName',
	'$event->type',
	'$subject',
	'$title',
	FROM_UNIXTIME( $event->startsAt, '%Y-%m-%d' ),
	'$color'
) ;
QUERY;

		return parent::executeInsert( $query ) ;
	}

	function delete( $id ) {

$query = <<< QUERY
DELETE FROM jove_notes.calendar_event
WHERE
	id = $id ;
QUERY;
		
		return parent::executeDelete( $query ) ;
	}
}
?>

