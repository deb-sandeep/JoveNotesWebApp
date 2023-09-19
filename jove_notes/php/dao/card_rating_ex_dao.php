<?php

require_once( DOCUMENT_ROOT . "/lib-app/php/dao/abstract_dao.php" ) ;

class CardRatingExDAO extends AbstractDAO
{

    function __construct() {
        parent::__construct();
    }

    function insertRating($sessionId, $rating, $score, $timeTaken, $nextLevel, $userName, $cardId)
    {
        $query = <<< QUERY
INSERT INTO jove_notes.card_rating_ex (
    card_id,
    session_id,
    student_name,
    syllabus_name,
    subject_name,
    chapter_number,
    sub_chapter_number,
    chapter_name,
    section,
    card_type,
    difficulty_level,
    prior_level,
    prior_num_attempts,
    prior_total_time_spent,
    prior_temporal_ratings,
    prior_retention_value,
    prior_exam_preparedness,
    prior_learning_efficiency,
    prior_abs_learning_efficiency,
    prior_attempt_time,
    attempt_timestamp,
    attempt_gap_num_days,
    rating,
    points_earned,
    time_spent_sec,
    next_level
)
select 
    c.card_id,
    $sessionId                   as session_id,
    cls.student_name,
    ch.syllabus_name,
    ch.subject_name,
    ch.chapter_num,
    ch.sub_chapter_num,
    ch.chapter_name,
    ne.section,
    ne.element_type             as card_type,
    c.difficulty_level,
    cls.current_level           as prior_level,
    cls.num_attempts            as prior_num_attempts,
    cls.total_time_spent        as prior_total_time_spent,
    cls.temporal_ratings        as prior_temporal_ratings,
    cls.retention_value         as prior_retention_value,
    cls.exam_preparedness_value as prior_exam_preparedness,
    cls.learning_efficiency     as prior_learning_efficiency,
    cls.abs_learning_efficiency as prior_abs_learning_efficiency,
    cls.last_attempt_time       as prior_attempt_time,
    NOW()                       as attempt_timestamp, 
    DATEDIFF( NOW(), cls.last_attempt_time ) as attempt_gap_num_days,
    '$rating'                   as rating, 
    $score                      as points_earned, 
    $timeTaken                  as time_spent_sec,
    '$nextLevel'                as next_level
from 
    jove_notes.card_learning_summary cls 
    join jove_notes.card c on cls.card_id = c.card_id
    join jove_notes.notes_element ne on c.notes_element_id = ne.notes_element_id
    join jove_notes.chapter ch on ne.chapter_id = ch.chapter_id
where 
    cls.student_name = '$userName' and 
    c.card_id = $cardId 
QUERY;
        return parent::executeInsert($query);
    }
} ;