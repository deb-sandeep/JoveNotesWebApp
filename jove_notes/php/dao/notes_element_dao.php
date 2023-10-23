<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class NotesElementDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	/**
	 * Always returns an array of possibly zero or more associate arrays of
	 * column names. 
	 */
	function getNoteElements( $userName, $chapterId, $elementType ) {

		$additionalFilter = "" ;
		if( $elementType == 'marked_for_review' ) {
			$additionalFilter = " and ne.marked_for_review=1 " ;
		}
		else {
			$additionalFilter = " and ne.hidden_from_view=0 " ;
		}

$query = <<< QUERY
select 
	ne.notes_element_id, ne.section, ne.element_type, ne.difficulty_level, 
	ne.content, ne.eval_vars, ne.script_body, ne.marked_for_review,
	CEIL( AVG( cls.learning_efficiency ) ) as learning_efficiency,
	CEIL( AVG( cls.abs_learning_efficiency ) ) as abs_learning_efficiency,
	SUM( cls.num_attempts ) as num_attempts,
	GROUP_CONCAT( DISTINCT cls.current_level
                     ORDER BY cls.current_level DESC SEPARATOR ',' ) as current_levels
from 
	jove_notes.notes_element ne left join
	jove_notes.card_learning_summary cls
on
	ne.notes_element_id = cls.notes_element_id
where
	ne.chapter_id = $chapterId and
	ne.ready = 1 and 
	( cls.student_name = '$userName' or cls.student_name is null ) 
	$additionalFilter
group by
	ne.notes_element_id
order by 
	ne.notes_element_id asc
QUERY;

		$colNames = [ "notes_element_id", "section", "element_type", 
		              "difficulty_level", "content", "eval_vars", 
		              "script_body", "marked_for_review",
		              "learning_efficiency", "abs_learning_efficiency", 
		              "num_attempts", "current_levels" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

	function markForReview( $userName, $cardId ) {

$query = <<< QUERY
update jove_notes.notes_element 
set marked_for_review = 1 
where notes_element_id = ( 
	select notes_element_id 
	from jove_notes.card 
	where card_id = $cardId 
) 
QUERY;
		parent::executeUpdate( $query ) ;
	}

	function markReviewed( $userName, $noteElementId ) {

$query = <<< QUERY
update jove_notes.notes_element 
set marked_for_review = 0 
where notes_element_id = $noteElementId 
QUERY;
		parent::executeUpdate( $query ) ;
	}

	function getChapterListOfNoteElementsMarkedForReview() {

$query = <<< QUERY
select c.chapter_id, c.syllabus_name, c.subject_name, c.chapter_num, 
       c.sub_chapter_num, c.chapter_name, 
       count( ne.notes_element_id ) as num_review_items, 
       concat( "chapter:", 
       	       c.syllabus_name, "/", 
       	       c.subject_name, "/", 
       	       c.chapter_num, "/", 
       	       c.sub_chapter_num, "/", 
       	       c.chapter_name ) as guard
from 
	jove_notes.chapter c, 
	jove_notes.notes_element ne 
where 
	ne.chapter_id = c.chapter_id and 
	ne.marked_for_review = 1 
group by 
	c.chapter_id 
order by 
	c.syllabus_name asc, 
	num_review_items desc 
QUERY;

		$colNames = [ "chapter_id", "syllabus_name", "subject_name", 
		              "chapter_num", "sub_chapter_num", "chapter_name", 
		              "num_review_items", "guard" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}
}
?>
