<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ChapterDAO extends AbstractDAO {

	private $logger ;

	function __construct() {
		parent::__construct() ;
		$this->logger = Logger::getLogger( __CLASS__ ) ;
	}

	function getChapterMetaData( $chapterId ) {

$query = <<< QUERY
select 
	concat( "chapter:", syllabus_name, "/", 
		                subject_name, "/", 
		                chapter_num, "/", 
		                sub_chapter_num, "/", 
		                chapter_name ) as guard, 
	chapter_id,
	syllabus_name,
	subject_name,
	chapter_num,
	sub_chapter_num,
	chapter_name,
	script_body,
	num_cards,
	num_VE,
	num_E,
	num_M,
	num_H,
	num_VH
from 
	jove_notes.chapter 
where 
	is_test_paper = 0 and 
	chapter_id = $chapterId 
QUERY;

		$colNames = [ "guard", "chapter_id", "syllabus_name", "subject_name", 
	                  "chapter_num", "sub_chapter_num", "chapter_name", "script_body",
	                  "num_cards", "num_VE", "num_E", "num_M", "num_H", "num_VH" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames ) ;
	}

	function getChaptersMetaData() {

$query = <<< QUERY
select 
	concat( "chapter:", syllabus_name, "/", 
		                subject_name, "/", 
		                chapter_num, "/", 
		                sub_chapter_num, "/", 
		                chapter_name ) as guard, 
	chapter_id,
	syllabus_name,
	subject_name,
	chapter_num,
	sub_chapter_num,
	chapter_name,
	num_cards,
	num_VE,
	num_E,
	num_M,
	num_H,
	num_VH
from 
	jove_notes.chapter 
where 
	is_test_paper = 0 
order by 
	syllabus_name asc,
	chapter_num asc,
	sub_chapter_num asc
QUERY;

		$colNames = [ "guard", "chapter_id", "syllabus_name", "subject_name", 
	                  "chapter_num", "sub_chapter_num", "chapter_name", "num_cards",
	                  "num_VE", "num_E", "num_M", "num_H", "num_VH" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames ) ;
	}

	function getChapterGuard( $chapterId ) {

$query = <<< QUERY
select 
	concat( "chapter:", syllabus_name, "/", 
		                subject_name, "/", 
		                chapter_num, "/", 
		                sub_chapter_num, "/", 
		                chapter_name ) as guard
from 
	jove_notes.chapter 
where 
	is_test_paper = 0 and 
	chapter_id = $chapterId 
QUERY;

		return parent::selectSingleValue( $query ) ;
	}
}

?>

