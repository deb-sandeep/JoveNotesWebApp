<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class UserChapterPrefsDAO extends AbstractDAO {

	function __construct() {
		parent::__construct() ;
	}

	function updateHiddenPreference( $userName, $chapterId, $hidden ) {

		$hiddenBool = $hidden ? 1 : 0 ;

$query = <<< QUERY
insert into 
	jove_notes.user_chapter_preferences( student_name, chapter_id, is_hidden ) 
values( '$userName', $chapterId, $hiddenBool ) 
on duplicate key update    
	is_hidden = values( is_hidden )
QUERY;

		parent::executeUpdate( $query, 0 ) ;
	}

	function updateDeselectPreference( $userName, $chapterIds, $selectionState ) {

		$deselectBool = $selectionState ? 0 : 1 ;

		$valuesStr = "" ;
		$chapterIdArray = explode( ",", $chapterIds ) ;

		if( count( $chapterIdArray ) == 1 && $chapterIdArray[0] == "" ) {
			return ;
		}		

		foreach( $chapterIdArray as $id ) {
			$valuesStr = $valuesStr . "( '$userName', $id, $deselectBool )," ;
		}
		$valuesStr = substr( $valuesStr, 0, strlen( $valuesStr ) - 1 ) ;

$query = <<< QUERY
insert into 
	jove_notes.user_chapter_preferences( student_name, chapter_id, is_deselected ) 
values $valuesStr 
on duplicate key update    
	is_deselected = values( is_deselected )
QUERY;

		parent::executeUpdate( $query, 0 ) ;
	}

	function updateInSyllabusPreference( $userName, $chapterIds, $selectionState ) {

		$inSyllabusBool = $selectionState ? 1 : 0 ;

		$valuesStr = "" ;
		$chapterIdArray = explode( ",", $chapterIds ) ;

		if( count( $chapterIdArray ) == 1 && $chapterIdArray[0] == "" ) {
			return ;
		}		

		foreach( $chapterIdArray as $id ) {
			$valuesStr = $valuesStr . "( '$userName', $id, $inSyllabusBool )," ;
		}
		$valuesStr = substr( $valuesStr, 0, strlen( $valuesStr ) - 1 ) ;

$query = <<< QUERY
insert into 
	jove_notes.user_chapter_preferences( student_name, chapter_id, is_in_syllabus ) 
values $valuesStr 
on duplicate key update    
	is_in_syllabus = values( is_in_syllabus )
QUERY;

		parent::executeUpdate( $query, 0 ) ;
	}

	/**
	 * This function returns an associative array with key as the chapter ID and
	 * value as either 0 or 1.. implying whether the chapter is visible or
	 * hidden respectively.
	 */
	function getChapterPreferencesForUser( $userName, $chapterIdList ) {

      $idList = implode( ",", $chapterIdList ) ;

$query = <<< QUERY
select chapter_id, is_hidden, is_deselected, is_in_syllabus
from jove_notes.user_chapter_preferences
where
	student_name = '$userName' and
	chapter_id in ( $idList ) 
QUERY;

		$colNames = [ "chapter_id", "is_hidden", "is_deselected", "is_in_syllabus" ] ;
		return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
	}

	function updateVisibilityInBatch( $userName, $visibilityData ) {
		
		$valuesStr = "( '$userName', $visibilityData[0], $visibilityData[1] )" ;
		for( $i=2; $i<count( $visibilityData ); $i+=2 ) {
			$valuesStr = $valuesStr . ",( '$userName', " 
				                    . $visibilityData[$i] . ", " 
				                    . $visibilityData[$i+1] . " )" ;
		}

$query = <<< QUERY
insert into 
	jove_notes.user_chapter_preferences( student_name, chapter_id, is_hidden ) 
values $valuesStr 
on duplicate key update    
	is_hidden = values( is_hidden )
QUERY;

		parent::executeUpdate( $query, 0 ) ;
	}
}
?>

