<?php
require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class RtChapPrepProcQueueDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	function insertRequest( $userName, $chapterId ) {

$query = <<< QUERY
insert into `jove_notes`.`rt_chap_prep_proc_req_q` 
(`student_name`, `chapter_id`) 
values 
('$userName', $chapterId )
QUERY;

		parent::executeInsert( $query ) ;
	}
}
?>

