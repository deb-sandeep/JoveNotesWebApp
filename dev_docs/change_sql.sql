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


