--------------------------------------------------------------------------------
-- Data model chnagesin preparation of the 'preparedness' feature changes
--
-- TODO - Yet to be updated in production
--
ALTER TABLE `user`.`auth_token` 
ADD COLUMN `auto_expire` BIT(1) NOT NULL DEFAULT 1 AFTER `token_type`;

UPDATE `user`.`auth_token` 
SET `auto_expire` = 1 ;

INSERT INTO `user`.`user` 
(`name`, `password`, `last_access_time`) 
VALUES 
('BatchRobot', 'r0b0', '');

INSERT INTO `user`.`auth_token` 
(`user_name`, `token`, `last_access_time`, `creation_time`, `token_type`, `auto_expire`) 
VALUES 
('BatchRobot', 'BATCH_ROBOT_AUTH_TOKEN', '', '', 'REMEMBER_ME', b'0');

INSERT INTO `user`.`user_roles` 
(`user_name`, `role_name`) 
VALUES ('BatchRobot', 'JN_BATCH_ROBOT');

ALTER TABLE `jove_notes`.`user_chapter_preferences` 
ADD COLUMN `is_in_syllabus` BIT(1) NOT NULL DEFAULT b'1' AFTER `is_deselected`;

UPDATE `jove_notes`.`user_chapter_preferences` 
SET `is_in_syllabus`=b'0';

CREATE TABLE `calendar_event` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `type` enum('Exam','General') NOT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `date` date NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#e3bc08',
  PRIMARY KEY (`id`),
  KEY `fk_calendar_event_1_idx` (`student_name`),
  CONSTRAINT `fk_calendar_event_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--------------------------------------------------------------------------------
-- Altered the auth_token table for the ghostly latency problem
--

ALTER TABLE `user`.`auth_token` 
CHANGE COLUMN `token` `token` VARCHAR(45) NOT NULL,
ADD PRIMARY KEY (`token`),
DROP INDEX `token_UNIQUE` ;

--------------------------------------------------------------------------------
-- Change put to porduction on 13th June
-- Entitlement for class 4 notes to Parth

insert into user.roles
( name, child_role ) 
values 
( "JN_CLASS_4_USER", null );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_4', 'PATH', '+:chapter:Class-4/**', 'Only Class-4 chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_4_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_CLASS_4', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_4_USER',  'ENT_ALIAS', 'JN_ENT_USE_CLASS_4_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Parth', 'JN_CLASS_4_USER' ) ;

--------------------------------------------------------------------------------
-- Change put to porduction on 8th June
-- Entitlement for class 2 notes to Munni

insert into user.roles
( name, child_role ) 
values 
( "JN_CLASS_2_USER", null );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_2', 'PATH', '+:chapter:Class-2/**', 'Only Class-2 chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_2_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_CLASS_2', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_2_USER',  'ENT_ALIAS', 'JN_ENT_USE_CLASS_2_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Munni', 'JN_CLASS_2_USER' ) ;

--------------------------------------------------------------------------------
-- Change put to production on 7th April 2016
-- Updated referencial integrity to cascade
ALTER TABLE `jove_notes`.`exercise_hom` 
DROP FOREIGN KEY `fk_eh_card_id`;
ALTER TABLE `jove_notes`.`exercise_hom` 
ADD CONSTRAINT `fk_eh_card_id`
  FOREIGN KEY (`card_id`)
  REFERENCES `jove_notes`.`card` (`card_id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

--------------------------------------------------------------------------------
-- Change moved to production on 28th June 2016

insert into user.roles
( name, child_role ) 
values 
( "JN_CLASS_10_USER", null );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_10', 'PATH', '+:chapter:Class-10/**', 'Only Class-10 chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_10_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_CLASS_10', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_10_USER',  'ENT_ALIAS', 'JN_ENT_USE_CLASS_10_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Deba', 'JN_CLASS_10_USER' ) ;

--------------------------------------------------------------------------------
-- Change put to production on 15th April 2016
-- Adding table for capturing habits of mind attributes which have contributed
-- to the wrong answer for an exercise
CREATE TABLE `jove_notes`.`exercise_hom` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_name` VARCHAR(45) NOT NULL,
  `card_id` INT NOT NULL,
  `session_id` INT NOT NULL COMMENT '       ',
  `hom_attribute` VARCHAR(256) NOT NULL,
  PRIMARY KEY (`id`));

ALTER TABLE `jove_notes`.`exercise_hom` 
ADD INDEX `fk_eh_student_name_idx` (`student_name` ASC),
ADD INDEX `fk_eh_card_id_idx` (`card_id` ASC),
ADD INDEX `fk_eh_session_id_idx` (`session_id` ASC);
ALTER TABLE `jove_notes`.`exercise_hom` 
ADD CONSTRAINT `fk_eh_student_name`
  FOREIGN KEY (`student_name`)
  REFERENCES `user`.`user` (`name`)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
ADD CONSTRAINT `fk_eh_card_id`
  FOREIGN KEY (`card_id`)
  REFERENCES `jove_notes`.`card` (`card_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_eh_session_id`
  FOREIGN KEY (`session_id`)
  REFERENCES `jove_notes`.`learning_session` (`session_id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

--------------------------------------------------------------------------------
-- Change put to production on 27th Mar 2016
-- Adding roles of class 9 and iit prep user for Deba and adding the required 
-- roles, entitlements, selectors, aliases etc.

insert into user.roles
( name, child_role ) 
values 
( "JN_CLASS_9_USER", null ), 
( "JN_IIT_PREP_USER", null );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_9', 'PATH', '+:chapter:Class-9/**', 'Only Class-9 chapters' ),
( 'JN_ALL_CHAPTERS_IIT_PREP', 'PATH', '+:chapter:IIT-Prep/**', 'IIT preparation chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_9_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_CLASS_9', 'NOTES, FLASH_CARD, CHAPTER_STATS' ),
( 'JN_ENT_USE_IIT_PREP_CHAPTERS', 'RAW', null, 'JN_ALL_CHAPTERS_IIT_PREP','NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_9_USER',  'ENT_ALIAS', 'JN_ENT_USE_CLASS_9_CHAPTERS' ),
( 'ROLE', 'JN_IIT_PREP_USER', 'ENT_ALIAS', 'JN_ENT_USE_IIT_PREP_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Deba', 'JN_CLASS_9_USER' ),
( 'Deba', 'JN_IIT_PREP_USER' ) ;

--------------------------------------------------------------------------------
-- Change put to production on 11th Mar 2016

INSERT INTO `user`.`user_preferences_master` 
(`key`, `default_value`, `description`) 
VALUES 
('jove_notes.flashCardFontZoomDelta', '0', 'Default font zoom for flash card question and answers');


