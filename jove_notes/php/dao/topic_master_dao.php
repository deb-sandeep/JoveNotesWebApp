<?php
require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class TopicMasterDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	// Returns a map of topic_id => [ syllabus_name, topic_name ]. Returns an
	// empty map if the topic_master table does not exist (e.g. older archive
	// databases), so that callers can degrade gracefully.
	function getTopicMap() {

		$topicMap = array() ;

$query = <<< QUERY
select count(*) as num_tables
from information_schema.tables
where
	table_schema = 'jove_notes' and
	table_name   = 'topic_master'
QUERY;

		$result = parent::getResultAsAssociativeArray( $query, [ "num_tables" ] ) ;
		if( $result[ "num_tables" ] == 0 ) {
			return $topicMap ;
		}

$query = <<< QUERY
select topic_id, syllabus_name, topic_name
from jove_notes.topic_master
QUERY;

		$rows = parent::getResultAsAssociativeArray( $query,
		                    [ "topic_id", "syllabus_name", "topic_name" ], false ) ;

		foreach( $rows as $row ) {
			$topicMap[ $row[ "topic_id" ] ] = $row ;
		}
		return $topicMap ;
	}
}
?>
