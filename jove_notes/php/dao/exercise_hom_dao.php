<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ExerciseHOMDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	function insertHOMAttributes( $userName, $cardId, $sessionId, $homAttributes ) {

    foreach( $homAttributes as $curHOMAttribute ) {
      
$query = <<< QUERY
insert into jove_notes.exercise_hom
( student_name, card_id, session_id, hom_attribute )
values
( '$userName', $cardId, $sessionId, '$curHOMAttribute' )
QUERY;

		  parent::executeInsert( $query ) ;
    }
	}
}
?>