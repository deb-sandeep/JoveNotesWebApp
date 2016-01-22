ALTER TABLE `jove_notes`.`chapter` 
ADD COLUMN `is_exercise_bank` BIT(1) NOT NULL DEFAULT 0 AFTER `is_test_paper`;

INSERT INTO `user`.`user_preferences_master` (`key`, `default_value`, `description`) 
VALUES 
('jove_notes.showHiddenExercises', 'false', 'By default hidden exercises are not shown');

delete from user.user_preferences where `key` = 'jove_notes.showHiddenTestPapers' ;

DELETE FROM `user`.`user_preferences_master` WHERE `key`='jove_notes.showHiddenTestPapers';

ALTER TABLE `jove_notes`.`chapter` 
DROP COLUMN `is_test_paper`;


INSERT INTO `user`.`user` (`name`, `password`, `last_access_time`) 
VALUES ('Sandeep', '//tbd//', '');

insert into user.roles
( name, child_role ) 
values 
( "JN_SANDEEP", "JN_USER" );

insert into user.entitlement_selector_alias 
( alias_name, selector_type, selector_value, description )
values
( 'JN_SANDEEP_CHAPTERS', 'PATH', '+:chapter:Sandeep/**', 'Chapters only for myself' ) ;

insert into user.entitlement_alias 
( alias_name, entitlement_type, child_entitlement_alias, selector_alias, permissible_ops )
values
( 'JN_ENT_USE_SANDEEP_CHAPTERS', 'RAW', null, 'JN_SANDEEP_CHAPTERS', 'NOTES, FLASH_CARD, CHAPTER_STATS' );

insert into user.entity_entitlement
( entity_type, entity_name, entitlement_type, entitlement_alias )
values
( 'ROLE', 'JN_SANDEEP', 'ENT_ALIAS', 'JN_ENT_USE_SANDEEP_CHAPTERS' ) ;

insert into user.user_roles
( user_name, role_name )
values
( 'Sandeep', 'JN_SANDEEP' ) ;
