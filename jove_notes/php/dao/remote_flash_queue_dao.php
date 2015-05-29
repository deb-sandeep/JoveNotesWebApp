<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class RemoteFlashQueueDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function addMessage( $userName, $msgType, $content=NULL ) {

        if( $content != NULL ) {
            if( is_object( $content ) ) {
                $content = json_encode( $content, JSON_NUMERIC_CHECK ) ;
            }
        }

$query = <<<QUERY
insert into jove_notes.remote_flash_queue
( session_id, student_name, msg_type, msg_content )
values
(
    ( select max(session_id) 
      from jove_notes.learning_session 
      where student_name='$userName'
    ),
    '$userName', '$msgType', '$content'
)
QUERY;

        parent::executeInsert( $query ) ;
	}
}
?>

