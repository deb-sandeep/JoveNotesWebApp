ALTER TABLE `jove_notes`.`chapter` 
ADD COLUMN `is_exercise_bank` BIT(1) NOT NULL DEFAULT 0 AFTER `is_test_paper`;

INSERT INTO `user`.`user_preferences_master` (`key`, `default_value`, `description`) 
VALUES 
('jove_notes.showHiddenExercises', 'false', 'By default hidden exercises are not shown');

delete from user.user_preferences where `key` = 'jove_notes.showHiddenTestPapers' ;

DELETE FROM `user`.`user_preferences_master` WHERE `key`='jove_notes.showHiddenTestPapers';

ALTER TABLE `jove_notes`.`chapter` 
DROP COLUMN `is_test_paper`;

-- Create exercise_session table
CREATE TABLE `exercise_session` (
  `session_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create exercise_session_chapter_map table
CREATE TABLE `exercise_session_chapter_map` (
  `exercise_session_id` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_session_id` int(11) NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exercise_session_id`,`chapter_session_id`),
  KEY `key_escm_1` (`chapter_session_id`),
  KEY `key_escm_2` (`exercise_session_id`),
  CONSTRAINT `escm_ex_session_fk` FOREIGN KEY (`exercise_session_id`) REFERENCES `exercise_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `escm_ch_session_fk` FOREIGN KEY (`chapter_session_id`) REFERENCES `learning_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

