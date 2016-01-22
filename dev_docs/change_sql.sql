ALTER TABLE `jove_notes`.`chapter` 
ADD COLUMN `is_exercise_bank` BIT(1) NOT NULL DEFAULT 0 AFTER `is_test_paper`;

INSERT INTO `user`.`user_preferences_master` (`key`, `default_value`, `description`) 
VALUES 
('jove_notes.showHiddenExercises', 'false', 'By default hidden exercises are not shown');

delete from user.user_preferences where `key` = 'jove_notes.showHiddenTestPapers' ;

DELETE FROM `user`.`user_preferences_master` WHERE `key`='jove_notes.showHiddenTestPapers';

ALTER TABLE `jove_notes`.`chapter` 
DROP COLUMN `is_test_paper`;



