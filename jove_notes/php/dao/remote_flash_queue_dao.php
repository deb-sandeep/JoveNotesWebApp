<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class RemoteFlashQueueDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function addMessage( $userName, $sessionId, $msgType, $content=NULL ) {

        if( $content != NULL ) {
            if( is_object( $content ) ) {
                $content = json_encode( $content, JSON_NUMERIC_CHECK ) ;
            }
        }

        // For some reason, mysql replaces \uXXXX to uXXXX, we make it \\uXXXX
        $content = preg_replace( '/\\\\u([0-9a-f]{4})/i', '\\\\\\\\u${1}', $content ) ;

$query = <<<QUERY
insert into jove_notes.remote_flash_queue
( session_id, student_name, msg_type, msg_content )
values
( $sessionId, '$userName', '$msgType', '$content')
QUERY;

        $this->logger->debug( $query ) ;

        parent::executeInsert( $query ) ;
	}

    function purgePreviousSessionMessages( $userName, $currentSessionId ) {

$query = <<<QUERY
delete from jove_notes.remote_flash_queue 
where 
    student_name = '$userName' and 
    session_id < $currentSessionId 
QUERY;

        parent::executeDelete( $query ) ;
    }

    function purgeAllMessages( $userName ) {

$query = <<<QUERY
delete from jove_notes.remote_flash_queue 
where 
    student_name = '$userName' 
QUERY;

        parent::executeDelete( $query ) ;
    }

    function getLastMessageAgeAndId( $userName ) {

$query = <<<QUERY
select id, TIMESTAMPDIFF(SECOND, create_timestamp, CURRENT_TIMESTAMP ) as age
from 
    jove_notes.remote_flash_queue 
where 
    student_name = '$userName' and 
    id = ( 
        select max(id) 
        from jove_notes.remote_flash_queue 
        where student_name = '$userName'
    ) 
QUERY;

        return parent::getResultAsAssociativeArray( $query, [ "id", "age" ] ) ;
    }

    function getAllMessages( $userName, $lastMessageId ) {

$query = <<<QUERY
select id, session_id, msg_type, msg_content 
from 
    jove_notes.remote_flash_queue
where
    student_name = '$userName' and 
    id > $lastMessageId 
order by 
    id asc 
QUERY;

        $colNames = [ "id", "session_id", "msg_type", "msg_content" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }
}

?>

