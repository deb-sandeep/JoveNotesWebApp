-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: localhost    Database: jove_notes
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `batch_manual_trigger`
--

DROP TABLE IF EXISTS `batch_manual_trigger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_manual_trigger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_name` varchar(128) NOT NULL,
  `trigger_flag` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_name_UNIQUE` (`job_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calendar_event`
--

DROP TABLE IF EXISTS `calendar_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `type` enum('Exam','General') NOT NULL,
  `subject` varchar(45) DEFAULT NULL,
  `title` varchar(128) NOT NULL,
  `date` date NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#e3bc08',
  PRIMARY KEY (`id`),
  KEY `fk_calendar_event_1_idx` (`student_name`),
  CONSTRAINT `fk_calendar_event_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card`
--

DROP TABLE IF EXISTS `card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card` (
  `card_id` int NOT NULL AUTO_INCREMENT,
  `notes_element_id` int NOT NULL,
  `chapter_id` int NOT NULL,
  `section` varchar(64) DEFAULT NULL,
  `card_type` varchar(45) NOT NULL,
  `difficulty_level` int NOT NULL,
  `content` text NOT NULL,
  `obj_correl_id` varchar(45) NOT NULL,
  `ready` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`card_id`),
  KEY `card_ibfk_1` (`chapter_id`),
  KEY `card_ibfk_2` (`notes_element_id`),
  CONSTRAINT `card_ibfk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_ibfk_2` FOREIGN KEY (`notes_element_id`) REFERENCES `notes_element` (`notes_element_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=116667 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_learning_summary`
--

DROP TABLE IF EXISTS `card_learning_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_learning_summary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chapter_id` int NOT NULL,
  `notes_element_id` int NOT NULL,
  `card_id` int NOT NULL,
  `student_name` varchar(45) NOT NULL,
  `current_level` enum('NS','L0','L1','L2','L3','MAS') NOT NULL DEFAULT 'NS',
  `num_attempts` int NOT NULL DEFAULT '0',
  `total_time_spent` int NOT NULL DEFAULT '0',
  `temporal_ratings` varchar(512) NOT NULL DEFAULT '',
  `retention_value` decimal(10,0) NOT NULL DEFAULT '0',
  `exam_preparedness_value` decimal(10,0) NOT NULL DEFAULT '0',
  `predicted_outcome_next_attempt` tinyint(1) NOT NULL DEFAULT '1',
  `learning_efficiency` int NOT NULL DEFAULT '0',
  `abs_learning_efficiency` int NOT NULL DEFAULT '0',
  `last_attempt_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_card` (`card_id`,`student_name`),
  KEY `chapter_id` (`chapter_id`),
  KEY `notes_element_id` (`notes_element_id`),
  KEY `student_name` (`student_name`),
  CONSTRAINT `card_learning_summary_ibfk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_learning_summary_ibfk_2` FOREIGN KEY (`notes_element_id`) REFERENCES `notes_element` (`notes_element_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_learning_summary_ibfk_3` FOREIGN KEY (`card_id`) REFERENCES `card` (`card_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_learning_summary_ibfk_4` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=472715 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_rating`
--

DROP TABLE IF EXISTS `card_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_rating` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) DEFAULT NULL,
  `session_id` int DEFAULT NULL,
  `chapter_id` int DEFAULT NULL,
  `card_id` int DEFAULT NULL,
  `notes_element_id` int DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT NULL,
  `rating` enum('E','A','P','H') DEFAULT NULL,
  `score` int DEFAULT NULL,
  `time_spent` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chapter_id` (`chapter_id`),
  KEY `notes_element_id` (`notes_element_id`),
  KEY `student_name` (`student_name`),
  KEY `fk_card_rating_1_idx` (`session_id`),
  KEY `card_rating_ibfk_3` (`card_id`),
  CONSTRAINT `card_rating_ibfk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_rating_ibfk_2` FOREIGN KEY (`notes_element_id`) REFERENCES `notes_element` (`notes_element_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_rating_ibfk_3` FOREIGN KEY (`card_id`) REFERENCES `card` (`card_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `card_rating_ibfk_4` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_card_rating_1` FOREIGN KEY (`session_id`) REFERENCES `learning_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=417488 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `card_rating_ex`
--

DROP TABLE IF EXISTS `card_rating_ex`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_rating_ex` (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int DEFAULT NULL,
  `session_id` int DEFAULT NULL,
  `student_name` varchar(45) DEFAULT NULL,
  `syllabus_name` varchar(64) NOT NULL,
  `subject_name` varchar(45) NOT NULL,
  `chapter_number` int NOT NULL,
  `sub_chapter_number` int NOT NULL,
  `chapter_name` text NOT NULL,
  `section` varchar(64) DEFAULT NULL,
  `card_type` varchar(45) NOT NULL,
  `difficulty_level` int NOT NULL DEFAULT '0',
  `prior_level` enum('NS','L0','L1','L2','L3','MAS') NOT NULL DEFAULT 'NS',
  `prior_num_attempts` int NOT NULL DEFAULT '0',
  `prior_total_time_spent` int NOT NULL DEFAULT '0',
  `prior_temporal_ratings` varchar(512) NOT NULL DEFAULT '',
  `prior_retention_value` decimal(10,0) NOT NULL DEFAULT '0',
  `prior_exam_preparedness` decimal(10,0) NOT NULL DEFAULT '0',
  `prior_learning_efficiency` int NOT NULL DEFAULT '0',
  `prior_abs_learning_efficiency` int NOT NULL DEFAULT '0',
  `prior_attempt_time` timestamp NULL DEFAULT NULL,
  `attempt_timestamp` timestamp NULL DEFAULT NULL,
  `predicted_outcome` tinyint(1) DEFAULT '0',
  `attempt_gap_num_days` int DEFAULT '0',
  `rating` enum('E','A','P','H') DEFAULT NULL,
  `points_earned` int NOT NULL DEFAULT '0',
  `time_spent_sec` int NOT NULL DEFAULT '0',
  `next_level` enum('NS','L0','L1','L2','L3','MAS') NOT NULL DEFAULT 'NS',
  PRIMARY KEY (`id`),
  KEY `card_id` (`card_id`),
  KEY `session_id` (`session_id`),
  KEY `syllabus_name` (`syllabus_name`),
  KEY `subject_name` (`subject_name`),
  KEY `chapter_number` (`chapter_number`),
  KEY `card_type` (`card_type`),
  KEY `crx_fk_4` (`student_name`),
  CONSTRAINT `crx_fk_3` FOREIGN KEY (`card_id`) REFERENCES `card` (`card_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `crx_fk_4` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `crx_fk_5` FOREIGN KEY (`session_id`) REFERENCES `learning_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123165 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter`
--

DROP TABLE IF EXISTS `chapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapter` (
  `chapter_id` int NOT NULL AUTO_INCREMENT,
  `is_exercise_bank` bit(1) NOT NULL DEFAULT b'0',
  `syllabus_name` varchar(256) NOT NULL,
  `subject_name` varchar(45) NOT NULL,
  `chapter_num` int NOT NULL,
  `sub_chapter_num` int NOT NULL,
  `chapter_name` text NOT NULL,
  `notes_completed` bit(1) DEFAULT b'0',
  `script_body` text,
  `num_cards` int DEFAULT '0',
  `num_VE` int DEFAULT '0',
  `num_E` int DEFAULT '0',
  `num_M` int DEFAULT '0',
  `num_H` int DEFAULT '0',
  `num_VH` int DEFAULT '0',
  PRIMARY KEY (`chapter_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2457 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_preparedness`
--

DROP TABLE IF EXISTS `chapter_preparedness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapter_preparedness` (
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int NOT NULL,
  `practice_level` varchar(45) DEFAULT NULL COMMENT 'null -> current, R1, R2, Rn -> Revision stages',
  `retention_score` decimal(10,0) NOT NULL DEFAULT '0',
  `preparedness_score` decimal(10,0) NOT NULL DEFAULT '0',
  `last_computed_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`student_name`,`chapter_id`),
  KEY `fk_chapter_preparedness_1_idx` (`student_name`),
  KEY `fk_chapter_preparedness_2_idx` (`chapter_id`),
  CONSTRAINT `fk_chapter_preparedness_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chapter_preparedness_2` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_preparedness_request_queue`
--

DROP TABLE IF EXISTS `chapter_preparedness_request_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapter_preparedness_request_queue` (
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int NOT NULL,
  `request_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_name`,`chapter_id`),
  KEY `fk_chapter_preparedness_request_queue_1_idx` (`chapter_id`),
  CONSTRAINT `fk_chapter_preparedness_request_queue_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chapter_preparedness_request_queue_2` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chapter_section`
--

DROP TABLE IF EXISTS `chapter_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapter_section` (
  `chapter_id` int NOT NULL,
  `section` varchar(80) NOT NULL,
  `selected` bit(1) NOT NULL DEFAULT b'1',
  UNIQUE KEY `uk_section` (`chapter_id`,`section`),
  KEY `fk_section_chapter_id_idx` (`chapter_id`),
  CONSTRAINT `fk_section_chapter_id` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_event`
--

DROP TABLE IF EXISTS `exercise_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_event` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercise_id` int NOT NULL,
  `timestamp` bigint NOT NULL,
  `phase_name` varchar(45) NOT NULL,
  `event_name` varchar(45) NOT NULL,
  `event_type` varchar(45) NOT NULL,
  `question_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ee_exercise_id_idx` (`exercise_id`),
  KEY `fk_ee_question_id_idx` (`question_id`),
  CONSTRAINT `fk_ee_exercise_id` FOREIGN KEY (`exercise_id`) REFERENCES `exercise_session` (`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ee_question_id` FOREIGN KEY (`question_id`) REFERENCES `card` (`card_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7696 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_hom`
--

DROP TABLE IF EXISTS `exercise_hom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_hom` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `card_id` int NOT NULL,
  `session_id` int NOT NULL COMMENT '       ',
  `hom_attribute` varchar(256) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eh_student_name_idx` (`student_name`),
  KEY `fk_eh_card_id_idx` (`card_id`),
  KEY `fk_eh_session_id_idx` (`session_id`),
  CONSTRAINT `fk_eh_card_id` FOREIGN KEY (`card_id`) REFERENCES `card` (`card_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_eh_session_id` FOREIGN KEY (`session_id`) REFERENCES `learning_session` (`session_id`),
  CONSTRAINT `fk_eh_student_name` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1315 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_question`
--

DROP TABLE IF EXISTS `exercise_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_question` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercise_id` int NOT NULL,
  `question_id` int NOT NULL,
  `total_time_taken` int NOT NULL DEFAULT '0',
  `num_attempts` int NOT NULL DEFAULT '0',
  `study_time` int NOT NULL DEFAULT '0',
  `attempt_time` int NOT NULL DEFAULT '0',
  `review_time` int NOT NULL DEFAULT '0',
  `pause_time` int NOT NULL DEFAULT '0',
  `marks_obtained` int NOT NULL DEFAULT '0',
  `result` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ex_q` (`exercise_id`,`question_id`),
  KEY `fk_ex_q_session_idx` (`exercise_id`),
  KEY `fk_ex_q_question_idx` (`question_id`),
  CONSTRAINT `fk_ex_q_question` FOREIGN KEY (`question_id`) REFERENCES `card` (`card_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_ex_q_session` FOREIGN KEY (`exercise_id`) REFERENCES `exercise_session` (`session_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1950 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_session`
--

DROP TABLE IF EXISTS `exercise_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_session` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `completed` bit(1) DEFAULT b'0',
  `student_name` varchar(45) NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total_solve_time` int DEFAULT '0',
  `pause_time` int DEFAULT '0',
  `review_time` int DEFAULT '0',
  `study_time` int DEFAULT '0',
  `total_questions` int DEFAULT '0',
  `num_correct` int DEFAULT '0',
  `total_marks` int DEFAULT '0',
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1582 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `exercise_session_chapter_map`
--

DROP TABLE IF EXISTS `exercise_session_chapter_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise_session_chapter_map` (
  `exercise_session_id` int NOT NULL AUTO_INCREMENT,
  `chapter_session_id` int NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exercise_session_id`,`chapter_session_id`),
  KEY `key_escm_1` (`chapter_session_id`),
  KEY `key_escm_2` (`exercise_session_id`),
  CONSTRAINT `escm_ch_session_fk` FOREIGN KEY (`chapter_session_id`) REFERENCES `learning_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `escm_ex_session_fk` FOREIGN KEY (`exercise_session_id`) REFERENCES `exercise_session` (`session_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1582 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `learning_session`
--

DROP TABLE IF EXISTS `learning_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_session` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int NOT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `time_spent` int DEFAULT '0',
  `points_earned` int DEFAULT '0',
  `num_cards_practiced` int DEFAULT '0',
  `num_E` int DEFAULT '0',
  `num_A` int DEFAULT '0',
  `num_P` int DEFAULT '0',
  `num_H` int DEFAULT '0',
  `num_NS` int DEFAULT '0',
  `num_L0` int DEFAULT '0',
  `num_L1` int DEFAULT '0',
  `num_L2` int DEFAULT '0',
  `num_L3` int DEFAULT '0',
  `num_MAS` int DEFAULT '0',
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB AUTO_INCREMENT=64041 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notes_element`
--

DROP TABLE IF EXISTS `notes_element`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes_element` (
  `notes_element_id` int NOT NULL AUTO_INCREMENT,
  `chapter_id` int NOT NULL,
  `section` varchar(64) DEFAULT NULL,
  `element_type` varchar(45) NOT NULL,
  `difficulty_level` int NOT NULL,
  `content` text NOT NULL,
  `eval_vars` text,
  `script_body` text,
  `obj_correl_id` varchar(45) NOT NULL,
  `ready` bit(1) NOT NULL DEFAULT b'1',
  `hidden_from_view` bit(1) NOT NULL DEFAULT b'0',
  `marked_for_review` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`notes_element_id`),
  KEY `notes_element_ibfk_1` (`chapter_id`),
  CONSTRAINT `notes_element_ibfk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=102336 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `persistent_queue`
--

DROP TABLE IF EXISTS `persistent_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `persistent_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(45) DEFAULT NULL,
  `creation_time` datetime NOT NULL,
  `serialized_obj` blob NOT NULL,
  `num_times_processed` int DEFAULT '0',
  `last_process_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2829 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `points_redemption`
--

DROP TABLE IF EXISTS `points_redemption`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `points_redemption` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `points` int NOT NULL DEFAULT '0',
  `redemption_item` varchar(80) DEFAULT NULL,
  `redemption_qty` int DEFAULT '1',
  `redemption_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_name_fk_idx` (`student_name`),
  CONSTRAINT `student_name_fk` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quote_master`
--

DROP TABLE IF EXISTS `quote_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quote_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section` varchar(64) NOT NULL,
  `speaker` varchar(64) NOT NULL,
  `hidden` bit(1) DEFAULT NULL,
  `quote` varchar(256) NOT NULL,
  `starred` int NOT NULL DEFAULT '0',
  `num_shows` int NOT NULL DEFAULT '0',
  `last_display_time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_uk` (`section`,`speaker`,`quote`)
) ENGINE=InnoDB AUTO_INCREMENT=1637 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `redemption_catalog`
--

DROP TABLE IF EXISTS `redemption_catalog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `redemption_catalog` (
  `item_name` varchar(80) NOT NULL,
  `points_per_item` int NOT NULL DEFAULT '0',
  `multiple_units_allowed` tinyint(1) NOT NULL DEFAULT '1',
  `num_redemptions_per_day` int NOT NULL DEFAULT '1000',
  PRIMARY KEY (`item_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `remote_flash_queue`
--

DROP TABLE IF EXISTS `remote_flash_queue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `remote_flash_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `create_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id` int NOT NULL,
  `student_name` varchar(45) NOT NULL,
  `msg_type` varchar(45) NOT NULL,
  `msg_content` text,
  PRIMARY KEY (`id`),
  KEY `fk_remote_flash_queue_1_idx` (`session_id`),
  KEY `student_name` (`student_name`),
  CONSTRAINT `fk_remote_flash_queue_1` FOREIGN KEY (`session_id`) REFERENCES `learning_session` (`session_id`) ON UPDATE CASCADE,
  CONSTRAINT `remote_flash_queue_ibfk_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=525080 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_score`
--

DROP TABLE IF EXISTS `student_score`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_score` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(45) NOT NULL,
  `score_type` enum('INC','TOT') NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `last_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subject_name` varchar(45) DEFAULT NULL,
  `chapter_id` int DEFAULT NULL,
  `notes` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_name` (`student_name`),
  CONSTRAINT `student_score_ibfk_1` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=428842 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_chapter_preferences`
--

DROP TABLE IF EXISTS `user_chapter_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_chapter_preferences` (
  `student_name` varchar(45) NOT NULL,
  `chapter_id` int NOT NULL,
  `is_hidden` bit(1) NOT NULL DEFAULT b'0',
  `is_deselected` bit(1) NOT NULL DEFAULT b'0',
  `is_in_syllabus` bit(1) NOT NULL DEFAULT b'0',
  `is_current_focus` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`student_name`,`chapter_id`),
  KEY `chapter_id` (`chapter_id`),
  CONSTRAINT `user_chapter_preferences_ibfk_1` FOREIGN KEY (`chapter_id`) REFERENCES `chapter` (`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_chapter_preferences_ibfk_2` FOREIGN KEY (`student_name`) REFERENCES `user`.`user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 21:09:52
-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: localhost    Database: user
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_token`
--

DROP TABLE IF EXISTS `auth_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_token` (
  `user_name` varchar(45) NOT NULL,
  `token` varchar(45) NOT NULL,
  `last_access_time` datetime DEFAULT NULL,
  `creation_time` datetime NOT NULL,
  `token_type` varchar(45) NOT NULL,
  `auto_expire` bit(1) NOT NULL DEFAULT b'1',
  PRIMARY KEY (`token`),
  KEY `fk_user_name_idx` (`user_name`),
  CONSTRAINT `fk_user_name` FOREIGN KEY (`user_name`) REFERENCES `user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entitlement_alias`
--

DROP TABLE IF EXISTS `entitlement_alias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entitlement_alias` (
  `alias_name` varchar(255) NOT NULL,
  `entitlement_type` enum('ENT_ALIAS','RAW') NOT NULL,
  `child_entitlement_alias` varchar(255) DEFAULT NULL,
  `selector_alias` varchar(255) DEFAULT NULL,
  `permissible_ops` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entitlement_selector_alias`
--

DROP TABLE IF EXISTS `entitlement_selector_alias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entitlement_selector_alias` (
  `alias_name` varchar(255) NOT NULL,
  `selector_type` enum('SELECTOR_ALIAS','PATH') NOT NULL,
  `selector_value` text NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `entity_entitlement`
--

DROP TABLE IF EXISTS `entity_entitlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entity_entitlement` (
  `entity_type` enum('ROLE','USER') NOT NULL,
  `entity_name` varchar(255) NOT NULL,
  `entitlement_type` enum('ENT_ALIAS','RAW') NOT NULL,
  `selector_alias` varchar(255) DEFAULT NULL,
  `permissible_ops` text,
  `entitlement_alias` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `name` varchar(255) NOT NULL,
  `child_role` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `name` varchar(45) NOT NULL,
  `password` varchar(45) NOT NULL COMMENT 'Note: For now the password is being stored as clear text. Once the self service mode is enabled, this needs to be changed to hash.',
  `last_access_time` datetime DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preferences`
--

DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `user_name` varchar(45) NOT NULL DEFAULT '""',
  `key` varchar(128) NOT NULL,
  `value` text,
  PRIMARY KEY (`user_name`,`key`),
  KEY `fk_key_idx` (`key`),
  CONSTRAINT `fk_user_preferences_1` FOREIGN KEY (`key`) REFERENCES `user_preferences_master` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preferences_master`
--

DROP TABLE IF EXISTS `user_preferences_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences_master` (
  `key` varchar(128) NOT NULL,
  `default_value` text NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_name` varchar(45) NOT NULL,
  `role_name` varchar(255) NOT NULL,
  PRIMARY KEY (`user_name`,`role_name`),
  KEY `fk_role_name_idx` (`role_name`),
  CONSTRAINT `fk_ur_user_name` FOREIGN KEY (`user_name`) REFERENCES `user` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06 21:09:52
