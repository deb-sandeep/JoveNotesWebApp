<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardLearningSummaryDAO extends AbstractDAO {

    function __construct() {
        parent::__construct() ;
    }

  /** 
   * Refreshes the card_learning_summary by adding all those cards which have
   * been added new and have not yet been practiced by the user. This ensures
   * that the card_learning_summary table, post the refresh gives an accurate
   * count of #NS, L0.. MAS cards versus the current number of cards in the 
   * chapter.
   *
   * Note that cards can get added or removed at runtime (based on notes 
   * modifications). While the sync on removal is taken care by the cascade
   * of foreign key, the addition of new cards is handled by refreshing the table.
   */
    function refresh( $userName ) {

$query = <<< QUERY
insert into jove_notes.card_learning_summary
( chapter_id, notes_element_id, card_id, student_name )
select c.chapter_id, c.notes_element_id, c.card_id, '$userName'
from
  jove_notes.card c 
where
  c.card_id not in 
    (
      select cls.card_id
      from
        jove_notes.card_learning_summary cls
      where
        cls.student_name = '$userName'
    )
QUERY;

        parent::executeInsert( $query, 0 ) ;
    }

    function updateSummary( $userName, $cardId, $level, $rating, 
                            $learningEfficiency, $absoluteLearningEfficiency,
                            $timeTaken ) {

$query = <<< QUERY
update jove_notes.card_learning_summary
set
  current_level = '$level',
  num_attempts  = num_attempts + 1,
  temporal_ratings = CONCAT( temporal_ratings, '$rating' ),
  learning_efficiency = $learningEfficiency,
  abs_learning_efficiency = $absoluteLearningEfficiency,
  last_attempt_time = CURRENT_TIMESTAMP,
  total_time_spent = total_time_spent + $timeTaken
where
  student_name = '$userName' and
  card_id = $cardId
QUERY;

        parent::executeUpdate( $query ) ;
    }

    function getCardLearningSummary( $userName, $cardId ) {

$query = <<< QUERY
select 
  cls.current_level, cls.num_attempts, cls.temporal_ratings, 
  cls.learning_efficiency, cls.last_attempt_time,
  c.difficulty_level
from 
  jove_notes.card_learning_summary cls,
  jove_notes.card c
where
  cls.student_name = '$userName' and
  cls.card_id = $cardId and
  cls.card_id = c.card_id
QUERY;

        $colNames = [ "current_level", "num_attempts", "temporal_ratings", 
                      "learning_efficiency", "last_attempt_time", 
                      "difficulty_level" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames ) ;
    }

    function getCardsForUser( $userName, $chapterId ) {

$query = <<< QUERY
select  
    c.card_id, c.card_type, c.difficulty_level, c.content, ne.eval_vars, 
    ne.script_body, cls.num_attempts, cls.learning_efficiency, cls.current_level,
    cls.temporal_ratings, cls.last_attempt_time, cls.total_time_spent, 
    ne.marked_for_review, ne.element_type
from  
    jove_notes.card c, 
    jove_notes.card_learning_summary cls,
    jove_notes.notes_element ne
where  
    c.card_id = cls.card_id and  
    cls.student_name = '$userName' and  
    c.chapter_id = $chapterId and
    c.notes_element_id = ne.notes_element_id
QUERY;

        $colNames = [ "card_id", "card_type", "difficulty_level", "content", 
                      "eval_vars", "script_body", "num_attempts", 
                      "learning_efficiency", "current_level", "temporal_ratings", 
                      "last_attempt_time", "total_time_spent", "marked_for_review",
                      "element_type" ] ;

        return parent::getResultAsAssociativeArray( $query, $colNames, false ) ;
    }

    function resetLevelOfAllCards( $userName, $chapterId, $level ) {

$query = <<< QUERY
update   
  jove_notes.card_learning_summary
set
  current_level = '$level'
where  
    student_name = '$userName' and  
    chapter_id = $chapterId  
QUERY;

        parent::executeUpdate( $query ) ;
    }

    function getChapterWiseLevelCounts( $userName, $chapterIdList ) {

        $idList = implode( $chapterIdList, "," ) ;

$query = <<<QUERY
select 
  chapter_id, current_level, count( current_level ) as count
from
  jove_notes.card_learning_summary
where
  chapter_id in ( $idList ) and 
  student_name = '$userName'
group by 
  chapter_id, current_level
QUERY;
        
        return parent::getResultAsAssociativeArray( $query, 
                        [ "chapter_id", "current_level", "count" ], false ) ;
    }

    function getChapterWiseSSRMaturedCards( $userName ) {

$query = <<<QUERY
select 
  chapter_id, count(card_id) as num_ssr_matured_cards
from 
  jove_notes.card_learning_summary 
where 
  student_name = '$userName' and 
    ( ( current_level = 'L0' and TIMESTAMPDIFF(SECOND, last_attempt_time, CURRENT_TIMESTAMP )/86400 > 1 ) or 
      ( current_level = 'L1' and TIMESTAMPDIFF(SECOND, last_attempt_time, CURRENT_TIMESTAMP )/86400 > 2 ) or 
      ( current_level = 'L2' and TIMESTAMPDIFF(SECOND, last_attempt_time, CURRENT_TIMESTAMP )/86400 > 3 ) or 
      ( current_level = 'L3' and TIMESTAMPDIFF(SECOND, last_attempt_time, CURRENT_TIMESTAMP )/86400 > 4 ) or 
      ( current_level = 'NS' ) )
group by
  chapter_id
QUERY;
        
        return parent::getResultAsAssociativeArray( $query, 
                         [ "chapter_id", "num_ssr_matured_cards" ], false ) ;
    }

    function getDifficultyTimeAveragesForChapter( $userName, $chapterId ) {

$query = <<<QUERY
SELECT 
    c.card_type, c.difficulty_level, 
    sum( cls.num_attempts) as num_attempts, 
    ceil( sum( cls.total_time_spent )/sum( cls.num_attempts ) ) as avg_time
FROM 
    jove_notes.card_learning_summary cls,
    jove_notes.card c,
    jove_notes.chapter ch
WHERE
    c.card_id = cls.card_id and
    c.chapter_id = ch.chapter_id and
    cls.num_attempts > 0 and
    cls.student_name = '$userName' and
    ch.subject_name = ( select subject_name from jove_notes.chapter where chapter_id = $chapterId )
GROUP BY
    c.card_type, c.difficulty_level
ORDER BY
    ch.subject_name asc, 
    c.card_type asc, 
    c.difficulty_level asc
QUERY;

        return parent::getResultAsAssociativeArray( $query, 
                      [ "card_type", "difficulty_level", "num_attempts", "avg_time" ], false ) ;
    }
}
?>

