-- Database Backup
-- Generated: 2025-12-25T06:01:04.610Z
-- Database: schoolwizard

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `admission_contact_details`;
CREATE TABLE `admission_contact_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `call_us_numbers` text DEFAULT NULL,
  `email_us_addresses` text DEFAULT NULL,
  `visit_us_address` text DEFAULT NULL,
  `office_hours` text DEFAULT NULL,
  `important_dates_visible` tinyint(1) DEFAULT 1,
  `contact_details_visible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_contact_details` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admission_contact_details` VALUES
(2, '["+91 1234567890", "+91 9876543210"]', '["admissions@schoolname.edu", "info@schoolname.edu"]', 'School Address, City
State - PIN Code', 'Monday - Friday: 9:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM', 1, 1, Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `admission_enquiries`;
CREATE TABLE `admission_enquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `enquiry_date` date NOT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `number_of_child` int(11) DEFAULT 1,
  `status` enum('pending','contacted','enrolled','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `reference_id` (`reference_id`),
  KEY `source_id` (`source_id`),
  KEY `class_id` (`class_id`),
  KEY `idx_status` (`status`),
  KEY `idx_enquiry_date` (`enquiry_date`),
  CONSTRAINT `admission_enquiries_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admission_enquiries_ibfk_2` FOREIGN KEY (`reference_id`) REFERENCES `front_office_references` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admission_enquiries_ibfk_3` FOREIGN KEY (`source_id`) REFERENCES `front_office_sources` (`id`) ON DELETE SET NULL,
  CONSTRAINT `admission_enquiries_ibfk_4` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `admission_important_dates`;
CREATE TABLE `admission_important_dates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date_value` date NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admission_important_dates` VALUES
(1, 'Application Start', Wed Jan 01 2025 00:00:00 GMT+0530 (India Standard Time), 'Admission applications open for the new academic year', 1, 1, Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time)),
(2, 'Last Date', Mon Mar 31 2025 00:00:00 GMT+0530 (India Standard Time), 'Last date to submit admission applications', 2, 1, Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time)),
(3, 'Assessment', Tue Apr 15 2025 00:00:00 GMT+0530 (India Standard Time), 'Student assessment and interaction sessions (April 15-30, 2025)', 3, 1, Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time)),
(4, 'Result Declaration', Thu May 15 2025 00:00:00 GMT+0530 (India Standard Time), 'Admission results will be announced', 4, 1, Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:56 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `admission_inquiries`;
CREATE TABLE `admission_inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_name` varchar(255) NOT NULL,
  `parent_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `grade` varchar(50) NOT NULL,
  `previous_school` varchar(255) DEFAULT NULL,
  `address` text NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','contacted','approved','rejected') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `admit_card_templates`;
CREATE TABLE `admit_card_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `heading` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `exam_name` varchar(255) DEFAULT NULL,
  `header_left_text` varchar(255) DEFAULT NULL,
  `header_center_text` varchar(255) DEFAULT NULL,
  `header_right_text` varchar(255) DEFAULT NULL,
  `body_text` text DEFAULT NULL,
  `footer_left_text` varchar(255) DEFAULT NULL,
  `footer_center_text` varchar(255) DEFAULT NULL,
  `footer_right_text` varchar(255) DEFAULT NULL,
  `header_height` int(11) DEFAULT 100,
  `footer_height` int(11) DEFAULT 50,
  `body_height` int(11) DEFAULT 400,
  `body_width` int(11) DEFAULT 800,
  `show_student_photo` tinyint(1) DEFAULT 1,
  `photo_height` int(11) DEFAULT 100,
  `background_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alumni`;
CREATE TABLE `alumni` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `admission_no` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `alternate_phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT 'male',
  `graduation_year` year(4) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `class_name` varchar(100) DEFAULT NULL,
  `section_name` varchar(100) DEFAULT NULL,
  `current_profession` varchar(255) DEFAULT NULL,
  `current_company` varchar(255) DEFAULT NULL,
  `current_designation` varchar(255) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `permanent_address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `pincode` varchar(20) DEFAULT NULL,
  `photo` varchar(500) DEFAULT NULL,
  `facebook_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL,
  `achievements` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_no` (`admission_no`),
  KEY `student_id` (`student_id`),
  KEY `section_id` (`section_id`),
  KEY `idx_graduation_year` (`graduation_year`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_status` (`status`),
  KEY `idx_email` (`email`),
  KEY `idx_admission_no` (`admission_no`),
  CONSTRAINT `alumni_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alumni_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `alumni_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alumni_events`;
CREATE TABLE `alumni_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_title` varchar(255) NOT NULL,
  `event_description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `event_end_date` date DEFAULT NULL,
  `event_end_time` time DEFAULT NULL,
  `event_venue` varchar(255) DEFAULT NULL,
  `event_address` text DEFAULT NULL,
  `event_type` enum('reunion','networking','seminar','workshop','other') DEFAULT 'reunion',
  `registration_required` tinyint(1) DEFAULT 0,
  `registration_deadline` date DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `registration_fee` decimal(10,2) DEFAULT 0.00,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `event_image` varchar(500) DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `alumni_events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `alumni_event_registrations`;
CREATE TABLE `alumni_event_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `alumni_id` int(11) NOT NULL,
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_status` enum('pending','paid','free') DEFAULT 'pending',
  `payment_amount` decimal(10,2) DEFAULT 0.00,
  `payment_date` timestamp NULL DEFAULT NULL,
  `attendance_status` enum('registered','attended','absent','cancelled') DEFAULT 'registered',
  `attendance_marked_at` timestamp NULL DEFAULT NULL,
  `special_requirements` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_registration` (`event_id`,`alumni_id`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_alumni_id` (`alumni_id`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_attendance_status` (`attendance_status`),
  CONSTRAINT `alumni_event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `alumni_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `alumni_event_registrations_ibfk_2` FOREIGN KEY (`alumni_id`) REFERENCES `alumni` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_records`;
CREATE TABLE `backup_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `backup_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL COMMENT 'File size in bytes',
  `backup_type` enum('manual','automatic') DEFAULT 'manual',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_backup_type` (`backup_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `backup_records_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `backup_settings`;
CREATE TABLE `backup_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `auto_backup_enabled` tinyint(1) DEFAULT 0,
  `backup_frequency` enum('daily','weekly','monthly') DEFAULT 'daily',
  `backup_time` time DEFAULT '02:00:00',
  `keep_backups` int(11) DEFAULT 7 COMMENT 'Number of backups to keep',
  `cron_secret_key` varchar(255) DEFAULT NULL,
  `last_backup_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cron_secret_key` (`cron_secret_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `backup_settings` VALUES
(1, 0, 'daily', '02:00:00', 7, NULL, NULL, Wed Dec 17 2025 19:35:28 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:28 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `books`;
CREATE TABLE `books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_title` varchar(255) NOT NULL,
  `book_no` varchar(100) DEFAULT NULL,
  `isbn_no` varchar(100) DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `rack_no` varchar(100) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 0,
  `available_qty` int(11) NOT NULL DEFAULT 0,
  `book_price` decimal(10,2) DEFAULT NULL,
  `inward_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `book_no` (`book_no`),
  KEY `idx_book_title` (`book_title`),
  KEY `idx_book_no` (`book_no`),
  KEY `idx_isbn` (`isbn_no`),
  KEY `idx_subject` (`subject_id`),
  CONSTRAINT `books_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `book_issues`;
CREATE TABLE `book_issues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `issue_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `due_date` date NOT NULL,
  `return_status` enum('issued','returned','lost','damaged') DEFAULT 'issued',
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `issued_by` int(11) DEFAULT NULL,
  `returned_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `issued_by` (`issued_by`),
  KEY `returned_by` (`returned_by`),
  KEY `idx_book` (`book_id`),
  KEY `idx_member` (`member_id`),
  KEY `idx_issue_date` (`issue_date`),
  KEY `idx_return_status` (`return_status`),
  CONSTRAINT `book_issues_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `book_issues_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `library_members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `book_issues_ibfk_3` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `book_issues_ibfk_4` FOREIGN KEY (`returned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `calendar_events`;
CREATE TABLE `calendar_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_color` varchar(7) DEFAULT '#3B82F6',
  `event_type` enum('public','private','role','protected') NOT NULL DEFAULT 'private',
  `role_name` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_event_type` (`event_type`),
  CONSTRAINT `calendar_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `certificate_templates`;
CREATE TABLE `certificate_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `header_left_text` text DEFAULT NULL,
  `header_center_text` text DEFAULT NULL,
  `header_right_text` text DEFAULT NULL,
  `body_text` text DEFAULT NULL,
  `footer_left_text` text DEFAULT NULL,
  `footer_center_text` text DEFAULT NULL,
  `footer_right_text` text DEFAULT NULL,
  `header_height` int(11) DEFAULT 100,
  `footer_height` int(11) DEFAULT 100,
  `body_height` int(11) DEFAULT 400,
  `body_width` int(11) DEFAULT 800,
  `student_photo_enabled` tinyint(1) DEFAULT 0,
  `photo_height` int(11) DEFAULT 100,
  `background_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `chat_conversations`;
CREATE TABLE `chat_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `last_message_id` int(11) DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `user1_unread_count` int(11) DEFAULT 0,
  `user2_unread_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation` (`user1_id`,`user2_id`),
  KEY `idx_user1` (`user1_id`),
  KEY `idx_user2` (`user2_id`),
  KEY `idx_last_message_at` (`last_message_at`),
  KEY `fk_last_message` (`last_message_id`),
  CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_conversations_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_last_message` FOREIGN KEY (`last_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_conversations` VALUES
(4, 1, 3, 7, Mon Dec 22 2025 16:32:17 GMT+0530 (India Standard Time), 0, 1, Mon Dec 22 2025 16:32:17 GMT+0530 (India Standard Time), Mon Dec 22 2025 16:32:17 GMT+0530 (India Standard Time)),
(5, 1, 6, 8, Mon Dec 22 2025 16:32:20 GMT+0530 (India Standard Time), 0, 1, Mon Dec 22 2025 16:32:20 GMT+0530 (India Standard Time), Mon Dec 22 2025 16:32:20 GMT+0530 (India Standard Time)),
(6, 3, 7, 10, Thu Dec 25 2025 11:23:34 GMT+0530 (India Standard Time), 2, 0, Thu Dec 25 2025 11:23:29 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:23:34 GMT+0530 (India Standard Time)),
(7, 1, 7, 13, Thu Dec 25 2025 11:24:24 GMT+0530 (India Standard Time), 0, 0, Thu Dec 25 2025 11:24:07 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:28 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_sender` (`sender_id`),
  KEY `idx_receiver` (`receiver_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_messages` VALUES
(7, 4, 1, 3, '👋', 0, NULL, Mon Dec 22 2025 16:32:17 GMT+0530 (India Standard Time), Mon Dec 22 2025 16:32:17 GMT+0530 (India Standard Time)),
(8, 5, 1, 6, '👋', 0, NULL, Mon Dec 22 2025 16:32:20 GMT+0530 (India Standard Time), Mon Dec 22 2025 16:32:20 GMT+0530 (India Standard Time)),
(9, 6, 7, 3, '👋', 0, NULL, Thu Dec 25 2025 11:23:29 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:23:29 GMT+0530 (India Standard Time)),
(10, 6, 7, 3, 'Hello', 0, NULL, Thu Dec 25 2025 11:23:34 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:23:34 GMT+0530 (India Standard Time)),
(11, 7, 1, 7, '👋', 1, Thu Dec 25 2025 11:24:18 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:08 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:18 GMT+0530 (India Standard Time)),
(12, 7, 1, 7, 'Hello ravi', 1, Thu Dec 25 2025 11:24:18 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:13 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:18 GMT+0530 (India Standard Time)),
(13, 7, 7, 1, 'Yes', 1, Thu Dec 25 2025 11:24:28 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:24 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:24:28 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `numeric_value` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `classes` VALUES
(1, 'One', 1, Thu Dec 18 2025 11:21:42 GMT+0530 (India Standard Time), Fri Dec 19 2025 18:52:29 GMT+0530 (India Standard Time)),
(2, 'Two', 2, Thu Dec 18 2025 11:21:53 GMT+0530 (India Standard Time), Thu Dec 18 2025 11:21:53 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `class_sections`;
CREATE TABLE `class_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_section` (`class_id`,`section_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_section` (`section_id`),
  CONSTRAINT `class_sections_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_sections_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `class_sections` VALUES
(3, 2, 1, Thu Dec 18 2025 11:21:53 GMT+0530 (India Standard Time)),
(4, 1, 1, Fri Dec 19 2025 18:52:29 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `class_teachers`;
CREATE TABLE `class_teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_class_section_teacher` (`class_id`,`section_id`,`teacher_id`),
  KEY `section_id` (`section_id`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_teacher` (`teacher_id`),
  CONSTRAINT `class_teachers_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_teachers_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_teachers_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `class_teachers` VALUES
(2, 1, 1, 7, Fri Dec 19 2025 19:01:06 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `class_timetable`;
CREATE TABLE `class_timetable` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_group_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `time_from` time NOT NULL,
  `time_to` time NOT NULL,
  `room_no` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_group_id` (`subject_group_id`),
  KEY `subject_id` (`subject_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_day` (`day_of_week`),
  CONSTRAINT `class_timetable_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_timetable_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_timetable_ibfk_3` FOREIGN KEY (`subject_group_id`) REFERENCES `subject_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_timetable_ibfk_4` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_timetable_ibfk_5` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `class_timetable` VALUES
(1, 1, 1, 1, 2, NULL, 'wednesday', '09:00:00', '09:45:00', NULL, Sat Dec 20 2025 12:00:55 GMT+0530 (India Standard Time), Sat Dec 20 2025 12:00:55 GMT+0530 (India Standard Time)),
(2, 1, 1, 1, 2, NULL, 'monday', '07:15:00', '08:00:00', NULL, Sat Dec 20 2025 12:00:55 GMT+0530 (India Standard Time), Sat Dec 20 2025 12:00:55 GMT+0530 (India Standard Time)),
(3, 1, 1, 1, 1, 7, 'tuesday', '07:15:00', '08:00:00', NULL, Sat Dec 20 2025 14:31:41 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:31:41 GMT+0530 (India Standard Time)),
(4, 1, 1, 1, 6, 7, 'monday', '08:15:00', '09:00:00', NULL, Sat Dec 20 2025 14:41:23 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:41:23 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `complains`;
CREATE TABLE `complains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `complain_type_id` int(11) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `complain_by` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `complain_date` date NOT NULL,
  `description` text NOT NULL,
  `action_taken` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `status` enum('pending','in_progress','resolved','closed') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `complain_type_id` (`complain_type_id`),
  KEY `source_id` (`source_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_status` (`status`),
  KEY `idx_complain_date` (`complain_date`),
  CONSTRAINT `complains_ibfk_1` FOREIGN KEY (`complain_type_id`) REFERENCES `front_office_complain_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complains_ibfk_2` FOREIGN KEY (`source_id`) REFERENCES `front_office_sources` (`id`) ON DELETE SET NULL,
  CONSTRAINT `complains_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `custom_fields`;
CREATE TABLE `custom_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_belongs_to` enum('student','staff') NOT NULL,
  `field_type` varchar(50) NOT NULL COMMENT 'text, number, date, select, textarea, etc.',
  `field_name` varchar(255) NOT NULL,
  `field_label` varchar(255) NOT NULL,
  `field_values` text DEFAULT NULL COMMENT 'For select type, comma-separated values or JSON',
  `grid_column` int(11) DEFAULT 12,
  `is_required` tinyint(1) DEFAULT 0,
  `is_visible` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_field_belongs_to` (`field_belongs_to`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departments` VALUES
(1, 'Teaching', NULL, Thu Dec 18 2025 16:38:43 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:38:43 GMT+0530 (India Standard Time)),
(2, 'Finance', NULL, Thu Dec 18 2025 16:38:49 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:38:49 GMT+0530 (India Standard Time)),
(3, 'Cleaning', NULL, Thu Dec 18 2025 16:38:54 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:38:54 GMT+0530 (India Standard Time)),
(4, 'Management', NULL, Thu Dec 18 2025 16:39:02 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:02 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `designations`;
CREATE TABLE `designations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `designations` VALUES
(1, 'Associate', NULL, Thu Dec 18 2025 16:39:20 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:20 GMT+0530 (India Standard Time)),
(2, 'L1', NULL, Thu Dec 18 2025 16:39:28 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:28 GMT+0530 (India Standard Time)),
(3, 'L2', NULL, Thu Dec 18 2025 16:39:32 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:32 GMT+0530 (India Standard Time)),
(4, 'Senior L1', NULL, Thu Dec 18 2025 16:39:40 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:40 GMT+0530 (India Standard Time)),
(5, 'Senior L2', NULL, Thu Dec 18 2025 16:39:47 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:47 GMT+0530 (India Standard Time)),
(6, 'Senior', NULL, Thu Dec 18 2025 16:39:54 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:39:54 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `disable_reasons`;
CREATE TABLE `disable_reasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `download_contents`;
CREATE TABLE `download_contents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_title` varchar(255) NOT NULL,
  `content_type` enum('assignments','study_material','syllabus','other_downloads') NOT NULL,
  `available_for` enum('students','staff','both') DEFAULT 'students',
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `upload_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_content_type` (`content_type`),
  KEY `idx_available_for` (`available_for`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_upload_date` (`upload_date`),
  CONSTRAINT `download_contents_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `download_contents_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `download_contents_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `download_contents` VALUES
(1, 'Computer Study Material', 'study_material', 'both', 1, NULL, Sat Dec 20 2025 00:00:00 GMT+0530 (India Standard Time), NULL, '/uploads/downloads/1766235550098-57302657.pdf', 'Admit card.pdf', 95267, 'application/pdf', 1, Sat Dec 20 2025 18:29:10 GMT+0530 (India Standard Time), Sat Dec 20 2025 18:29:10 GMT+0530 (India Standard Time)),
(2, 'computer assignment', 'assignments', 'students', 1, NULL, Sat Dec 20 2025 00:00:00 GMT+0530 (India Standard Time), 'Assignment description.', '/uploads/downloads/1766235655751-275420451.png', 'image (7).png', 124107, 'image/png', 1, Sat Dec 20 2025 18:30:55 GMT+0530 (India Standard Time), Sat Dec 20 2025 18:30:55 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `email_log`;
CREATE TABLE `email_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `recipient_type` enum('students','guardians','staff','individual','class','birthday') NOT NULL,
  `recipient_ids` text DEFAULT NULL,
  `recipient_emails` text DEFAULT NULL,
  `sent_by` int(11) NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sent_by` (`sent_by`),
  KEY `idx_recipient_type` (`recipient_type`),
  KEY `idx_status` (`status`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `email_log_ibfk_1` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `email_settings`;
CREATE TABLE `email_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `smtp_host` varchar(255) NOT NULL,
  `smtp_port` int(11) NOT NULL DEFAULT 587,
  `smtp_secure` tinyint(1) DEFAULT 0 COMMENT '0 for TLS, 1 for SSL',
  `smtp_username` varchar(255) NOT NULL,
  `smtp_password` varchar(255) NOT NULL,
  `from_email` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_settings` VALUES
(1, 'smtp.gmail.com', 587, 0, '', '', '', 'SchoolWizard', 0, Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(2, 'smtp.hostinger.com', 465, 1, 'info@wtechnology.in', 'admin@6706', 'info@wtechnology.in', 'SVN Chaita, Samstipur', 1, Wed Dec 17 2025 19:36:44 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:20:35 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `enquiry_follow_ups`;
CREATE TABLE `enquiry_follow_ups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enquiry_id` int(11) NOT NULL,
  `follow_up_date` date NOT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `response` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_enquiry` (`enquiry_id`),
  CONSTRAINT `enquiry_follow_ups_ibfk_1` FOREIGN KEY (`enquiry_id`) REFERENCES `admission_enquiries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'general',
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `featured_image` varchar(500) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_category` (`category`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `events` VALUES
(1, 'Annual Sports Day', 'annual-sports-day-2025', 'Join us for our annual sports day featuring exciting competitions, races, and team events. All students, parents, and staff are welcome.', 'Sports', Tue Jan 06 2026 00:00:00 GMT+0530 (India Standard Time), '09:00:00', NULL, NULL, 'School Grounds', NULL, 1, 1, Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time)),
(2, 'Science Exhibition', 'science-exhibition-2025', 'Students showcase innovative science projects and experiments. Open to all visitors interested in scientific exploration.', 'Academic', Sun Jan 11 2026 00:00:00 GMT+0530 (India Standard Time), '10:00:00', NULL, NULL, 'School Auditorium', NULL, 0, 1, Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_group_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `session_id` int(11) NOT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_group` (`exam_group_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_published` (`is_published`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`exam_group_id`) REFERENCES `exam_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exams` VALUES
(1, 1, 'Annual Examination - Class 1', 1, 1, NULL, Wed Dec 17 2025 19:40:16 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:43:25 GMT+0530 (India Standard Time)),
(2, 2, 'Annual Exam Class 2', 1, 0, NULL, Wed Dec 17 2025 19:40:28 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:40:28 GMT+0530 (India Standard Time)),
(3, 2, 'Annual Exam Class 2', 1, 0, NULL, Wed Dec 17 2025 19:40:43 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:40:43 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `exam_groups`;
CREATE TABLE `exam_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `exam_type` enum('general_purpose','school_based','college_based','gpa') NOT NULL DEFAULT 'general_purpose',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_exam_type` (`exam_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_groups` VALUES
(1, 'Annual Examination - Class 1', 'gpa', NULL, Wed Dec 17 2025 19:39:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:39:34 GMT+0530 (India Standard Time)),
(2, 'Annual Exam Class 2', 'gpa', NULL, Wed Dec 17 2025 19:39:47 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:39:47 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `exam_marks`;
CREATE TABLE `exam_marks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_id` int(11) NOT NULL,
  `exam_subject_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `marks_obtained` decimal(6,2) DEFAULT 0.00,
  `grade` varchar(10) DEFAULT NULL,
  `grade_point` decimal(4,2) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_subject_student` (`exam_id`,`exam_subject_id`,`student_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_exam` (`exam_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_subject` (`exam_subject_id`),
  CONSTRAINT `exam_marks_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_marks_ibfk_2` FOREIGN KEY (`exam_subject_id`) REFERENCES `exam_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_marks_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_marks_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_marks` VALUES
(1, 1, 2, 6, '90.00', NULL, NULL, NULL, 1, Thu Dec 18 2025 16:43:43 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:43:43 GMT+0530 (India Standard Time)),
(2, 1, 1, 6, '89.00', NULL, NULL, NULL, 1, Thu Dec 18 2025 16:44:00 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:44:00 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `exam_students`;
CREATE TABLE `exam_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_student` (`exam_id`,`student_id`),
  KEY `idx_exam` (`exam_id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `exam_students_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_students` VALUES
(1, 1, 6, NULL, Thu Dec 18 2025 16:43:21 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `exam_subjects`;
CREATE TABLE `exam_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `exam_date` date DEFAULT NULL,
  `exam_time_from` time DEFAULT NULL,
  `exam_time_to` time DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `credit_hours` decimal(4,2) DEFAULT 0.00,
  `max_marks` decimal(6,2) NOT NULL DEFAULT 100.00,
  `passing_marks` decimal(6,2) DEFAULT 33.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_exam` (`exam_id`),
  KEY `idx_subject` (`subject_id`),
  CONSTRAINT `exam_subjects_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_subjects` VALUES
(1, 1, 6, Thu Dec 18 2025 00:00:00 GMT+0530 (India Standard Time), '20:47:00', '21:47:00', '1', '0.00', '100.00', '33.00', Wed Dec 17 2025 19:47:20 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:47:20 GMT+0530 (India Standard Time)),
(2, 1, 1, Thu Dec 18 2025 00:00:00 GMT+0530 (India Standard Time), '10:04:00', '11:30:00', '1', '0.00', '100.00', '33.00', Wed Dec 17 2025 21:05:13 GMT+0530 (India Standard Time), Wed Dec 17 2025 21:05:13 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `expense_head_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_date` (`date`),
  KEY `idx_expense_head` (`expense_head_id`),
  KEY `idx_invoice_number` (`invoice_number`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`expense_head_id`) REFERENCES `expense_heads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expense_heads`;
CREATE TABLE `expense_heads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_carry_forward`;
CREATE TABLE `fees_carry_forward` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `from_session_id` int(11) NOT NULL,
  `to_session_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','paid') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `from_session_id` (`from_session_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_to_session` (`to_session_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fees_carry_forward_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_carry_forward_ibfk_2` FOREIGN KEY (`from_session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_carry_forward_ibfk_3` FOREIGN KEY (`to_session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_discounts`;
CREATE TABLE `fees_discounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_type` enum('percentage','fixed') DEFAULT 'fixed',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_name` (`name`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_discounts` VALUES
(1, 'Special Festival Discount', 'SFD10', '10.00', 'percentage', 'This is a special discount of 10% only application when the fee is more than 999. ', Fri Dec 19 2025 14:28:28 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:28:28 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_discount_applications`;
CREATE TABLE `fees_discount_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_discount_id` int(11) NOT NULL,
  `fees_payment_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_discount` (`fees_discount_id`),
  KEY `idx_payment` (`fees_payment_id`),
  CONSTRAINT `fees_discount_applications_ibfk_1` FOREIGN KEY (`fees_discount_id`) REFERENCES `fees_discounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_discount_applications_ibfk_2` FOREIGN KEY (`fees_payment_id`) REFERENCES `fees_payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_discount_assignments`;
CREATE TABLE `fees_discount_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_discount_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_discount` (`fees_discount_id`,`student_id`),
  KEY `idx_discount` (`fees_discount_id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `fees_discount_assignments_ibfk_1` FOREIGN KEY (`fees_discount_id`) REFERENCES `fees_discounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_discount_assignments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_groups`;
CREATE TABLE `fees_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_groups` VALUES
(1, 'Class One Annual Fee', NULL, Fri Dec 19 2025 14:22:56 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:22:56 GMT+0530 (India Standard Time)),
(2, 'Class One Annual Fee with Transportation', NULL, Fri Dec 19 2025 14:23:37 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:23:37 GMT+0530 (India Standard Time)),
(3, 'Class One Annual Fee with Hostel', NULL, Fri Dec 19 2025 14:23:58 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:23:58 GMT+0530 (India Standard Time)),
(4, 'Class 1 Standard Fees', NULL, Fri Dec 19 2025 17:46:07 GMT+0530 (India Standard Time), Fri Dec 19 2025 17:46:07 GMT+0530 (India Standard Time)),
(5, 'Class 1 Transport Fees', 'For students using school bus (optional, assigned separately)', Fri Dec 19 2025 17:46:47 GMT+0530 (India Standard Time), Fri Dec 19 2025 17:46:47 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_group_assignments`;
CREATE TABLE `fees_group_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_group_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `idx_group` (`fees_group_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `fees_group_assignments_ibfk_1` FOREIGN KEY (`fees_group_id`) REFERENCES `fees_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_group_assignments_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_group_assignments_ibfk_3` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_group_assignments_ibfk_4` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_group_assignments_ibfk_5` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `CONSTRAINT_1` CHECK (`class_id` is not null and `section_id` is not null and `student_id` is null or `class_id` is null and `section_id` is null and `student_id` is not null)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_group_assignments` VALUES
(1, 4, 1, NULL, NULL, 6, Fri Dec 19 2025 18:12:14 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_group_types`;
CREATE TABLE `fees_group_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_group_id` int(11) NOT NULL,
  `fees_type_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_type` (`fees_group_id`,`fees_type_id`),
  KEY `idx_group` (`fees_group_id`),
  KEY `idx_type` (`fees_type_id`),
  CONSTRAINT `fees_group_types_ibfk_1` FOREIGN KEY (`fees_group_id`) REFERENCES `fees_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_group_types_ibfk_2` FOREIGN KEY (`fees_type_id`) REFERENCES `fees_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_group_types` VALUES
(1, 1, 4, Fri Dec 19 2025 14:22:57 GMT+0530 (India Standard Time)),
(2, 1, 1, Fri Dec 19 2025 14:22:57 GMT+0530 (India Standard Time)),
(3, 2, 3, Fri Dec 19 2025 14:23:37 GMT+0530 (India Standard Time)),
(4, 2, 1, Fri Dec 19 2025 14:23:37 GMT+0530 (India Standard Time)),
(5, 2, 4, Fri Dec 19 2025 14:23:37 GMT+0530 (India Standard Time)),
(6, 3, 1, Fri Dec 19 2025 14:23:59 GMT+0530 (India Standard Time)),
(7, 3, 2, Fri Dec 19 2025 14:23:59 GMT+0530 (India Standard Time)),
(8, 3, 4, Fri Dec 19 2025 14:23:59 GMT+0530 (India Standard Time)),
(9, 4, 4, Fri Dec 19 2025 17:46:08 GMT+0530 (India Standard Time)),
(10, 4, 1, Fri Dec 19 2025 17:46:08 GMT+0530 (India Standard Time)),
(11, 4, 2, Fri Dec 19 2025 17:46:08 GMT+0530 (India Standard Time)),
(12, 5, 3, Fri Dec 19 2025 17:46:47 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_invoices`;
CREATE TABLE `fees_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(50) NOT NULL,
  `student_id` int(11) NOT NULL,
  `fees_master_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `balance_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  KEY `fees_master_id` (`fees_master_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_invoice_no` (`invoice_no`),
  CONSTRAINT `fees_invoices_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_invoices_ibfk_2` FOREIGN KEY (`fees_master_id`) REFERENCES `fees_master` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_invoices_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_invoices` VALUES
(1, 'INV-1-4-6-1766148135081', 6, 4, 1, '5000.00', '0.00', '0.00', '0.00', '0.00', Wed Jan 01 2025 00:00:00 GMT+0530 (India Standard Time), 'paid', Fri Dec 19 2025 18:12:15 GMT+0530 (India Standard Time), Wed Dec 24 2025 23:49:02 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_master`;
CREATE TABLE `fees_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_group_id` int(11) NOT NULL,
  `fees_type_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `due_date` date DEFAULT NULL,
  `fine_type` enum('percentage','fixed') DEFAULT 'percentage',
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_group` (`fees_group_id`),
  KEY `idx_type` (`fees_type_id`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fees_master_ibfk_1` FOREIGN KEY (`fees_group_id`) REFERENCES `fees_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_master_ibfk_2` FOREIGN KEY (`fees_type_id`) REFERENCES `fees_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_master_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_master` VALUES
(1, 1, 1, 1, '249.97', Mon Jan 05 2026 00:00:00 GMT+0530 (India Standard Time), 'fixed', '50.00', Fri Dec 19 2025 14:25:35 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:25:35 GMT+0530 (India Standard Time)),
(2, 3, 2, 1, '800.00', Mon Jan 05 2026 00:00:00 GMT+0530 (India Standard Time), 'fixed', '100.00', Fri Dec 19 2025 14:26:58 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:26:58 GMT+0530 (India Standard Time)),
(3, 2, 3, 1, '500.00', Sun Oct 05 2025 00:00:00 GMT+0530 (India Standard Time), 'fixed', '50.00', Fri Dec 19 2025 17:42:58 GMT+0530 (India Standard Time), Fri Dec 19 2025 17:42:58 GMT+0530 (India Standard Time)),
(4, 4, 1, 1, '5000.00', Wed Jan 01 2025 00:00:00 GMT+0530 (India Standard Time), 'fixed', '500.00', Fri Dec 19 2025 17:48:17 GMT+0530 (India Standard Time), Fri Dec 19 2025 17:48:17 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_payments`;
CREATE TABLE `fees_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(50) NOT NULL,
  `fees_invoice_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `payment_mode` enum('cash','cheque','bank_transfer','online','card') DEFAULT 'cash',
  `note` text DEFAULT NULL,
  `collected_by` int(11) DEFAULT NULL,
  `is_reverted` tinyint(1) DEFAULT 0,
  `reverted_at` timestamp NULL DEFAULT NULL,
  `reverted_by` int(11) DEFAULT NULL,
  `revert_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_id` (`payment_id`),
  KEY `collected_by` (`collected_by`),
  KEY `reverted_by` (`reverted_by`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_invoice` (`fees_invoice_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_reverted` (`is_reverted`),
  CONSTRAINT `fees_payments_ibfk_1` FOREIGN KEY (`fees_invoice_id`) REFERENCES `fees_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_payments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fees_payments_ibfk_3` FOREIGN KEY (`collected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fees_payments_ibfk_4` FOREIGN KEY (`reverted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_payments` VALUES
(1, 'PAY-1766174739198-KT0DH9NS9', 1, 6, Fri Dec 19 2025 00:00:00 GMT+0530 (India Standard Time), '2000.00', '0.00', '0.00', 'cash', NULL, 1, 0, NULL, NULL, NULL, Sat Dec 20 2025 01:35:39 GMT+0530 (India Standard Time), Sat Dec 20 2025 01:35:39 GMT+0530 (India Standard Time)),
(2, 'PAY-1766174834651-DNVJ6S7HR', 1, 6, Fri Dec 19 2025 00:00:00 GMT+0530 (India Standard Time), '1000.00', '0.00', '0.00', 'online', NULL, 1, 0, NULL, NULL, NULL, Sat Dec 20 2025 01:37:14 GMT+0530 (India Standard Time), Sat Dec 20 2025 01:37:14 GMT+0530 (India Standard Time)),
(3, 'PAY-1766600342416-R2G9DFKDL', 1, 6, Wed Dec 24 2025 00:00:00 GMT+0530 (India Standard Time), '2000.00', '0.00', '0.00', 'online', 'Google Pay', 1, 0, NULL, NULL, NULL, Wed Dec 24 2025 23:49:02 GMT+0530 (India Standard Time), Wed Dec 24 2025 23:49:02 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `fees_reminder_logs`;
CREATE TABLE `fees_reminder_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fees_invoice_id` int(11) NOT NULL,
  `reminder_type` enum('before_1','before_2','after_1','after_2') NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_invoice` (`fees_invoice_id`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `fees_reminder_logs_ibfk_1` FOREIGN KEY (`fees_invoice_id`) REFERENCES `fees_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_reminder_settings`;
CREATE TABLE `fees_reminder_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reminder_type` enum('before_1','before_2','after_1','after_2') NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `days` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reminder_type` (`reminder_type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `fees_types`;
CREATE TABLE `fees_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_name` (`name`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_types` VALUES
(1, 'School Fee', 'SF-01', NULL, Fri Dec 19 2025 14:11:46 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:11:46 GMT+0530 (India Standard Time)),
(2, 'Hostel Fee', 'HF-01', NULL, Fri Dec 19 2025 14:12:00 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:12:00 GMT+0530 (India Standard Time)),
(3, 'Vehicle Charge', 'VF-01', NULL, Fri Dec 19 2025 14:13:06 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:13:06 GMT+0530 (India Standard Time)),
(4, 'Examination Fee', 'EF-01', NULL, Fri Dec 19 2025 14:22:24 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:22:24 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_banner_images`;
CREATE TABLE `front_cms_banner_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(500) NOT NULL,
  `image_title` varchar(255) DEFAULT NULL,
  `image_link` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_events`;
CREATE TABLE `front_cms_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_title` varchar(255) NOT NULL,
  `event_venue` varchar(255) DEFAULT NULL,
  `event_start_date` date NOT NULL,
  `event_end_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_keyword` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `sidebar_enabled` tinyint(1) DEFAULT 1,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_event_start_date` (`event_start_date`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_galleries`;
CREATE TABLE `front_cms_galleries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_keyword` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `sidebar_enabled` tinyint(1) DEFAULT 1,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_gallery_images`;
CREATE TABLE `front_cms_gallery_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gallery_id` int(11) NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `image_title` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gallery_id` (`gallery_id`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `front_cms_gallery_images_ibfk_1` FOREIGN KEY (`gallery_id`) REFERENCES `front_cms_galleries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_media`;
CREATE TABLE `front_cms_media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` enum('image','document','video') NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_file_name` (`file_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_menus`;
CREATE TABLE `front_cms_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_menu_items`;
CREATE TABLE `front_cms_menu_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `menu_item` varchar(255) NOT NULL,
  `external_url` varchar(500) DEFAULT NULL,
  `open_in_new_tab` tinyint(1) DEFAULT 0,
  `page_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `page_id` (`page_id`),
  KEY `idx_menu_id` (`menu_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `front_cms_menu_items_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `front_cms_menus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `front_cms_menu_items_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `front_cms_menu_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `front_cms_menu_items_ibfk_3` FOREIGN KEY (`page_id`) REFERENCES `front_cms_pages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_news`;
CREATE TABLE `front_cms_news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `news_title` varchar(255) NOT NULL,
  `news_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_keyword` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `sidebar_enabled` tinyint(1) DEFAULT 1,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_news_date` (`news_date`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_pages`;
CREATE TABLE `front_cms_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_title` varchar(255) NOT NULL,
  `page_type` enum('standard','event','news','gallery') DEFAULT 'standard',
  `description` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_keyword` varchar(500) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `sidebar_enabled` tinyint(1) DEFAULT 1,
  `featured_image` varchar(500) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_page_type` (`page_type`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_settings`;
CREATE TABLE `front_cms_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_enabled` tinyint(1) DEFAULT 1,
  `sidebar_enabled` tinyint(1) DEFAULT 1,
  `rtl_mode` tinyint(1) DEFAULT 0,
  `logo` varchar(500) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `footer_text` text DEFAULT NULL,
  `google_analytics` text DEFAULT NULL,
  `facebook_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL,
  `pinterest_url` varchar(500) DEFAULT NULL,
  `whatsapp_url` varchar(500) DEFAULT NULL,
  `current_theme` varchar(100) DEFAULT 'default',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_settings` VALUES
(1, 1, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'default', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(2, 1, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'default', Wed Dec 17 2025 19:36:55 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:55 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_office_complain_types`;
CREATE TABLE `front_office_complain_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_office_purposes`;
CREATE TABLE `front_office_purposes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_office_references`;
CREATE TABLE `front_office_references` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_office_sources`;
CREATE TABLE `front_office_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gallery_categories`;
CREATE TABLE `gallery_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_name` (`name`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery_categories` VALUES
(1, 'Events', 'School events and celebrations', 1, 1, Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time)),
(2, 'Sports', 'Sports activities and competitions', 2, 1, Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time)),
(3, 'Academics', 'Academic activities and achievements', 3, 1, Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time)),
(4, 'Cultural', 'Cultural programs and performances', 4, 1, Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:57 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `gallery_images`;
CREATE TABLE `gallery_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(500) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `gallery_images_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `gallery_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `general_settings`;
CREATE TABLE `general_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` varchar(50) DEFAULT 'text' COMMENT 'text, number, boolean, json',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `general_settings` VALUES
(1, 'school_name', 'SVN Chaita', 'text', 'School Name', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(2, 'school_code', '', 'text', 'School Code/Affiliation Number', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(3, 'address', 'Chaita North', 'text', 'School Address', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(4, 'phone', '', 'text', 'School Phone', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(5, 'email', '', 'text', 'School Email', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(6, 'session_start_month', 'April', 'text', 'Academic Session Start Month', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(7, 'attendance_type', 'day_wise', 'text', 'Attendance Type: day_wise or period_wise', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(8, 'biometric_attendance', '0', 'boolean', 'Enable Biometric Attendance', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(9, 'language', 'english', 'text', 'Default System Language', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:41 GMT+0530 (India Standard Time)),
(10, 'date_format', 'Y-m-d', 'text', 'Date Format', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(11, 'timezone', 'UTC', 'text', 'System Timezone', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(12, 'currency', 'USD', 'text', 'Currency Code', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(13, 'currency_symbol', '$', 'text', 'Currency Symbol', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(14, 'currency_symbol_place', 'before', 'text', 'Currency Symbol Place: before or after', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(15, 'admission_no_prefix', '', 'text', 'Admission Number Prefix', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(16, 'admission_no_digit', '6', 'number', 'Admission Number Digits', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(17, 'admission_start_from', '1', 'number', 'Admission Number Start From', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(18, 'auto_staff_id', '0', 'boolean', 'Auto Generate Staff ID', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(19, 'staff_id_prefix', '', 'text', 'Staff ID Prefix', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(20, 'staff_no_digit', '6', 'number', 'Staff ID Digits', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(21, 'staff_id_start_from', '1', 'number', 'Staff ID Start From', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(22, 'duplicate_fees_invoice', '0', 'boolean', 'Allow Duplicate Fees Invoice', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(23, 'fees_due_days', '30', 'number', 'Fees Due Days', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(24, 'teacher_restricted_mode', '0', 'boolean', 'Teacher Restricted Mode', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(25, 'online_admission', '0', 'boolean', 'Enable Online Admission', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(26, 'print_logo', '', 'text', 'Print Logo Path', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(27, 'admin_logo', '/uploads/logos/admin-logo.jpg', 'text', 'Admin Logo Path', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(28, 'admin_small_logo', '', 'text', 'Admin Small Logo Path', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(29, 'app_logo', '', 'text', 'Mobile App Logo Path', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(30, 'mobile_app_api_url', '', 'text', 'Mobile App API URL', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(31, 'mobile_app_primary_color', '#2563eb,#2563eb', 'text', 'Mobile App Primary Color Code', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(32, 'mobile_app_secondary_color', '#64748b,#64748b', 'text', 'Mobile App Secondary Color Code', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(33, 'android_app_registered', '0', 'boolean', 'Android App Registration Status', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time)),
(96, 'favicon', '/uploads/logos/favicon.jpg', 'text', NULL, Sat Dec 20 2025 02:07:24 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:09:42 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `homework`;
CREATE TABLE `homework` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_group_id` int(11) DEFAULT NULL,
  `subject_id` int(11) NOT NULL,
  `homework_date` date NOT NULL,
  `submission_date` date NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `attachment_url` varchar(500) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_group_id` (`subject_group_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_subject` (`subject_id`),
  KEY `idx_homework_date` (`homework_date`),
  KEY `idx_submission_date` (`submission_date`),
  CONSTRAINT `homework_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homework_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homework_ibfk_3` FOREIGN KEY (`subject_group_id`) REFERENCES `subject_groups` (`id`) ON DELETE SET NULL,
  CONSTRAINT `homework_ibfk_4` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homework_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `homework` VALUES
(1, 1, 1, 1, 6, Sat Dec 20 2025 00:00:00 GMT+0530 (India Standard Time), Mon Dec 22 2025 00:00:00 GMT+0530 (India Standard Time), 'Computer : Do remember the lesson 3 Question & Answer', 'Remember below question & answer below
1. What is a computer?
2. What is an input device? Name any 5 input devices.
3. What is an output device? Name any 5 output devices.', NULL, 7, Sat Dec 20 2025 14:47:53 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:47:53 GMT+0530 (India Standard Time)),
(2, 1, 1, 1, 1, Sat Dec 20 2025 00:00:00 GMT+0530 (India Standard Time), Tue Dec 30 2025 00:00:00 GMT+0530 (India Standard Time), 'Write and Remember Part of Speech', 'Remeber part of speech 
1. Noun
2. Pronoun
3. Verb
4. Adverb', '/uploads/homework/1766228939996-875230749.pdf', 7, Sat Dec 20 2025 16:39:00 GMT+0530 (India Standard Time), Sat Dec 20 2025 16:39:00 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `homework_evaluations`;
CREATE TABLE `homework_evaluations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `homework_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `evaluation_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `marks` decimal(5,2) DEFAULT NULL,
  `evaluated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_homework_student` (`homework_id`,`student_id`),
  KEY `evaluated_by` (`evaluated_by`),
  KEY `idx_homework` (`homework_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_completed` (`is_completed`),
  CONSTRAINT `homework_evaluations_ibfk_1` FOREIGN KEY (`homework_id`) REFERENCES `homework` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homework_evaluations_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `homework_evaluations_ibfk_3` FOREIGN KEY (`evaluated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `homework_evaluations` VALUES
(8, 1, 6, 1, Thu Dec 18 2025 00:00:00 GMT+0530 (India Standard Time), 'THis is remarks', NULL, 7, Sat Dec 20 2025 16:16:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 16:16:27 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `hostels`;
CREATE TABLE `hostels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` enum('boys','girls','mixed') NOT NULL DEFAULT 'mixed',
  `address` text DEFAULT NULL,
  `intake` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `hostel_rooms`;
CREATE TABLE `hostel_rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hostel_id` int(11) NOT NULL,
  `room_type_id` int(11) NOT NULL,
  `room_no` varchar(50) NOT NULL,
  `no_of_bed` int(11) NOT NULL DEFAULT 1,
  `cost_per_bed` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_hostel_room` (`hostel_id`,`room_no`),
  KEY `idx_hostel` (`hostel_id`),
  KEY `idx_room_type` (`room_type_id`),
  CONSTRAINT `hostel_rooms_ibfk_1` FOREIGN KEY (`hostel_id`) REFERENCES `hostels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hostel_rooms_ibfk_2` FOREIGN KEY (`room_type_id`) REFERENCES `room_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `id_card_templates`;
CREATE TABLE `id_card_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `background_image` varchar(500) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `signature` varchar(500) DEFAULT NULL,
  `school_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `id_card_title` varchar(255) DEFAULT NULL,
  `header_color` varchar(7) DEFAULT '#000000',
  `admission_number_enabled` tinyint(1) DEFAULT 1,
  `student_name_enabled` tinyint(1) DEFAULT 1,
  `class_enabled` tinyint(1) DEFAULT 1,
  `father_name_enabled` tinyint(1) DEFAULT 0,
  `mother_name_enabled` tinyint(1) DEFAULT 0,
  `student_address_enabled` tinyint(1) DEFAULT 0,
  `phone_enabled` tinyint(1) DEFAULT 0,
  `date_of_birth_enabled` tinyint(1) DEFAULT 0,
  `blood_group_enabled` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `income`;
CREATE TABLE `income` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `income_head_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_date` (`date`),
  KEY `idx_income_head` (`income_head_id`),
  KEY `idx_invoice_number` (`invoice_number`),
  CONSTRAINT `income_ibfk_1` FOREIGN KEY (`income_head_id`) REFERENCES `income_heads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `income_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `income_heads`;
CREATE TABLE `income_heads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `item_categories`;
CREATE TABLE `item_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `item_issues`;
CREATE TABLE `item_issues` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `user_type` enum('student','staff') NOT NULL,
  `user_id` int(11) NOT NULL,
  `issue_by` varchar(255) NOT NULL,
  `issue_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `note` text DEFAULT NULL,
  `status` enum('issued','returned') DEFAULT 'issued',
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_item` (`item_id`),
  KEY `idx_user` (`user_type`,`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_issue_date` (`issue_date`),
  CONSTRAINT `item_issues_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_issues_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_issues_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `item_stocks`;
CREATE TABLE `item_stocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `store_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `stock_date` date NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_item` (`item_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_store` (`store_id`),
  KEY `idx_stock_date` (`stock_date`),
  CONSTRAINT `item_stocks_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_stocks_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `item_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_stocks_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `item_suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `item_stocks_ibfk_4` FOREIGN KEY (`store_id`) REFERENCES `item_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_stocks_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `item_stores`;
CREATE TABLE `item_stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `stock_code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_code` (`stock_code`),
  KEY `idx_name` (`name`),
  KEY `idx_stock_code` (`stock_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `item_suppliers`;
CREATE TABLE `item_suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `contact_person_name` varchar(255) DEFAULT NULL,
  `contact_person_phone` varchar(20) DEFAULT NULL,
  `contact_person_email` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `languages`;
CREATE TABLE `languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL COMMENT 'ISO language code',
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `languages` VALUES
(1, 'English', 'en', 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(2, 'Hindi', 'hi', 0, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `apply_date` date NOT NULL,
  `leave_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','disapproved') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_staff` (`staff_id`),
  KEY `idx_status` (`status`),
  KEY `idx_leave_date` (`leave_date`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `leave_types`;
CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `max_days` int(11) DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_types` VALUES
(1, 'Casual Leave', NULL, 5, 1, Thu Dec 18 2025 16:40:09 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:40:09 GMT+0530 (India Standard Time)),
(2, 'Emergency', NULL, 10, 1, Thu Dec 18 2025 16:40:20 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:40:20 GMT+0530 (India Standard Time)),
(3, 'Marriage Leave', NULL, 8, 1, Thu Dec 18 2025 16:40:33 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:40:33 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `lesson_plans`;
CREATE TABLE `lesson_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `lesson_title` varchar(255) NOT NULL,
  `lesson_date` date NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `learning_objectives` text DEFAULT NULL,
  `teaching_methods` text DEFAULT NULL,
  `materials_needed` text DEFAULT NULL,
  `activities` text DEFAULT NULL,
  `homework` text DEFAULT NULL,
  `assessment` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','published','completed') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `idx_class_section_subject` (`class_id`,`section_id`,`subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_lesson_date` (`lesson_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `lesson_plans_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_plans_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_plans_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_plans_ibfk_4` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lesson_plan_attachments`;
CREATE TABLE `lesson_plan_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_plan_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lesson_plan_id` (`lesson_plan_id`),
  CONSTRAINT `lesson_plan_attachments_ibfk_1` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lesson_plan_topics`;
CREATE TABLE `lesson_plan_topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_plan_id` int(11) NOT NULL,
  `topic_name` varchar(255) NOT NULL,
  `topic_order` int(11) DEFAULT 0,
  `estimated_duration` int(11) DEFAULT NULL COMMENT 'Duration in minutes',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lesson_plan_id` (`lesson_plan_id`),
  KEY `idx_topic_order` (`topic_order`),
  CONSTRAINT `lesson_plan_topics_ibfk_1` FOREIGN KEY (`lesson_plan_id`) REFERENCES `lesson_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `library_members`;
CREATE TABLE `library_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `member_type` enum('student','staff') NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `member_code` varchar(100) DEFAULT NULL,
  `joined_date` date NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `member_code` (`member_code`),
  UNIQUE KEY `unique_student_member` (`student_id`),
  UNIQUE KEY `unique_staff_member` (`staff_id`),
  KEY `idx_member_type` (`member_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `library_members_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `library_members_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `linked_exams`;
CREATE TABLE `linked_exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_group_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `linked_exam_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_link` (`exam_id`,`linked_exam_id`),
  KEY `exam_group_id` (`exam_group_id`),
  KEY `idx_exam` (`exam_id`),
  KEY `idx_linked` (`linked_exam_id`),
  CONSTRAINT `linked_exams_ibfk_1` FOREIGN KEY (`exam_group_id`) REFERENCES `exam_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `linked_exams_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `linked_exams_ibfk_3` FOREIGN KEY (`linked_exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `marksheet_templates`;
CREATE TABLE `marksheet_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `header_left_text` varchar(255) DEFAULT NULL,
  `header_center_text` varchar(255) DEFAULT NULL,
  `header_right_text` varchar(255) DEFAULT NULL,
  `body_text` text DEFAULT NULL,
  `footer_left_text` varchar(255) DEFAULT NULL,
  `footer_center_text` varchar(255) DEFAULT NULL,
  `footer_right_text` varchar(255) DEFAULT NULL,
  `header_height` int(11) DEFAULT 100,
  `footer_height` int(11) DEFAULT 50,
  `body_height` int(11) DEFAULT 500,
  `body_width` int(11) DEFAULT 800,
  `show_student_photo` tinyint(1) DEFAULT 1,
  `photo_height` int(11) DEFAULT 100,
  `background_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `marks_grades`;
CREATE TABLE `marks_grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_type` enum('general_purpose','school_based','college_based','gpa') NOT NULL,
  `grade_name` varchar(50) NOT NULL,
  `percent_from` decimal(5,2) NOT NULL,
  `percent_upto` decimal(5,2) NOT NULL,
  `grade_point` decimal(4,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_exam_type` (`exam_type`),
  KEY `idx_percent` (`percent_from`,`percent_upto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `marks_grades` VALUES
(1, 'gpa', 'A+', '90.00', '100.00', '4.90', NULL, Wed Dec 17 2025 19:38:52 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:38:52 GMT+0530 (India Standard Time)),
(2, 'gpa', 'A', '75.00', '80.00', '3.80', NULL, Wed Dec 17 2025 19:39:16 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:39:16 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `modules`;
CREATE TABLE `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Module identifier (e.g., students, fees, attendance)',
  `display_name` varchar(200) NOT NULL COMMENT 'Human-readable module name',
  `description` text DEFAULT NULL COMMENT 'Module description',
  `icon` varchar(50) DEFAULT NULL COMMENT 'Icon identifier for UI',
  `route_path` varchar(200) DEFAULT NULL COMMENT 'Frontend route path',
  `parent_module_id` int(11) DEFAULT NULL COMMENT 'For sub-modules, reference to parent module',
  `display_order` int(11) DEFAULT 0 COMMENT 'Order for displaying in sidebar',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether module is active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_parent_module` (`parent_module_id`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`parent_module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `modules` VALUES
(1, 'dashboard', 'Dashboard', 'Main dashboard overview', '????', '/dashboard', NULL, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(2, 'front-office', 'Front Office', 'Reception and front office activities', '????', '/front-office', NULL, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(3, 'students', 'Student Information', 'Student search, profile, admission, history', '????', '/students', NULL, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(4, 'fees', 'Fees Collection', 'Fees collection, fees master, dues, reports', '????', '/fees', NULL, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(5, 'income', 'Income', 'Income management (other than fees)', '????', '/income', NULL, 5, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(6, 'expenses', 'Expenses', 'School expense management', '????', '/expenses', NULL, 6, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(7, 'attendance', 'Attendance', 'Student attendance and reports', '???', '/attendance', NULL, 7, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(8, 'examinations', 'Examinations', 'Exam creation, scheduling, marks entry, grading', '????', '/examinations', NULL, 8, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(9, 'online-examinations', 'Online Examinations', 'Online exam management', '????', '/online-examinations', NULL, 9, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(10, 'lesson-plan', 'Lesson Plan', 'Subject status and lesson plan management', '????', '/lesson-plan', NULL, 10, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(11, 'academics', 'Academics', 'Classes, sections, subjects, teacher assignment, timetable, student promotion', '????', '/academics', NULL, 11, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(12, 'hr', 'Human Resource', 'Staff information, attendance, payroll, leaves', '????', '/hr', NULL, 12, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(13, 'communicate', 'Communicate', 'Messaging system for students, parents, and teachers', '????', '/communicate', NULL, 13, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(14, 'download-center', 'Download Center', 'Document management (assignments, study material, syllabus)', '????', '/download-center', NULL, 14, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(15, 'homework', 'Homework', 'Homework assignment and evaluation', '????', '/homework', NULL, 15, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(16, 'library', 'Library', 'Library book management', '????', '/library', NULL, 16, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(17, 'inventory', 'Inventory', 'School assets and stock management', '????', '/inventory', NULL, 17, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(18, 'transport', 'Transport', 'Transportation routes and fares', '????', '/transport', NULL, 18, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(19, 'hostel', 'Hostel', 'Hostel rooms and fare management', '????', '/hostel', NULL, 19, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(20, 'certificate', 'Certificate', 'Student certificate and ID card design/generation', '????', '/certificate', NULL, 20, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(21, 'front-cms', 'Front CMS', 'Public website management (pages, menus, events, gallery, news)', '????', '/front-cms', NULL, 21, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(22, 'alumni', 'Alumni', 'Alumni records and events', '????', '/alumni', NULL, 22, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(23, 'reports', 'Reports', 'Various reports from different modules', '????', '/reports', NULL, 23, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:09:07 GMT+0530 (India Standard Time)),
(24, 'settings', 'System Settings', 'School configuration, sessions, admin password, SMS, payment gateways, backup/restore, languages', '??????', '/settings', NULL, 24, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(25, 'calendar', 'Calendar & ToDo List', 'Daily/monthly activities and task management', '????', '/calendar', NULL, 25, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(26, 'chat', 'Chat', 'Two-way messaging for staff and students', '????', '/chat', NULL, 26, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(27, 'users', 'User Management', 'Manage system users and roles', '????', '/users', NULL, 27, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(28, 'roles', 'Roles & Permissions', 'Manage roles and permissions', '????', '/roles', NULL, 28, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `news_articles`;
CREATE TABLE `news_articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL,
  `content` text NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'general',
  `featured_image` varchar(500) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `published_date` date NOT NULL,
  `is_featured` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `views_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_category` (`category`),
  KEY `idx_published_date` (`published_date`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `news_articles` VALUES
(1, 'Annual Science Fair 2024 - A Grand Success', 'annual-science-fair-2024', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking.', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking. The event featured over 50 projects covering various scientific disciplines including physics, chemistry, biology, and environmental science.', 'academic', NULL, 'School Admin', Wed Dec 17 2025 00:00:00 GMT+0530 (India Standard Time), 1, 1, 0, Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time)),
(2, 'Basketball Team Wins Regional Championship', 'basketball-team-wins-regional-championship', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution.', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution. The team displayed exceptional teamwork and determination throughout the tournament.', 'sports', NULL, 'Sports Department', Fri Dec 12 2025 00:00:00 GMT+0530 (India Standard Time), 0, 1, 0, Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:36:58 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `notice_board`;
CREATE TABLE `notice_board` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `notice_date` date NOT NULL,
  `publish_date` date NOT NULL,
  `message_to` enum('students','guardians','staff','all') DEFAULT 'all',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_notice_date` (`notice_date`),
  KEY `idx_publish_date` (`publish_date`),
  KEY `idx_message_to` (`message_to`),
  CONSTRAINT `notice_board_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `notification_settings`;
CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_name` varchar(100) NOT NULL COMMENT 'Event identifier: student_admission, exam_result, fees_submission, absent_student, login_credential, homework_created, fees_due_reminder, live_classes, live_meetings, gmeet_live_meeting, gmeet_live_classes, forgot_password',
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `email_enabled_student` tinyint(1) DEFAULT 0,
  `email_enabled_guardian` tinyint(1) DEFAULT 0,
  `email_enabled_staff` tinyint(1) DEFAULT 0,
  `sms_enabled_student` tinyint(1) DEFAULT 0,
  `sms_enabled_guardian` tinyint(1) DEFAULT 0,
  `sms_enabled_staff` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_name` (`event_name`),
  KEY `idx_event_name` (`event_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notification_settings` VALUES
(1, 'student_admission', 'Student Admission', 'Send notification when a new student is admitted', 0, 1, 0, 0, 1, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(2, 'exam_result', 'Exam Result', 'Send notification when exam results are published', 1, 0, 0, 1, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(3, 'fees_submission', 'Fees Submission', 'Send notification when fees are paid', 0, 1, 0, 1, 1, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(4, 'absent_student', 'Absent Student', 'Send notification when student is marked absent', 0, 1, 0, 0, 1, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(5, 'login_credential', 'Login Credential', 'Send login credentials to users', 1, 1, 1, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(6, 'homework_created', 'Homework Created', 'Send notification when homework is assigned', 1, 1, 0, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(7, 'fees_due_reminder', 'Fees Due Reminder', 'Send reminder for due fees', 0, 1, 0, 0, 1, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(8, 'live_classes', 'Live Classes', 'Send notification for live classes', 1, 1, 0, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(9, 'live_meetings', 'Live Meetings', 'Send notification for live meetings', 0, 0, 1, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(10, 'gmeet_live_meeting', 'Gmeet Live Meeting', 'Send notification for Google Meet meetings', 0, 0, 1, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(11, 'gmeet_live_classes', 'Gmeet Live Classes', 'Send notification for Google Meet classes', 1, 1, 0, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time)),
(12, 'forgot_password', 'Forgot Password', 'Send password reset link', 1, 1, 1, 0, 0, 0, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Sat Dec 20 2025 11:21:23 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `online_admissions`;
CREATE TABLE `online_admissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(50) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `date_of_birth` date NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `number_of_child` int(11) DEFAULT 1,
  `father_name` varchar(255) DEFAULT NULL,
  `father_phone` varchar(20) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `mother_phone` varchar(20) DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `guardian_phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `online_admissions_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `online_exams`;
CREATE TABLE `online_exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  `exam_time_from` time DEFAULT NULL,
  `exam_time_to` time DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT 60,
  `total_marks` decimal(10,2) DEFAULT 0.00,
  `passing_marks` decimal(10,2) DEFAULT 0.00,
  `instructions` text DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_subject` (`subject_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  CONSTRAINT `online_exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exams_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exams_ibfk_3` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_exams_ibfk_4` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_exams_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `online_exam_answers`;
CREATE TABLE `online_exam_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attempt_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_answer` enum('A','B','C','D','E','') DEFAULT '',
  `is_correct` tinyint(1) DEFAULT 0,
  `marks_obtained` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attempt_question` (`attempt_id`,`question_id`),
  KEY `idx_attempt` (`attempt_id`),
  KEY `idx_question` (`question_id`),
  CONSTRAINT `online_exam_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `online_exam_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `online_exam_attempts`;
CREATE TABLE `online_exam_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `online_exam_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `submitted_at` timestamp NULL DEFAULT NULL,
  `time_taken_minutes` int(11) DEFAULT NULL,
  `total_marks` decimal(10,2) DEFAULT 0.00,
  `obtained_marks` decimal(10,2) DEFAULT 0.00,
  `percentage` decimal(5,2) DEFAULT 0.00,
  `status` enum('in_progress','submitted','time_up') DEFAULT 'in_progress',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_exam` (`online_exam_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `online_exam_attempts_ibfk_1` FOREIGN KEY (`online_exam_id`) REFERENCES `online_exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `online_exam_questions`;
CREATE TABLE `online_exam_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `online_exam_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `marks` decimal(5,2) DEFAULT 1.00,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_question` (`online_exam_id`,`question_id`),
  KEY `idx_exam` (`online_exam_id`),
  KEY `idx_question` (`question_id`),
  CONSTRAINT `online_exam_questions_ibfk_1` FOREIGN KEY (`online_exam_id`) REFERENCES `online_exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `online_exam_students`;
CREATE TABLE `online_exam_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `online_exam_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_exam_student` (`online_exam_id`,`student_id`),
  KEY `idx_exam` (`online_exam_id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `online_exam_students_ibfk_1` FOREIGN KEY (`online_exam_id`) REFERENCES `online_exams` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_gateways`;
CREATE TABLE `payment_gateways` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gateway_name` varchar(50) NOT NULL COMMENT 'Gateway name: paypal, stripe, payu, ccavenue, instamojo, paystack, razorpay',
  `display_name` varchar(255) NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `api_secret` varchar(255) DEFAULT NULL,
  `merchant_id` varchar(255) DEFAULT NULL,
  `test_mode` tinyint(1) DEFAULT 1 COMMENT '1 for test mode, 0 for live mode',
  `additional_params` text DEFAULT NULL COMMENT 'JSON for additional gateway-specific parameters',
  `is_enabled` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gateway_name` (`gateway_name`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `basic_salary` decimal(10,2) DEFAULT 0.00,
  `total_earnings` decimal(10,2) DEFAULT 0.00,
  `total_deductions` decimal(10,2) DEFAULT 0.00,
  `tax` decimal(10,2) DEFAULT 0.00,
  `net_salary` decimal(10,2) DEFAULT 0.00,
  `status` enum('not_generated','generated','paid') DEFAULT 'not_generated',
  `payment_date` date DEFAULT NULL,
  `payment_mode` enum('cash','cheque','bank_transfer','online') DEFAULT 'bank_transfer',
  `payment_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_month_year` (`staff_id`,`month`,`year`),
  KEY `idx_month_year` (`month`,`year`),
  KEY `idx_status` (`status`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payroll_deductions`;
CREATE TABLE `payroll_deductions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payroll_id` int(11) NOT NULL,
  `deduction_type` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payroll` (`payroll_id`),
  CONSTRAINT `payroll_deductions_ibfk_1` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payroll_earnings`;
CREATE TABLE `payroll_earnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payroll_id` int(11) NOT NULL,
  `earning_type` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payroll` (`payroll_id`),
  CONSTRAINT `payroll_earnings_ibfk_1` FOREIGN KEY (`payroll_id`) REFERENCES `payroll` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Permission identifier (e.g., view, add, edit, delete)',
  `display_name` varchar(200) NOT NULL COMMENT 'Human-readable permission name',
  `description` text DEFAULT NULL COMMENT 'Permission description',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` VALUES
(1, 'view', 'View', 'View/Read access to module data', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(2, 'add', 'Add', 'Create/Add new records', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(3, 'edit', 'Edit', 'Update/Modify existing records', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(4, 'delete', 'Delete', 'Remove/Delete records', Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `phone_call_logs`;
CREATE TABLE `phone_call_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `call_date` date NOT NULL,
  `call_time` time DEFAULT NULL,
  `description` text DEFAULT NULL,
  `next_follow_up_date` date DEFAULT NULL,
  `call_duration` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `call_type` enum('incoming','outgoing') DEFAULT 'incoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_call_date` (`call_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `postal_dispatch`;
CREATE TABLE `postal_dispatch` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `to_title` varchar(255) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `from_title` varchar(255) DEFAULT NULL,
  `dispatch_date` date NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dispatch_date` (`dispatch_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `postal_receive`;
CREATE TABLE `postal_receive` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_title` varchar(255) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `to_title` varchar(255) DEFAULT NULL,
  `receive_date` date NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_receive_date` (`receive_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `print_settings`;
CREATE TABLE `print_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_type` enum('header','footer') NOT NULL,
  `header_image` varchar(500) DEFAULT NULL COMMENT 'Path to header image',
  `footer_text` text DEFAULT NULL COMMENT 'Footer text',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `question_bank`;
CREATE TABLE `question_bank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `option_a` text DEFAULT NULL,
  `option_b` text DEFAULT NULL,
  `option_c` text DEFAULT NULL,
  `option_d` text DEFAULT NULL,
  `option_e` text DEFAULT NULL,
  `correct_answer` enum('A','B','C','D','E') NOT NULL,
  `marks` decimal(5,2) DEFAULT 1.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subject` (`subject_id`),
  CONSTRAINT `question_bank_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` VALUES
(1, 'superadmin', 'Super Administrator with full access', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(2, 'admin', 'Administrator', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(3, 'teacher', 'Teacher', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(4, 'student', 'Student', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(5, 'parent', 'Parent/Guardian', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(6, 'accountant', 'Accountant', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(7, 'librarian', 'Librarian', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time)),
(8, 'receptionist', 'Receptionist', Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted` tinyint(1) DEFAULT 1 COMMENT 'Whether permission is granted (true) or denied (false)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_module_permission` (`role_id`,`module_id`,`permission_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_module_id` (`module_id`),
  KEY `idx_permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1302 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` VALUES
(1, 1, 1, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(2, 1, 2, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(3, 1, 3, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(4, 1, 4, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(5, 1, 5, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(6, 1, 6, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(7, 1, 7, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(8, 1, 8, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(9, 1, 9, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(10, 1, 10, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(11, 1, 11, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(12, 1, 12, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(13, 1, 13, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(14, 1, 14, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(15, 1, 15, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(16, 1, 16, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(17, 1, 17, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(18, 1, 18, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(19, 1, 19, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(20, 1, 20, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(21, 1, 21, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(22, 1, 22, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(23, 1, 23, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(24, 1, 24, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(25, 1, 25, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(26, 1, 26, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(27, 1, 27, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(28, 1, 28, 2, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(29, 1, 1, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(30, 1, 2, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(31, 1, 3, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(32, 1, 4, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(33, 1, 5, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(34, 1, 6, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(35, 1, 7, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(36, 1, 8, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(37, 1, 9, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(38, 1, 10, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(39, 1, 11, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(40, 1, 12, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(41, 1, 13, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(42, 1, 14, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(43, 1, 15, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(44, 1, 16, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(45, 1, 17, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(46, 1, 18, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(47, 1, 19, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(48, 1, 20, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(49, 1, 21, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(50, 1, 22, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(51, 1, 23, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(52, 1, 24, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(53, 1, 25, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(54, 1, 26, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(55, 1, 27, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(56, 1, 28, 4, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(57, 1, 1, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(58, 1, 2, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(59, 1, 3, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(60, 1, 4, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(61, 1, 5, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(62, 1, 6, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(63, 1, 7, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(64, 1, 8, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(65, 1, 9, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(66, 1, 10, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(67, 1, 11, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(68, 1, 12, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(69, 1, 13, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(70, 1, 14, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(71, 1, 15, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(72, 1, 16, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(73, 1, 17, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(74, 1, 18, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(75, 1, 19, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(76, 1, 20, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(77, 1, 21, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(78, 1, 22, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(79, 1, 23, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(80, 1, 24, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(81, 1, 25, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(82, 1, 26, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(83, 1, 27, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(84, 1, 28, 3, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(85, 1, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(86, 1, 2, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(87, 1, 3, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(88, 1, 4, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(89, 1, 5, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(90, 1, 6, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(91, 1, 7, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(92, 1, 8, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(93, 1, 9, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(94, 1, 10, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(95, 1, 11, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(96, 1, 12, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(97, 1, 13, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(98, 1, 14, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(99, 1, 15, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(100, 1, 16, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(101, 1, 17, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(102, 1, 18, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(103, 1, 19, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(104, 1, 20, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(105, 1, 21, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(106, 1, 22, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(107, 1, 23, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(108, 1, 24, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(109, 1, 25, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(110, 1, 26, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(111, 1, 27, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(112, 1, 28, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(128, 6, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(129, 2, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(130, 7, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(131, 5, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(132, 8, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(133, 4, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(134, 3, 1, 1, 1, Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:27 GMT+0530 (India Standard Time)),
(1124, 6, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1126, 5, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1128, 7, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1129, 2, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1130, 7, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1131, 2, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1132, 7, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1133, 2, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1134, 2, 19, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1135, 2, 19, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1137, 2, 19, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1138, 2, 19, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1139, 6, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1140, 2, 20, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1141, 6, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1142, 2, 20, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1143, 2, 20, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1144, 2, 20, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1146, 2, 21, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1147, 2, 21, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1148, 5, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1149, 2, 21, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1150, 2, 21, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1151, 5, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1152, 2, 22, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1153, 2, 22, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1154, 2, 22, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1156, 2, 22, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1157, 2, 23, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1158, 2, 23, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1159, 2, 23, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1160, 2, 23, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1161, 2, 25, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1162, 2, 25, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1163, 2, 25, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1164, 2, 25, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1165, 2, 26, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1166, 2, 26, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1167, 2, 26, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1168, 2, 26, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1169, 2, 27, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1170, 2, 27, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1171, 2, 27, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1172, 2, 27, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1173, 2, 28, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1174, 2, 28, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1175, 2, 28, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1176, 2, 28, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1179, 4, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1180, 4, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1181, 4, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1182, 4, 4, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1183, 4, 4, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1184, 4, 4, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1185, 4, 4, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1186, 4, 7, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1187, 4, 7, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1188, 4, 7, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1189, 4, 7, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1190, 4, 9, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1191, 4, 9, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1192, 4, 9, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1193, 4, 9, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1194, 4, 11, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1195, 4, 11, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1196, 4, 11, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1197, 4, 11, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1198, 4, 13, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1199, 4, 13, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1200, 4, 13, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1201, 4, 13, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1202, 4, 14, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1203, 4, 14, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1204, 4, 14, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1205, 4, 14, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1206, 4, 15, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1207, 4, 15, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1208, 4, 15, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1209, 4, 15, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1210, 4, 16, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1211, 4, 16, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1212, 4, 16, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1213, 4, 16, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1214, 4, 18, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1215, 4, 18, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1216, 4, 18, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1217, 4, 18, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1218, 4, 19, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1219, 4, 19, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1220, 4, 19, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1221, 4, 19, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1222, 4, 23, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1223, 4, 23, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1224, 4, 23, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1225, 4, 23, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1226, 4, 25, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1227, 4, 25, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1228, 4, 25, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1229, 4, 25, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1230, 4, 26, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1231, 4, 26, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1232, 4, 26, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1233, 4, 26, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1236, 8, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1237, 8, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1238, 8, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1241, 3, 1, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1242, 3, 1, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1243, 3, 1, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1244, 3, 3, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1245, 3, 4, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1246, 3, 4, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1247, 3, 4, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1248, 3, 4, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1249, 3, 7, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1250, 3, 7, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1251, 3, 7, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1252, 3, 7, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1253, 3, 8, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1254, 3, 8, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1255, 3, 8, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1256, 3, 8, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1257, 3, 9, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1258, 3, 9, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1259, 3, 9, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1260, 3, 9, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1261, 3, 10, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1262, 3, 10, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1263, 3, 10, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1264, 3, 10, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1265, 3, 11, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1266, 3, 11, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1267, 3, 11, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1268, 3, 11, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1269, 3, 12, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1270, 3, 12, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1271, 3, 12, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1272, 3, 12, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1273, 3, 13, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1274, 3, 13, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1275, 3, 13, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1276, 3, 13, 4, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1277, 3, 14, 1, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1278, 3, 14, 2, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1279, 3, 14, 3, 1, Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:37 GMT+0530 (India Standard Time)),
(1280, 3, 14, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1281, 3, 15, 1, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1282, 3, 15, 2, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1283, 3, 15, 3, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1284, 3, 15, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1285, 3, 16, 1, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1286, 3, 16, 2, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1287, 3, 16, 3, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1288, 3, 16, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1289, 3, 23, 1, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1290, 3, 23, 2, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1291, 3, 23, 3, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1292, 3, 23, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1293, 3, 25, 1, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1294, 3, 25, 2, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1295, 3, 25, 3, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1296, 3, 25, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1297, 3, 26, 1, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1298, 3, 26, 2, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1299, 3, 26, 3, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time)),
(1300, 3, 26, 4, 1, Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time), Sat Dec 20 2025 14:29:38 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `routes`;
CREATE TABLE `routes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `fare` decimal(10,2) NOT NULL DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sections`;
CREATE TABLE `sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sections` VALUES
(1, 'A', Thu Dec 18 2025 11:21:06 GMT+0530 (India Standard Time), Thu Dec 18 2025 11:21:06 GMT+0530 (India Standard Time)),
(2, 'B', Thu Dec 18 2025 11:21:12 GMT+0530 (India Standard Time), Thu Dec 18 2025 11:21:12 GMT+0530 (India Standard Time)),
(3, 'C', Thu Dec 18 2025 11:21:17 GMT+0530 (India Standard Time), Thu Dec 18 2025 11:21:17 GMT+0530 (India Standard Time)),
(4, 'D', Thu Dec 18 2025 11:21:24 GMT+0530 (India Standard Time), Thu Dec 18 2025 11:21:24 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_current` (`is_current`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sessions` VALUES
(1, '2024-25', Mon Apr 01 2024 00:00:00 GMT+0530 (India Standard Time), Mon Mar 31 2025 00:00:00 GMT+0530 (India Standard Time), 1, Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `sms_log`;
CREATE TABLE `sms_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `recipient_type` enum('students','guardians','staff','individual','class','birthday') NOT NULL,
  `recipient_ids` text DEFAULT NULL,
  `recipient_phones` text DEFAULT NULL,
  `sent_by` int(11) NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sent_by` (`sent_by`),
  KEY `idx_recipient_type` (`recipient_type`),
  KEY `idx_status` (`status`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `sms_log_ibfk_1` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sms_settings`;
CREATE TABLE `sms_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sms_gateway` varchar(50) NOT NULL COMMENT 'Gateway name: twilio, msg91, clickatell, textlocal, sms_country, custom',
  `sms_api_key` varchar(255) DEFAULT NULL,
  `sms_api_secret` varchar(255) DEFAULT NULL,
  `sms_sender_id` varchar(50) DEFAULT NULL,
  `sms_username` varchar(255) DEFAULT NULL,
  `sms_password` varchar(255) DEFAULT NULL,
  `sms_url` varchar(500) DEFAULT NULL COMMENT 'For custom gateway',
  `additional_params` text DEFAULT NULL COMMENT 'JSON for additional gateway-specific parameters',
  `is_enabled` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gateway` (`sms_gateway`),
  KEY `idx_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staff`;
CREATE TABLE `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `role_id` int(11) NOT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `marital_status` enum('single','married','divorced','widowed') DEFAULT 'single',
  `date_of_birth` date DEFAULT NULL,
  `date_of_joining` date NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `emergency_contact` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `permanent_address` text DEFAULT NULL,
  `qualification` text DEFAULT NULL,
  `work_experience` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `epf_no` varchar(100) DEFAULT NULL,
  `basic_salary` decimal(10,2) DEFAULT 0.00,
  `contract_type` enum('permanent','contract','temporary','probation') DEFAULT 'permanent',
  `work_shift` enum('morning','evening','night','flexible') DEFAULT 'morning',
  `location` varchar(255) DEFAULT NULL,
  `number_of_leaves` int(11) DEFAULT 0,
  `bank_account_title` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `ifsc_code` varchar(20) DEFAULT NULL,
  `bank_branch_name` varchar(255) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `twitter_url` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `instagram_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `leaving_date` date DEFAULT NULL,
  `resignation_letter` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_id` (`staff_id`),
  KEY `user_id` (`user_id`),
  KEY `designation_id` (`designation_id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_role` (`role_id`),
  KEY `idx_department` (`department_id`),
  KEY `idx_active` (`is_active`),
  KEY `idx_email` (`email`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `staff_ibfk_3` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `staff_ibfk_4` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `staff` VALUES
(1, 'ST-01', 7, 3, 2, 1, 'Ravi', 'Poddar', 'Ravi''s Father', 'Ravi''s Mother', 'male', 'single', Sat Jan 04 1997 00:00:00 GMT+0530 (India Standard Time), Thu Dec 18 2025 00:00:00 GMT+0530 (India Standard Time), '7418529631', NULL, 'ravi@gmail.com', NULL, 'Chaita North', 'Chaita', 'B.Ed from College', '5 year of teaching experience in DPS', NULL, NULL, '21500.00', 'permanent', 'morning', 'Chaita', 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, Thu Dec 18 2025 16:42:47 GMT+0530 (India Standard Time), Thu Dec 18 2025 16:42:47 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `staff_attendance`;
CREATE TABLE `staff_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','late','absent','half_day','holiday') NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_date` (`staff_id`,`attendance_date`),
  KEY `idx_date` (`attendance_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `staff_attendance_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staff_documents`;
CREATE TABLE `staff_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) NOT NULL,
  `document_type` enum('resume','joining_letter','other') NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_staff` (`staff_id`),
  CONSTRAINT `staff_documents_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admission_no` varchar(50) NOT NULL,
  `roll_no` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `date_of_birth` date NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `religion` varchar(100) DEFAULT NULL,
  `caste` varchar(100) DEFAULT NULL,
  `student_mobile` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `house_id` int(11) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `weight` varchar(20) DEFAULT NULL,
  `as_on_date` date DEFAULT NULL,
  `sibling_id` int(11) DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `father_occupation` varchar(255) DEFAULT NULL,
  `father_phone` varchar(20) DEFAULT NULL,
  `father_email` varchar(255) DEFAULT NULL,
  `father_photo` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `mother_occupation` varchar(255) DEFAULT NULL,
  `mother_phone` varchar(20) DEFAULT NULL,
  `mother_email` varchar(255) DEFAULT NULL,
  `mother_photo` varchar(255) DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `guardian_relation` varchar(100) DEFAULT NULL,
  `guardian_occupation` varchar(255) DEFAULT NULL,
  `guardian_phone` varchar(20) DEFAULT NULL,
  `guardian_email` varchar(255) DEFAULT NULL,
  `guardian_photo` varchar(255) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `permanent_address` text DEFAULT NULL,
  `transport_route_id` int(11) DEFAULT NULL,
  `hostel_id` int(11) DEFAULT NULL,
  `hostel_room_id` int(11) DEFAULT NULL,
  `is_rte` tinyint(1) DEFAULT 0,
  `rte_details` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `disable_reason_id` int(11) DEFAULT NULL,
  `disable_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admission_no` (`admission_no`),
  KEY `user_id` (`user_id`),
  KEY `section_id` (`section_id`),
  KEY `category_id` (`category_id`),
  KEY `house_id` (`house_id`),
  KEY `disable_reason_id` (`disable_reason_id`),
  KEY `idx_admission_no` (`admission_no`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`),
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`),
  CONSTRAINT `students_ibfk_5` FOREIGN KEY (`category_id`) REFERENCES `student_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_6` FOREIGN KEY (`house_id`) REFERENCES `student_houses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_7` FOREIGN KEY (`disable_reason_id`) REFERENCES `disable_reasons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `students` VALUES
(6, 'STU-2025-001', '01', 3, 1, 1, 1, 'Warish', 'Kumar', 'male', Sat Dec 12 1998 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '2145784124', 'student@gamil.com', Thu Jan 02 2025 00:00:00 GMT+0530 (India Standard Time), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7d15nCR1ff/x18zusvTSsCDXInLYnArILaioqCDS/iIqKmpUIlpoG1HxiInxImISYzwAYxs7eMaQq', NULL, NULL, NULL, NULL, NULL, NULL, 'father ji', NULL, '9874574896', 'father@gmail.com', NULL, 'Mother ji', NULL, '', 'mother@gmail.com', NULL, 'Guardian Ji', NULL, NULL, '', 'guardian@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Thu Dec 18 2025 14:07:57 GMT+0530 (India Standard Time), Mon Dec 22 2025 18:56:08 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `student_attendance`;
CREATE TABLE `student_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `status` enum('present','late','absent','half_day','holiday') NOT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_date` (`student_id`,`attendance_date`,`session_id`),
  KEY `section_id` (`section_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_date` (`attendance_date`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `student_attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_attendance_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_attendance_ibfk_4` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_attendance_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_attendance` VALUES
(1, 6, 1, 1, 1, Fri Dec 19 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 1, Fri Dec 19 2025 14:06:41 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:06:41 GMT+0530 (India Standard Time)),
(2, 6, 1, 1, 1, Thu Dec 18 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 1, Fri Dec 19 2025 14:06:53 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:06:53 GMT+0530 (India Standard Time)),
(3, 6, 1, 1, 1, Wed Dec 17 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 1, Fri Dec 19 2025 14:06:59 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:06:59 GMT+0530 (India Standard Time)),
(4, 6, 1, 1, 1, Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 1, Fri Dec 19 2025 14:07:07 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:07:07 GMT+0530 (India Standard Time)),
(5, 6, 1, 1, 1, Mon Dec 15 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 1, Fri Dec 19 2025 14:07:15 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:07:15 GMT+0530 (India Standard Time)),
(6, 6, 1, 1, 1, Sun Dec 14 2025 00:00:00 GMT+0530 (India Standard Time), 'holiday', NULL, 1, Fri Dec 19 2025 14:07:22 GMT+0530 (India Standard Time), Fri Dec 19 2025 14:07:22 GMT+0530 (India Standard Time)),
(7, 6, 1, 1, 1, Thu Dec 25 2025 00:00:00 GMT+0530 (India Standard Time), 'absent', NULL, 7, Thu Dec 25 2025 11:21:47 GMT+0530 (India Standard Time), Thu Dec 25 2025 11:21:47 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `student_attendance_periods`;
CREATE TABLE `student_attendance_periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_attendance_id` int(11) NOT NULL,
  `period_number` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `status` enum('present','late','absent') NOT NULL,
  `note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance_period` (`student_attendance_id`,`period_number`),
  KEY `subject_id` (`subject_id`),
  KEY `idx_period` (`period_number`),
  CONSTRAINT `student_attendance_periods_ibfk_1` FOREIGN KEY (`student_attendance_id`) REFERENCES `student_attendance` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_attendance_periods_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_categories`;
CREATE TABLE `student_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_documents`;
CREATE TABLE `student_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `student_documents_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_houses`;
CREATE TABLE `student_houses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_leave_requests`;
CREATE TABLE `student_leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `apply_date` date NOT NULL,
  `leave_date` date NOT NULL,
  `leave_type` enum('sick','casual','emergency','other') DEFAULT 'casual',
  `reason` text NOT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `session_id` (`session_id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_student` (`student_id`),
  KEY `idx_date` (`leave_date`),
  KEY `idx_status` (`status`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  CONSTRAINT `student_leave_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_leave_requests_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_leave_requests_ibfk_3` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_leave_requests_ibfk_4` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_leave_requests_ibfk_5` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_leave_requests` VALUES
(1, 6, 1, 1, 1, Fri Dec 19 2025 00:00:00 GMT+0530 (India Standard Time), Thu Dec 25 2025 00:00:00 GMT+0530 (India Standard Time), 'casual', 'testing leave', NULL, 'pending', NULL, NULL, NULL, Fri Dec 19 2025 18:37:10 GMT+0530 (India Standard Time), Fri Dec 19 2025 18:37:10 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `type` enum('theory','practical') DEFAULT 'theory',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subjects` VALUES
(1, 'English', 'ENG', 'theory', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time)),
(2, 'Mathematics', 'MATH', 'theory', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time)),
(3, 'Science', 'SCI', 'theory', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time)),
(4, 'Social Studies', 'SST', 'theory', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time)),
(5, 'Hindi', 'HIN', 'theory', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time)),
(6, 'Computer Science', 'CS', 'practical', Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time), Wed Dec 17 2025 19:45:34 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `subject_groups`;
CREATE TABLE `subject_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `idx_class_section` (`class_id`,`section_id`),
  CONSTRAINT `subject_groups_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subject_groups_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subject_groups` VALUES
(1, 'Class One All Subject', 1, 1, Fri Dec 19 2025 18:53:10 GMT+0530 (India Standard Time), Fri Dec 19 2025 18:53:10 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `subject_group_subjects`;
CREATE TABLE `subject_group_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_group_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subject_group_subject` (`subject_group_id`,`subject_id`),
  KEY `idx_subject_group` (`subject_group_id`),
  KEY `idx_subject` (`subject_id`),
  CONSTRAINT `subject_group_subjects_ibfk_1` FOREIGN KEY (`subject_group_id`) REFERENCES `subject_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subject_group_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subject_group_subjects` VALUES
(1, 1, 1, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time)),
(2, 1, 6, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time)),
(3, 1, 5, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time)),
(4, 1, 2, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time)),
(5, 1, 3, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time)),
(6, 1, 4, Fri Dec 19 2025 18:53:11 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `subject_status`;
CREATE TABLE `subject_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `topic_name` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `completion_percentage` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `subject_id` (`subject_id`),
  KEY `idx_class_section_subject` (`class_id`,`section_id`,`subject_id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `subject_status_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subject_status_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subject_status_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `subject_status_ibfk_4` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subject_status` VALUES
(1, 1, 1, 6, NULL, 'Software and hardware', Fri Dec 26 2025 00:00:00 GMT+0530 (India Standard Time), Sat Dec 27 2025 00:00:00 GMT+0530 (India Standard Time), 'in_progress', 5, 'Started the overview of software.', Thu Dec 25 2025 00:02:19 GMT+0530 (India Standard Time), Thu Dec 25 2025 00:02:19 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `system_fields`;
CREATE TABLE `system_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_belongs_to` enum('student','staff') NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `field_label` varchar(255) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_field` (`field_belongs_to`,`field_name`),
  KEY `idx_field_belongs_to` (`field_belongs_to`),
  KEY `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `teacher_ratings`;
CREATE TABLE `teacher_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `review` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_approved` (`is_approved`),
  CONSTRAINT `teacher_ratings_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_ratings_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `todo_tasks`;
CREATE TABLE `todo_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `task_date` date NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_task_date` (`task_date`),
  KEY `idx_is_completed` (`is_completed`),
  CONSTRAINT `todo_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` VALUES
(1, 'admin@schoolwizard.com', '$2a$10$HbKgknHagvcz/MdxqsA93./PUcO3vlhKNkQOaKswlKOlxvbYEC41q', 'System Administrator', 1, 1, NULL, Wed Dec 17 2025 19:35:26 GMT+0530 (India Standard Time), Thu Dec 18 2025 14:20:16 GMT+0530 (India Standard Time)),
(3, 'student@gamil.com', '$2a$10$HbKgknHagvcz/MdxqsA93./PUcO3vlhKNkQOaKswlKOlxvbYEC41q', 'Warish Kumar', 4, 1, NULL, Thu Dec 18 2025 14:07:57 GMT+0530 (India Standard Time), Thu Dec 18 2025 14:20:21 GMT+0530 (India Standard Time)),
(4, 'father@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'father ji', 5, 1, NULL, Thu Dec 18 2025 14:07:57 GMT+0530 (India Standard Time), Thu Dec 18 2025 14:10:02 GMT+0530 (India Standard Time)),
(5, 'mother@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Mother ji', 5, 1, NULL, Thu Dec 18 2025 14:07:57 GMT+0530 (India Standard Time), Thu Dec 18 2025 14:10:10 GMT+0530 (India Standard Time)),
(6, 'guardian@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Guardian Ji', 5, 1, NULL, Thu Dec 18 2025 14:07:57 GMT+0530 (India Standard Time), Thu Dec 18 2025 14:10:16 GMT+0530 (India Standard Time)),
(7, 'ravi@gmail.com', '$2a$10$HbKgknHagvcz/MdxqsA93./PUcO3vlhKNkQOaKswlKOlxvbYEC41q', 'Ravi Poddar', 3, 1, NULL, Thu Dec 18 2025 16:42:47 GMT+0530 (India Standard Time), Fri Dec 19 2025 18:40:23 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_no` varchar(50) NOT NULL,
  `vehicle_model` varchar(255) DEFAULT NULL,
  `year_made` year(4) DEFAULT NULL,
  `driver_name` varchar(255) DEFAULT NULL,
  `driver_license` varchar(100) DEFAULT NULL,
  `driver_contact` varchar(20) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicle_no` (`vehicle_no`),
  KEY `idx_vehicle_no` (`vehicle_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `vehicle_assignments`;
CREATE TABLE `vehicle_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `route_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_vehicle` (`route_id`,`vehicle_id`),
  KEY `idx_route` (`route_id`),
  KEY `idx_vehicle` (`vehicle_id`),
  CONSTRAINT `vehicle_assignments_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `vehicle_assignments_ibfk_2` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `visitors`;
CREATE TABLE `visitors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purpose_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `id_card` varchar(100) DEFAULT NULL,
  `number_of_person` int(11) DEFAULT 1,
  `visit_date` date NOT NULL,
  `in_time` time NOT NULL,
  `out_time` time DEFAULT NULL,
  `note` text DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `purpose_id` (`purpose_id`),
  KEY `idx_visit_date` (`visit_date`),
  CONSTRAINT `visitors_ibfk_1` FOREIGN KEY (`purpose_id`) REFERENCES `front_office_purposes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
