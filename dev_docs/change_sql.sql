-- ------------------------------------------------------------------------------
-- Data model changes to set entitlements for IIT-Mathematics
--
-- Moved to production on 10th June 2018

insert into user.roles
( name, child_role ) 
values 
( "JN_IIT_MATH_USER", "JN_USER" );

insert into user.user_roles
( user_name, role_name )
values
( 'Deba', 'JN_IIT_MATH_USER' ) ;

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_IIT_MATH', 'PATH', '+:chapter:IIT-Mathematics/**', 'Only IIT Mathematics chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_IIT_MATH_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_IIT_MATH', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_IIT_MATH_USER',  'ENT_ALIAS', 'JN_ENT_USE_IIT_MATH_CHAPTERS' );
 
-- ------------------------------------------------------------------------------
-- Data model changes to set entitlements for IIT-Chemistry
--
-- Moved to production on 20th May 2018

insert into user.roles
( name, child_role ) 
values 
( "JN_IIT_CHEM_USER", "JN_USER" );

insert into user.user_roles
( user_name, role_name )
values
( 'Deba', 'JN_IIT_CHEM_USER' ) ;

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_IIT_CHEM', 'PATH', '+:chapter:IIT-Chemistry/**', 'Only IIT Chemistry chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_IIT_CHEM_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_IIT_CHEM', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_IIT_CHEM_USER',  'ENT_ALIAS', 'JN_ENT_USE_IIT_CHEM_CHAPTERS' );
 
--- -----------------------------------------------------------------------------
-- Changes for enabling Munni as a JN_CLASS_4_USER
--
-- Moved to production on 6th May 2018 - 7:34 PM

update user.roles set child_role='JN_USER' where name='JN_CLASS_4_USER';
insert into user.user_roles (user_name, role_name) values ( 'Munni', 'JN_CLASS_4_USER' );

-- ------------------------------------------------------------------------------
-- Changes for syllabus merged functionality
--

INSERT INTO `user`.`user_preferences_master` (`key`, `default_value`, `description`) 
VALUES ('jove_notes.syllabusMerged', 'false', 'Classify the chapters by their syllabus by default');

-- ------------------------------------------------------------------------------
-- Data model changes to set entitlements for IIT-Physics
--

insert into user.roles
( name, child_role ) 
values 
( "JN_IIT_PHY_USER", "JN_USER" );

insert into user.user_roles
( user_name, role_name )
values
( 'Deba', 'JN_IIT_PHY_USER' ) ;

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_IIT_PHY', 'PATH', '+:chapter:IIT-Physics/**', 'Only IIT Physics chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_IIT_PHY_CHAPTERS',  'RAW', null, 'JN_ALL_CHAPTERS_IIT_PHY', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_IIT_PHY_USER',  'ENT_ALIAS', 'JN_ENT_USE_IIT_PHY_CHAPTERS' );

delete from jove_notes.chapter where syllabus_name='IIT-Prep';
delete from user.entitlement_selector_alias where alias_name='JN_ALL_CHAPTERS_IIT_PREP' ;
delete from user.entitlement_alias where alias_name='JN_ENT_USE_IIT_PREP_CHAPTERS' ;
delete from user.entity_entitlement where entity_name='JN_IIT_PREP_USER';
delete from user.roles where name='JN_IIT_PREP_USER';
delete from user.user_roles where role_name='JN_IIT_PREP_USER';
  
-- ------------------------------------------------------------------------------
-- Data model changes to resolve class-3 conflicts between ICSE-STM and CBSE-INS
--
-- Moved to production on 26th April 2017 @ 2310 Hrs
--
insert into user.roles
( name, child_role ) 
values 
( "JN_CBSE_INS_CLASS_3_USER", "JN_USER" ),
( "JN_CBSE_INS_CLASS_4_USER", "JN_USER" );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_CBSE_INS_ALL_CHAPTERS_CLASS_3', 'PATH', '+:chapter:CBSE-INS-Class-3/**', 'Only CBSE INS Class-3 chapters' ),
( 'JN_CBSE_INS_ALL_CHAPTERS_CLASS_4', 'PATH', '+:chapter:CBSE-INS-Class-4/**', 'Only CBSE INS Class-4 chapters' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CBSE_INS_CLASS_3_CHAPTERS', 'RAW', null, 'JN_CBSE_INS_ALL_CHAPTERS_CLASS_3', 'NOTES, FLASH_CARD, CHAPTER_STATS' ),
( 'JN_ENT_USE_CBSE_INS_CLASS_4_CHAPTERS', 'RAW', null, 'JN_CBSE_INS_ALL_CHAPTERS_CLASS_4', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CBSE_INS_CLASS_3_USER', 'ENT_ALIAS', 'JN_ENT_USE_CBSE_INS_CLASS_3_CHAPTERS' ),
( 'ROLE', 'JN_CBSE_INS_CLASS_4_USER', 'ENT_ALIAS', 'JN_ENT_USE_CBSE_INS_CLASS_4_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Parth', 'JN_CBSE_INS_CLASS_3_USER' ),
( 'Parth', 'JN_CBSE_INS_CLASS_4_USER' ) ;

delete from user.user_roles where
user_name = 'Parth' and
role_name in ( 'JN_CLASS_3_USER', 'JN_CLASS_4_USER' ) ;

delete from jove_notes.chapter where syllabus_name in ( 'Class-3', 'Class-4' ) ;

-- ------------------------------------------------------------------------------
-- Data model chnages in preparation of the 'preparedness batch' feature changes
--
-- Moved to production on 20th April 2017 @ 2341 Hrs
--

-- update /env/environment with DB_PASSSWORD

CREATE TABLE `chapter_preparedness` (
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `preparedness_score` decimal(10,0) NOT NULL DEFAULT '0',
  `retention_score` decimal(10,0) NOT NULL DEFAULT '0',
  `last_computed_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`student_name`,`chapter_id`),
  KEY `fk_chapter_preparedness_1_idx` (`student_name`),
  KEY `fk_chapter_preparedness_2_idx` (`chapter_id`),
  CONSTRAINT `fk_chapter_preparedness_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chapter_preparedness_2` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `chapter_preparedness_request_queue` (
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `request_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_name`,`chapter_id`),
  KEY `fk_chapter_preparedness_request_queue_1_idx` (`chapter_id`),
  CONSTRAINT `fk_chapter_preparedness_request_queue_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chapter_preparedness_request_queue_2` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


ALTER TABLE `jove_notes`.`card_learning_summary` 
ADD COLUMN `retention_value` DECIMAL NOT NULL DEFAULT 0 AFTER `temporal_ratings`,
ADD COLUMN `exam_preparedness_value` DECIMAL NOT NULL DEFAULT 0 AFTER `retention_value`;

-- ------------------------------------------------------------------------------
-- Data model chnagesin preparation of the 'preparedness' feature changes
--
-- Implemented in production on 6th April 2017 - 1:06 AM
--
ALTER TABLE `user`.`auth_token` 
ADD COLUMN `auto_expire` BIT(1) NOT NULL DEFAULT 1 AFTER `token_type`;

UPDATE `user`.`auth_token` 
SET `auto_expire` = 1 ;

INSERT INTO `user`.`user` 
(`name`, `password`, `last_access_time`) 
VALUES 
('BatchRobot', 'r0b0', NULL);

INSERT INTO `user`.`auth_token` 
(`user_name`, `token`, `last_access_time`, `creation_time`, `token_type`, `auto_expire`) 
VALUES 
('BatchRobot', 'BATCH_ROBOT_AUTH_TOKEN', NULL, NOW(), 'REMEMBER_ME', b'0');

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

-- ------------------------------------------------------------------------------
-- Altered the auth_token table for the ghostly latency problem
--

ALTER TABLE `user`.`auth_token` 
CHANGE COLUMN `token` `token` VARCHAR(45) NOT NULL,
ADD PRIMARY KEY (`token`),
DROP INDEX `token_UNIQUE` ;

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Change put to production on 11th Mar 2016

INSERT INTO `user`.`user_preferences_master` 
(`key`, `default_value`, `description`) 
VALUES 
('jove_notes.flashCardFontZoomDelta', '0', 'Default font zoom for flash card question and answers');

-- ==============================================================================
-- Make a entitlement for class 8

insert into user.roles
( name, child_role )
values
    ( "JN_CLASS_8_USER", null );

insert into user.entitlement_selector_alias
( alias_name, selector_type, selector_value, description )
values
    ( 'JN_ALL_CHAPTERS_CLASS_8', 'PATH', '+:chapter:Class-8/**', 'Only Class-8 chapters' ) ;

insert into user.entitlement_alias
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
    ( 'JN_ENT_USE_CLASS_8_CHAPTERS', 'RAW', null, 'JN_ALL_CHAPTERS_CLASS_8', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
    ( 'ROLE', 'JN_CLASS_8_USER', 'ENT_ALIAS', 'JN_ENT_USE_CLASS_8_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
    ( 'Munni', 'JN_CLASS_8_USER' ) ;

-- ==============================================================================
-- Make a entitlement for class 9
-- Applied on 26th Feb 2023 - 1337Hrs

insert into user.roles
( name, child_role )
values
( "JN_CLASS_9_USER", null );

insert into user.entitlement_selector_alias
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_9', 'PATH', '+:chapter:Class-9/**', 'Only Class-9 chapters' ) ;

insert into user.entitlement_alias
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_9_CHAPTERS', 'RAW', null, 'JN_ALL_CHAPTERS_CLASS_9', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_9_USER', 'ENT_ALIAS', 'JN_ENT_USE_CLASS_9_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Munni', 'JN_CLASS_9_USER' ) ;


-- ==============================================================================
-- Make a entitlement for class X
-- Applied on 28th Feb 2024 - 20:19:25

insert into user.roles
( name, child_role )
values
( "JN_CLASS_X_USER", null );

insert into user.entitlement_selector_alias
( alias_name, selector_type, selector_value, description )
values
( 'JN_ALL_CHAPTERS_CLASS_X', 'PATH', '+:chapter:Class-X/**', 'Only Class-X chapters' ) ;

insert into user.entitlement_alias
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_CLASS_X_CHAPTERS', 'RAW', null, 'JN_ALL_CHAPTERS_CLASS_X', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_CLASS_X_USER', 'ENT_ALIAS', 'JN_ENT_USE_CLASS_X_CHAPTERS' );

insert into user.user_roles
( user_name, role_name )
values
( 'Munni', 'JN_CLASS_X_USER' ) ;