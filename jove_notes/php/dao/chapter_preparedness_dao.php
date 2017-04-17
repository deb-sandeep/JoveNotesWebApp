<?php
require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ChapterPreparednessDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

    function getPreparednessValuesForUser( $userName ) {

$query = <<< QUERY
select chapter_id, 
       student_name, 
       preparedness_score, 
       retention_score
from jove_notes.chapter_preparedness
where
    student_name = '$userName'
QUERY;

        $colNames = [ "chapter_id", "student_name", 
                      "preparedness_score", "retention_score" ] ;
        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }
}
?>

