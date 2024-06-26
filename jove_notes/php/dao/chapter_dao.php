<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class ChapterDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	function getChapterSections( $chapterId ) {

$query = <<< QUERY
select 
    section, selected
from 
    jove_notes.chapter_section
where
    chapter_id = $chapterId
order by
    section asc
QUERY;

		$colNames = [ "section", "selected" ] ;
		
		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}	

	function updateChapterSection( $chapterId, $section, $selected ) {

$query = <<< QUERY
update 
    jove_notes.chapter_section
set
	selected = $selected 
where
    chapter_id = $chapterId and
    section = "$section"
QUERY;

		return parent::executeUpdate( $query ) ;
	}

	function getChapterActiveSectionPctForChapters( $chapterIdList ) {

		$chapterIds = implode( ",", $chapterIdList ) ;

$query = <<< QUERY
select
	chapter_id, (sum(selected)/count(section))*100 as sections_active_pct
from
	jove_notes.chapter_section
where
	chapter_id in ($chapterIds)
group by
    chapter_id
order by
    chapter_id desc
QUERY;

		$colNames = [ "chapter_id", "sections_active_pct" ] ;
		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
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
	chapter_id = $chapterId 
QUERY;

		$colNames = [ "guard", "chapter_id", "syllabus_name", "subject_name", 
	                  "chapter_num", "sub_chapter_num", "chapter_name", "script_body",
	                  "num_cards", "num_VE", "num_E", "num_M", "num_H", "num_VH" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames ) ;
	}

	function getAllChaptersMetaData( $chapterType ) {

		$chapterTypeSQLFilter = $this->getChapterTypeSQLFilter( $chapterType ) ;

$query = <<< QUERY
select 
	concat( "chapter:", c.syllabus_name, "/", 
		                c.subject_name, "/", 
		                c.chapter_num, "/", 
		                c.sub_chapter_num, "/", 
		                c.chapter_name ) as guard, 
	c.chapter_id,
	c.syllabus_name,
	c.subject_name,
	c.chapter_num,
	c.notes_completed,
	c.sub_chapter_num,
	c.chapter_name,
	c.num_cards,
	c.num_VE,
	c.num_E,
	c.num_M,
	c.num_H,
	c.num_VH
from 
	jove_notes.chapter c
where 
	$chapterTypeSQLFilter
order by 
	c.syllabus_name asc,
	c.subject_name asc,
	c.chapter_num asc,
	c.sub_chapter_num asc
QUERY;

		$colNames = [ "guard", "chapter_id", "syllabus_name", "subject_name", 
	                  "chapter_num", "notes_completed", "sub_chapter_num",
			          "chapter_name", "num_cards", "num_VE", "num_E", "num_M",
			          "num_H", "num_VH" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

	function getNonHiddenChaptersMetaData( $chapterType, $userName ) {

		$chapterTypeSQLFilter = $this->getChapterTypeSQLFilter( $chapterType ) ;

$query = <<< QUERY
select 
	concat( "chapter:", c.syllabus_name, "/", 
		                c.subject_name, "/", 
		                c.chapter_num, "/", 
		                c.sub_chapter_num, "/", 
		                c.chapter_name ) as guard, 
	c.chapter_id,
	c.syllabus_name,
	c.subject_name,
	c.chapter_num,
	c.notes_completed,
	c.sub_chapter_num,
	c.chapter_name,
	c.num_cards,
	c.num_VE,
	c.num_E,
	c.num_M,
	c.num_H,
	c.num_VH
from 
	jove_notes.chapter c left outer join 
	jove_notes.user_chapter_preferences ucp
on
	c.chapter_id = ucp.chapter_id
where 
	$chapterTypeSQLFilter and 
	( 
	  ucp.is_hidden = 0 or 
	  ucp.is_hidden is null or 
	  ucp.is_in_syllabus = 1 
	) and
	(
	  ucp.student_name = '$userName' or
	  ucp.student_name is null
	)
order by 
	c.syllabus_name asc,
	c.subject_name asc,
	c.chapter_num asc,
	c.sub_chapter_num asc
QUERY;

		$colNames = [ "guard", "chapter_id", "syllabus_name", "subject_name", 
	                  "chapter_num", "notes_completed", "sub_chapter_num",
			          "chapter_name", "num_cards",	"num_VE", "num_E", "num_M",
			          "num_H", "num_VH" ] ;

		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

	private function getChapterTypeSQLFilter( $chapterType ) {

		if( $chapterType == "exercises" ) {
			return " c.is_exercise_bank = 1 " ;
		}
		return " c.is_exercise_bank = 0 " ;
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
	chapter_id = $chapterId 
QUERY;

		return parent::selectSingleValue( $query ) ;
	}

	/**
	 * This function returns an associative array of chapterId versus the 
	 * guard for the chapter.
	 */
	function getChapterGuardMap( $chapterIdList ) {

		$chapterIds = implode( ",", $chapterIdList ) ;

$query = <<< QUERY
select 
	chapter_id,
	concat( "chapter:", syllabus_name, "/", 
		                subject_name, "/", 
		                chapter_num, "/", 
		                sub_chapter_num, "/", 
		                chapter_name ) as guard
from 
	jove_notes.chapter 
where 
	chapter_id in ($chapterIds)
QUERY;

		return parent::getResultAsMap( $query ) ;
	}

	function deleteChapter( $chapterId ) {

$query = <<< QUERY
delete
from 
	jove_notes.chapter 
where 
	chapter_id = $chapterId 
QUERY;

		parent::executeDelete( $query ) ;
	}
}

?>

