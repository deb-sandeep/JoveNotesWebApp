<?php
require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ChapterPreparednessRequestQueueDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

    function insertRequest( $userName, $chapterId ) {

$query = <<< QUERY
insert into jove_notes.chapter_preparedness_request_queue
    ( student_name, chapter_id, request_time ) 
values
    ( '$userName', $chapterId, CURRENT_TIMESTAMP ) 
on duplicate key update    
    request_time = values( request_time )
QUERY;

        parent::executeInsert( $query ) ;
    }

	function insertRequests( $userName, $chapterIds ) {

        $valuesStr = "" ;
        $chapterIdArray = explode( ",", $chapterIds ) ;

        if( count( $chapterIdArray ) == 1 && $chapterIdArray[0] == "" ) {
            return ;
        }       

        foreach( $chapterIdArray as $id ) {
            $valuesStr = $valuesStr . "( '$userName', $id, CURRENT_TIMESTAMP )," ;
        }
        $valuesStr = substr( $valuesStr, 0, strlen( $valuesStr ) - 1 ) ;

$query = <<< QUERY
insert into jove_notes.chapter_preparedness_request_queue
    ( student_name, chapter_id, request_time ) 
values
    $valuesStr
on duplicate key update    
    request_time = values( request_time )
QUERY;

		parent::executeInsert( $query ) ;
	}
}
?>

