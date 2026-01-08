-- Database Backup
-- Generated: 2025-12-16T16:00:36.067Z
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admission_contact_details` VALUES
(1, '["+91 1234567890","+91 9876543210"]', '["admissions@schoolname.edu","info@schoolname.edu"]', 'School Address, City
State - PIN Code', 'Monday - Friday: 9:00 AM - 5:00 PM
Saturday: 9:00 AM - 1:00 PM', 1, 1, Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:57:23 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admission_enquiries` VALUES
(1, 'Warish Kumar', '780787488', 'warish@gmail.com', 'Lohagir', 'Lohagir ', 'Test', Sat Nov 29 2025 00:00:00 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, 4, 3, 'pending', Sat Nov 29 2025 23:40:34 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:40:34 GMT+0530 (India Standard Time));

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
(1, 'Application Start', Wed Jan 01 2025 00:00:00 GMT+0530 (India Standard Time), 'Admission applications open for the new academic year', 1, 1, Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time)),
(2, 'Last Date', Mon Mar 31 2025 00:00:00 GMT+0530 (India Standard Time), 'Last date to submit admission applications', 2, 1, Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time)),
(3, 'Assessment', Tue Apr 15 2025 00:00:00 GMT+0530 (India Standard Time), 'Student assessment and interaction sessions (April 15-30, 2025)', 3, 1, Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time)),
(4, 'Result Declaration', Thu May 15 2025 00:00:00 GMT+0530 (India Standard Time), 'Admission results will be announced', 4, 1, Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:47:40 GMT+0530 (India Standard Time));

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
  `title` varchar(255) DEFAULT NULL,
  `exam_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admit_card_templates` VALUES
(1, 'Template1', 'SVN Chaita', 'SVN Chaita Header', 'ADMIT Card Header', 'Header right text', 'Hi {student_name}

This is your exam role {exam_roll_no} and class roll {roll_no}. 
Father''s Name : {father_name}
Mother''s Name: {mother_name}
Class : {class}

THanks', 'Footer left', 'Footer center', 'Footer right', 50, 50, 400, 800, 1, 100, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAPDw8NDQ0NDQ0NDQ0NDQ0NDQ8NDQ0NFREWFhURExMYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0NFQ8PFSsZFRkrKy0rKysrLSsrLS0tLS03Ny0tLSsrLSsrNy0rNysrLS03KzcrLSs3LS0tKy0rKysrN//AABEIAK4BIgMBIgACEQEDEQH/xAAaAAADAQEBAQAAAAAAAAAAAAACAwQBAAUG/8QAIhAAAwEBAAICAwEBAQAAAAAAAAECAxEEEiFRE0FhMQVx/8QAGgEAAwEBAQEAAAAAAAAAAAAAAQIDAAQFBv/EAB4RAQEBAQEBAAMBAQAAAAAAAAABAhESAyFBUTET/9oADAMBAAIRAxEAPwCeEOgVA6T0nzh2RXmTZIsyRrDSqM5KYQrJFUQJVM1sj85OzzKpgVfMZnA+UZCHS', Sun Nov 30 2025 13:06:06 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:06:06 GMT+0530 (India Standard Time), 'Admint card', 'Test Exam');

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `alumni` VALUES
(1, NULL, NULL, 'Warish', 'Alumni', 'mwarishji@gmail.com', '8200614808', NULL, Wed Dec 24 2025 00:00:00 GMT+0530 (India Standard Time), 'male', 2022, 4, NULL, NULL, NULL, 'Web Developer', 'Rysun', 'Senior executive', 'Ahmedabad', NULL, NULL, NULL, NULL, NULL, '/uploads/alumni/1764647237957-343740145.png', NULL, NULL, NULL, NULL, NULL, NULL, 'active', Tue Dec 02 2025 09:17:18 GMT+0530 (India Standard Time), Tue Dec 02 2025 09:17:18 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 0, 'daily', '02:00:00', 7, NULL, Fri Dec 05 2025 19:25:10 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:25:05 GMT+0530 (India Standard Time), Fri Dec 05 2025 19:25:10 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `books` VALUES
(1, 'Text Book', 'BK01', NULL, 'K C Sinha', 'KC Sinha', 3, '10', 5, 4, '120.00', Wed Jan 01 2025 00:00:00 GMT+0530 (India Standard Time), 'This book is related to mathematics of KC Sinha', Sun Nov 30 2025 17:06:17 GMT+0530 (India Standard Time), Sun Nov 30 2025 17:34:57 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `calendar_events` VALUES
(1, 2, 'Annual Function', 'A culture program organized at SVN on the occasion of completing 10year.', Thu Dec 04 2025 00:00:00 GMT+0530 (India Standard Time), '#3B82F6', 'public', NULL, Mon Dec 01 2025 22:04:25 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:04:25 GMT+0530 (India Standard Time)),
(2, 2, 'Annual Function', 'Cultural Program', Thu Dec 04 2025 00:00:00 GMT+0530 (India Standard Time), '#3B82F6', 'public', NULL, Mon Dec 01 2025 22:08:46 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:08:46 GMT+0530 (India Standard Time)),
(3, 2, 'Annual Function', 'Cultural Program', Wed Dec 03 2025 00:00:00 GMT+0530 (India Standard Time), '#3B82F6', 'public', NULL, Mon Dec 01 2025 22:09:00 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:09:00 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `certificate_templates` VALUES
(1, 'Tenth Pass Out Certificate', 'SVN Chaita', 'Certificate', 'ESTD: 2004', 'Hi {student_name}

This is certified that {Student_name} attended this seminar.

Thanks', 'FooterLeftText', 'FooterCenterText', 'FooterRightText', 100, 100, 400, 800, 1, 100, NULL, Mon Dec 01 2025 21:37:31 GMT+0530 (India Standard Time), Mon Dec 01 2025 21:37:31 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `numeric_value` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `classes` VALUES
(1, 'Nur', NULL, Sat Nov 29 2025 23:25:04 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:26:15 GMT+0530 (India Standard Time)),
(2, 'LKG', 0, Sat Nov 29 2025 23:25:15 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:27:37 GMT+0530 (India Standard Time)),
(3, 'UKG', NULL, Sat Nov 29 2025 23:25:21 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:26:35 GMT+0530 (India Standard Time)),
(4, 'One', 1, Sat Nov 29 2025 23:25:30 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:27:01 GMT+0530 (India Standard Time)),
(5, 'Two', 2, Sat Nov 29 2025 23:25:35 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:27:13 GMT+0530 (India Standard Time)),
(6, 'Three', 3, Sat Nov 29 2025 23:25:42 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:27:25 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `class_sections` VALUES
(2, 1, 1, Sat Nov 29 2025 23:26:15 GMT+0530 (India Standard Time)),
(6, 3, 1, Sat Nov 29 2025 23:26:35 GMT+0530 (India Standard Time)),
(7, 4, 1, Sat Nov 29 2025 23:27:02 GMT+0530 (India Standard Time)),
(8, 5, 1, Sat Nov 29 2025 23:27:13 GMT+0530 (India Standard Time)),
(9, 6, 1, Sat Nov 29 2025 23:27:25 GMT+0530 (India Standard Time)),
(10, 2, 1, Sat Nov 29 2025 23:27:37 GMT+0530 (India Standard Time)),
(11, 2, 2, Sat Nov 29 2025 23:27:37 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `complains` VALUES
(1, 3, 3, 'Ramesh', '4754875478', Mon Dec 01 2025 00:00:00 GMT+0530 (India Standard Time), 'Home work mai galat likha hua tha.', NULL, NULL, NULL, NULL, 'in_progress', Sun Nov 30 2025 15:14:11 GMT+0530 (India Standard Time), Sun Nov 30 2025 15:14:11 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departments` VALUES
(1, 'Account', NULL, Sun Nov 30 2025 00:54:11 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:54:11 GMT+0530 (India Standard Time)),
(2, 'Academic', 'Academic Department', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(3, 'Administration', 'Administration Department', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(4, 'Library', 'Library Department', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(5, 'Accounts', 'Accounts Department', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(6, 'Front Office', 'Front Office Department', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `designations` VALUES
(1, 'Senior L1', NULL, Sun Nov 30 2025 00:54:30 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:54:30 GMT+0530 (India Standard Time)),
(2, 'Senior Teacher', 'Senior Teacher', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(3, 'Teacher', 'Teacher', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(4, 'Librarian', 'Librarian', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(5, 'Senior Accountant', 'Senior Accountant', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(6, 'Accountant', 'Accountant', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(7, 'Receptionist', 'Receptionist', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time)),
(8, 'Administrative Officer', 'Administrative Officer', Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:16:35 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `disable_reasons`;
CREATE TABLE `disable_reasons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `disable_reasons` VALUES
(1, 'Deaf', Sun Nov 30 2025 13:53:05 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:53:05 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `download_contents` VALUES
(1, 'test content1', 'study_material', 'students', 4, 1, Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), NULL, '/uploads/downloads/1764511090572-453959950.jpeg', 'WhatsApp Image 2025-11-27 at 9.55.06 AM.jpeg', 197944, 'image/jpeg', 2, Sun Nov 30 2025 19:28:10 GMT+0530 (India Standard Time), Sun Nov 30 2025 19:28:10 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `email_settings` VALUES
(1, 'smtp.hostinger.com', 465, 1, 'info@wtechnology.in', 'Admin@6706', 'info@wtechnology.in', 'SchoolWizard', 1, Sun Nov 30 2025 14:11:57 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:40:40 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `events` VALUES
(1, 'Annual Sports Day', 'annual-sports-day-2025', 'Join us for our annual sports day featuring exciting competitions, races, and team events. All students, parents, and staff are welcome.', 'Sports', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), '09:00:00', Wed Dec 10 2025 00:00:00 GMT+0530 (India Standard Time), NULL, 'School Grounds', NULL, 1, 1, Sun Dec 07 2025 01:46:56 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:56:26 GMT+0530 (India Standard Time)),
(2, 'Science Exhibition', 'science-exhibition-2025', 'Students showcase innovative science projects and experiments. Open to all visitors interested in scientific exploration.', 'Academic', Thu Jan 01 2026 00:00:00 GMT+0530 (India Standard Time), '10:00:00', NULL, NULL, 'School Auditorium', NULL, 0, 1, Sun Dec 07 2025 01:46:56 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:46:56 GMT+0530 (India Standard Time)),
(3, 'Annual Function', 'annual-function', 'THis is just testing events', 'Cultural', Fri Dec 05 2025 00:00:00 GMT+0530 (India Standard Time), '01:53:00', Fri Dec 05 2025 00:00:00 GMT+0530 (India Standard Time), '19:54:00', NULL, '/uploads/front-cms/news-events/news-events-1765052679154-455899136.jpg', 0, 1, Sun Dec 07 2025 01:54:39 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:54:39 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exams` VALUES
(1, 1, 'Annual exam', 1, 1, 'test', Sun Nov 30 2025 11:39:47 GMT+0530 (India Standard Time), Sun Nov 30 2025 11:39:47 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `exam_groups` VALUES
(1, 'Annual Examination', 'general_purpose', NULL, Sun Nov 30 2025 11:37:58 GMT+0530 (India Standard Time), Sun Nov 30 2025 11:37:58 GMT+0530 (India Standard Time)),
(2, 'Exam Group1', 'general_purpose', NULL, Sun Nov 30 2025 12:53:36 GMT+0530 (India Standard Time), Sun Nov 30 2025 12:53:36 GMT+0530 (India Standard Time)),
(3, 'Exam Group 1', 'general_purpose', NULL, Sun Nov 30 2025 12:53:54 GMT+0530 (India Standard Time), Sun Nov 30 2025 12:53:54 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_reminder_settings` VALUES
(1, 'before_2', 0, 2, Tue Dec 16 2025 16:27:18 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:27:19 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fees_types` VALUES
(1, 'Hostel Fee', 'HF', NULL, Sun Nov 30 2025 11:23:09 GMT+0530 (India Standard Time), Sun Nov 30 2025 11:23:09 GMT+0530 (India Standard Time)),
(2, 'School Fee', 'SF', NULL, Sun Nov 30 2025 11:23:20 GMT+0530 (India Standard Time), Sun Nov 30 2025 11:23:20 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_about_us_achievements`;
CREATE TABLE `front_cms_about_us_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `achievement_year` varchar(20) NOT NULL,
  `achievement_title` varchar(255) NOT NULL,
  `achievement_description` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_about_us_achievements` VALUES
(1, '2004', 'Started A New Journey ', 'Recognized as the best school in the region for academic excellence, innovative teaching methods, and outstanding student achievements.', 0, 1, Sun Dec 07 2025 00:22:43 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:22:43 GMT+0530 (India Standard Time)),
(2, '2005', 'Green School Certification', 'Achieved green school certification for our comprehensive environmental initiatives, sustainable practices, and eco-friendly campus.', 0, 1, Sun Dec 07 2025 00:23:14 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:23:14 GMT+0530 (India Standard Time)),
(3, '2022', 'Sports Excellence Award', 'Won multiple championships in inter-school sports competitions, demonstrating excellence in athletics and team spirit.', 0, 1, Sun Dec 07 2025 00:23:53 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:23:53 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_about_us_counters`;
CREATE TABLE `front_cms_about_us_counters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `counter_number` varchar(50) NOT NULL,
  `counter_label` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `front_cms_about_us_history`;
CREATE TABLE `front_cms_about_us_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `history_content` text NOT NULL,
  `history_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_history` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_about_us_history` VALUES
(1, 'Founded in 1974, our school has been a beacon of educational excellence for over five decades. What started as a small institution with a vision to provide quality education has grown into one of the most respected schools in the region.

Over the years, we have continuously evolved to meet the changing needs of education while maintaining our core values of excellence, integrity, and community. Our commitment to providing a well-rounded education has helped thousands of students achieve their dreams and make meaningful contributions to society.

Today, we stand proud of our legacy while looking forward to an even brighter future. We continue to invest in modern facilities, innovative teaching methods, and comprehensive programs that prepare our students for the challenges and opportunities of the 21st century.', '/uploads/front-cms/about-us/history_image-1765046833443.jpg', Sat Dec 06 2025 23:48:42 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:17:13 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_about_us_leadership`;
CREATE TABLE `front_cms_about_us_leadership` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `leader_name` varchar(255) NOT NULL,
  `leader_role` varchar(255) NOT NULL,
  `leader_bio` text NOT NULL,
  `leader_image` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_about_us_leadership` VALUES
(1, 'Dr. John Smith', 'Principal', 'With over 25 years of experience in education, Dr. Smith leads our school with vision and dedication. He holds a Ph.D. in Educational Leadership and has been instrumental in implementing innovative teaching methodologies. His commitment to student success and academic excellence has shaped our school into a premier educational institution', '/uploads/front-cms/about-us/leader_image-1765047314236.png', 0, 1, Sun Dec 07 2025 00:25:14 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:25:14 GMT+0530 (India Standard Time)),
(2, 'Mrs. Sarah Johnson', 'Vice Principal', 'Mrs. Johnson brings innovation and passion to curriculum development and student welfare. With 20 years of teaching and administrative experience, she has been a driving force behind our student-centered approach to education. She holds a Master''s degree in Educational Administration and is dedicated to creating a nurturing learning environment.', '/uploads/front-cms/about-us/leader_image-1765047354243.png', 0, 1, Sun Dec 07 2025 00:25:54 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:25:54 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_about_us_mission_vision`;
CREATE TABLE `front_cms_about_us_mission_vision` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mission_content` text NOT NULL,
  `vision_content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mission_vision` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_about_us_mission_vision` VALUES
(1, 'To provide a holistic education that nurtures the intellectual, physical, emotional, and social development of every student. We are committed to creating a learning environment that inspires curiosity, fosters creativity, and prepares students to become responsible global citizens.', 'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and the development of well-rounded individuals who contribute positively to society. We envision a school where every student realizes their full potential.', Sat Dec 06 2025 23:48:42 GMT+0530 (India Standard Time), Sat Dec 06 2025 23:48:42 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_about_us_values`;
CREATE TABLE `front_cms_about_us_values` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `icon_class` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_about_us_values` VALUES
(1, 'fas fa-star', 'Excellence', 'We strive for academic excellence in all our programs and activities, fostering a culture of continuous improvement and high achievement.', 0, 1, Sun Dec 07 2025 00:19:56 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:19:56 GMT+0530 (India Standard Time)),
(2, 'fas fa-heart', 'Integrity', 'We uphold the highest standards of honesty, ethical behavior, and moral courage in all our actions and decisions.', 0, 1, Sun Dec 07 2025 00:20:29 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:20:29 GMT+0530 (India Standard Time)),
(3, 'fas fa-users', 'Community', 'We foster a sense of belonging, collaboration, and mutual respect among all members of our school community', 0, 1, Sun Dec 07 2025 00:21:12 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:21:12 GMT+0530 (India Standard Time)),
(4, 'fas fa-lightbulb', 'Innovation', 'We embrace new ideas, creative thinking, and modern technologies to enhance learning and prepare students for the future.', 0, 1, Sun Dec 07 2025 00:21:42 GMT+0530 (India Standard Time), Sun Dec 07 2025 00:21:42 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_banners`;
CREATE TABLE `front_cms_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_url` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_banners` VALUES
(1, 'This is the banner Title', 'This is the banner Description', '/uploads/front-cms/banners/banner-1765021780822-553546408.png', 'Test Button', 'https://www.facebook.com/svnchaita/', 1, 1, Sat Dec 06 2025 17:19:40 GMT+0530 (India Standard Time), Sat Dec 06 2025 22:59:48 GMT+0530 (India Standard Time)),
(2, 'Banner 2 Title', 'Test banner 2 description', '/uploads/front-cms/banners/banner-1765021897404-923259576.png', NULL, NULL, 2, 1, Sat Dec 06 2025 17:21:37 GMT+0530 (India Standard Time), Sat Dec 06 2025 23:00:17 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_banner_images` VALUES
(1, 'https://sattvatheschool.com/wp-content/uploads/2025/04/freepik__upload__3392-e1745560760614.png', 'svn', NULL, 0, 1, Sat Dec 06 2025 13:10:25 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:10:25 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_galleries` VALUES
(1, 'First Gallery', NULL, NULL, NULL, NULL, 1, NULL, 'first-gallery', Sat Dec 06 2025 13:09:03 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:09:03 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_gallery_images` VALUES
(1, 1, 'https://static.vecteezy.com/system/resources/thumbnails/008/734/694/small/happy-school-children-in-front-of-building-school-vector.jpg', NULL, 0, Sat Dec 06 2025 13:09:03 GMT+0530 (India Standard Time)),
(2, 1, 'https://sattvatheschool.com/wp-content/uploads/2025/04/freepik__upload__3392-e1745560760614.png', NULL, 1, Sat Dec 06 2025 13:09:03 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_media` VALUES
(1, 'Filter issue.mp4', '/uploads/front-cms/1765006805137-105681891.mp4', 'document', 2207929, 'video/mp4', NULL, NULL, Sat Dec 06 2025 13:10:05 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_menus`;
CREATE TABLE `front_cms_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_menus` VALUES
(1, 'Main navigation', NULL, Sat Dec 06 2025 13:06:19 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:06:19 GMT+0530 (India Standard Time)),
(2, 'Footer links', NULL, Sat Dec 06 2025 13:06:28 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:06:28 GMT+0530 (India Standard Time)),
(3, 'Quick links', NULL, Sat Dec 06 2025 13:06:38 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:06:38 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_menu_items` VALUES
(1, 2, NULL, 'Home Page', NULL, 0, 1, 1, Sat Dec 06 2025 14:21:32 GMT+0530 (India Standard Time), Sat Dec 06 2025 14:22:00 GMT+0530 (India Standard Time)),
(2, 2, NULL, 'Contact Us', NULL, 0, 3, 2, Sat Dec 06 2025 14:21:47 GMT+0530 (India Standard Time), Sat Dec 06 2025 14:21:55 GMT+0530 (India Standard Time)),
(3, 1, NULL, 'Home', NULL, 0, 1, 3, Sat Dec 06 2025 14:50:55 GMT+0530 (India Standard Time), Sat Dec 06 2025 14:52:01 GMT+0530 (India Standard Time)),
(4, 1, NULL, 'About Us', NULL, 0, 2, 2, Sat Dec 06 2025 14:51:06 GMT+0530 (India Standard Time), Sat Dec 06 2025 14:51:32 GMT+0530 (India Standard Time)),
(5, 1, NULL, 'Contact Us', NULL, 0, 3, 1, Sat Dec 06 2025 14:51:22 GMT+0530 (India Standard Time), Sat Dec 06 2025 14:52:08 GMT+0530 (India Standard Time)),
(6, 1, NULL, 'News', NULL, 0, 4, 4, Sat Dec 06 2025 15:06:26 GMT+0530 (India Standard Time), Sat Dec 06 2025 15:06:26 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_news` VALUES
(1, 'Test New', Sat Dec 06 2025 00:00:00 GMT+0530 (India Standard Time), 'This is the description of the test news', NULL, NULL, NULL, 1, NULL, 'test-new', Sat Dec 06 2025 13:09:37 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:09:37 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_pages` VALUES
(1, 'Home', 'standard', 'This is the home page', 'SVN Chaita,', NULL, NULL, 1, NULL, 'home', Sat Dec 06 2025 13:04:24 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:04:24 GMT+0530 (India Standard Time)),
(2, 'About Us', 'standard', NULL, NULL, NULL, NULL, 1, NULL, 'about-us', Sat Dec 06 2025 13:05:24 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:05:24 GMT+0530 (India Standard Time)),
(3, 'Contact Us', 'standard', NULL, NULL, NULL, NULL, 1, NULL, 'contact-us', Sat Dec 06 2025 13:05:34 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:05:34 GMT+0530 (India Standard Time)),
(4, 'News', 'news', 'This is the News page', NULL, NULL, NULL, 1, NULL, 'news', Sat Dec 06 2025 15:05:36 GMT+0530 (India Standard Time), Sat Dec 06 2025 15:05:36 GMT+0530 (India Standard Time));

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
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_settings` VALUES
(1, 1, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'default', NULL, Thu Dec 04 2025 10:24:53 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:53 GMT+0530 (India Standard Time)),
(2, 1, 1, 1, '/uploads/front-cms/logo.jpg', '/uploads/front-cms/favicon.jpg', '', '', '', '', '', '', '', '', '', 'default', NULL, Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 13:02:10 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_cms_website_settings`;
CREATE TABLE `front_cms_website_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `website_logo` varchar(255) DEFAULT NULL,
  `school_name` varchar(255) NOT NULL DEFAULT 'School Name',
  `tag_line` varchar(255) DEFAULT NULL,
  `tag_line_visible` tinyint(1) DEFAULT 1,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `facebook_url` varchar(255) DEFAULT NULL,
  `facebook_enabled` tinyint(1) DEFAULT 0,
  `twitter_url` varchar(255) DEFAULT NULL,
  `twitter_enabled` tinyint(1) DEFAULT 0,
  `youtube_url` varchar(255) DEFAULT NULL,
  `youtube_enabled` tinyint(1) DEFAULT 0,
  `instagram_url` varchar(255) DEFAULT NULL,
  `instagram_enabled` tinyint(1) DEFAULT 0,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `linkedin_enabled` tinyint(1) DEFAULT 0,
  `whatsapp_url` varchar(255) DEFAULT NULL,
  `whatsapp_enabled` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_settings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_cms_website_settings` VALUES
(1, NULL, 'SVN Chaita', 'A School with a Difference', 0, 'info@schoolname.edu', '+91 1234567890', 'https://www.facebook.com/svnchaita/', 1, NULL, 0, 'https://www.youtube.com/c/SVNChaitaSamastipur', 1, 'https://www.instagram.com/svnchaita/', 1, NULL, 0, NULL, 0, Sat Dec 06 2025 17:03:44 GMT+0530 (India Standard Time), Sat Dec 06 2025 22:58:43 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_office_complain_types`;
CREATE TABLE `front_office_complain_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_office_complain_types` VALUES
(1, 'Student Complain', NULL, Sat Nov 29 2025 23:42:38 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:38 GMT+0530 (India Standard Time)),
(2, 'Teacher Complain', NULL, Sat Nov 29 2025 23:42:46 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:46 GMT+0530 (India Standard Time)),
(3, 'Parent Complain', NULL, Sat Nov 29 2025 23:42:54 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:54 GMT+0530 (India Standard Time)),
(4, 'Other Staff complain', NULL, Sat Nov 29 2025 23:43:03 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:43:03 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_office_purposes`;
CREATE TABLE `front_office_purposes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_office_purposes` VALUES
(1, 'To Meet with Techer staff', NULL, Sat Nov 29 2025 23:43:23 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:43:23 GMT+0530 (India Standard Time)),
(2, 'To Meet with Student', NULL, Sat Nov 29 2025 23:43:36 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:43:36 GMT+0530 (India Standard Time)),
(3, 'Office related work', NULL, Sat Nov 29 2025 23:44:06 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:44:06 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_office_references`;
CREATE TABLE `front_office_references` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_office_references` VALUES
(1, 'Latbabu', NULL, Sat Nov 29 2025 23:42:20 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:20 GMT+0530 (India Standard Time)),
(2, 'Kari', NULL, Sat Nov 29 2025 23:42:28 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:28 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `front_office_sources`;
CREATE TABLE `front_office_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `front_office_sources` VALUES
(1, 'Teacher', NULL, Sat Nov 29 2025 23:41:40 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:41:40 GMT+0530 (India Standard Time)),
(2, 'Students', NULL, Sat Nov 29 2025 23:41:50 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:41:50 GMT+0530 (India Standard Time)),
(3, 'Other Staff', NULL, Sat Nov 29 2025 23:42:08 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:42:08 GMT+0530 (India Standard Time));

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
(1, 'Events', 'School events and celebrations', 1, 1, Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time)),
(2, 'Sports', 'Sports activities and competitions', 2, 1, Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time)),
(3, 'Academics', 'Academic activities and achievements', 3, 1, Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time)),
(4, 'Cultural', 'Cultural programs and performances', 4, 1, Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:08:55 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery_images` VALUES
(1, 1, 'Event01', NULL, '/uploads/front-cms/gallery/gallery-1765050412169-761978518.png', 0, 1, Sun Dec 07 2025 01:16:52 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:16:52 GMT+0530 (India Standard Time)),
(2, 1, 'Event02', NULL, '/uploads/front-cms/gallery/gallery-1765050440548-271838870.png', 0, 1, Sun Dec 07 2025 01:17:20 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:17:20 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=316 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `general_settings` VALUES
(1, 'school_name', 'SVN Chaita', 'text', 'School Name', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:48 GMT+0530 (India Standard Time)),
(2, 'school_code', '', 'text', 'School Code/Affiliation Number', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:48 GMT+0530 (India Standard Time)),
(3, 'address', '', 'text', 'School Address', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:48 GMT+0530 (India Standard Time)),
(4, 'phone', '', 'text', 'School Phone', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:48 GMT+0530 (India Standard Time)),
(5, 'email', '', 'text', 'School Email', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:48 GMT+0530 (India Standard Time)),
(6, 'session_start_month', 'April', 'text', 'Academic Session Start Month', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(7, 'attendance_type', 'day_wise', 'text', 'Attendance Type: day_wise or period_wise', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(8, 'biometric_attendance', '0', 'boolean', 'Enable Biometric Attendance', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(9, 'language', 'english', 'text', 'Default System Language', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(10, 'date_format', 'Y-m-d', 'text', 'Date Format', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(11, 'timezone', 'UTC', 'text', 'System Timezone', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(12, 'currency', 'USD', 'text', 'Currency Code', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(13, 'currency_symbol', '$', 'text', 'Currency Symbol', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(14, 'currency_symbol_place', 'before', 'text', 'Currency Symbol Place: before or after', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(15, 'admission_no_prefix', '', 'text', 'Admission Number Prefix', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(16, 'admission_no_digit', '6', 'number', 'Admission Number Digits', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(17, 'admission_start_from', '1', 'number', 'Admission Number Start From', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(18, 'auto_staff_id', '0', 'boolean', 'Auto Generate Staff ID', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(19, 'staff_id_prefix', '', 'text', 'Staff ID Prefix', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(20, 'staff_no_digit', '6', 'number', 'Staff ID Digits', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(21, 'staff_id_start_from', '1', 'number', 'Staff ID Start From', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(22, 'duplicate_fees_invoice', '0', 'boolean', 'Allow Duplicate Fees Invoice', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(23, 'fees_due_days', '30', 'number', 'Fees Due Days', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(24, 'teacher_restricted_mode', '0', 'boolean', 'Teacher Restricted Mode', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(25, 'online_admission', '0', 'boolean', 'Enable Online Admission', Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(26, 'print_logo', '', 'text', 'Print Logo Path', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(27, 'admin_logo', '/uploads/logos/admin-logo.jpg', 'text', 'Admin Logo Path', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(28, 'admin_small_logo', '', 'text', 'Admin Small Logo Path', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(29, 'app_logo', '', 'text', 'Mobile App Logo Path', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(30, 'mobile_app_api_url', '', 'text', 'Mobile App API URL', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(31, 'mobile_app_primary_color', '#2563eb,#2563eb', 'text', 'Mobile App Primary Color Code', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(32, 'mobile_app_secondary_color', '#64748b,#64748b', 'text', 'Mobile App Secondary Color Code', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(33, 'android_app_registered', '0', 'boolean', 'Android App Registration Status', Fri Dec 05 2025 19:27:29 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time)),
(187, 'favicon', '/uploads/logos/favicon.jpg', 'text', NULL, Sat Dec 06 2025 12:37:06 GMT+0530 (India Standard Time), Sat Dec 06 2025 12:45:49 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `homework` VALUES
(1, 4, 1, NULL, 7, Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), Mon Dec 01 2025 00:00:00 GMT+0530 (India Standard Time), 'Test homework', NULL, NULL, 2, Sun Nov 30 2025 16:22:53 GMT+0530 (India Standard Time), Sun Nov 30 2025 16:22:53 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hostels` VALUES
(1, 'Hostel Wing A', 'boys', 'SVN Chaita School Campus', 20, 'Test', Mon Dec 01 2025 19:17:45 GMT+0530 (India Standard Time), Mon Dec 01 2025 19:17:45 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hostel_rooms` VALUES
(1, 1, 1, 'Room 01', 4, '400.00', NULL, Mon Dec 01 2025 19:18:31 GMT+0530 (India Standard Time), Mon Dec 01 2025 19:19:41 GMT+0530 (India Standard Time)),
(2, 1, 2, 'Room 0', 8, '200.00', NULL, Mon Dec 01 2025 19:19:28 GMT+0530 (India Standard Time), Mon Dec 01 2025 19:19:28 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `id_card_templates` VALUES
(1, 'ID Card', NULL, NULL, NULL, 'SVN Chaita', 'Chaita, Samastipur', '7808689033', 'mwarishji@gmail.com', 'For the best, Forgot the rest', '#000000', 1, 1, 1, 1, 0, 1, 1, 1, 0, Mon Dec 01 2025 21:50:38 GMT+0530 (India Standard Time), Mon Dec 01 2025 21:50:38 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `items` VALUES
(1, 'pen', 1, NULL, Sun Nov 30 2025 21:47:04 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:47:04 GMT+0530 (India Standard Time)),
(2, 'pencil', 2, NULL, Sun Nov 30 2025 21:47:15 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:47:15 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `item_categories`;
CREATE TABLE `item_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_categories` VALUES
(1, 'Pen', NULL, Sun Nov 30 2025 21:44:48 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:44:48 GMT+0530 (India Standard Time)),
(2, 'Pencil', NULL, Sun Nov 30 2025 21:44:59 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:44:59 GMT+0530 (India Standard Time)),
(3, 'Gum', NULL, Sun Nov 30 2025 21:45:07 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:45:07 GMT+0530 (India Standard Time)),
(4, 'Marker', NULL, Sun Nov 30 2025 21:45:19 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:45:19 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_issues` VALUES
(1, 1, 1, 'student', 1, 'Ravi', Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), NULL, 1, NULL, 'issued', NULL, 2, Sun Nov 30 2025 21:58:27 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:58:27 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_stocks` VALUES
(1, 1, 1, 1, 1, 20, Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, 2, Sun Nov 30 2025 21:54:48 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:54:48 GMT+0530 (India Standard Time)),
(2, 2, 2, 1, 1, 12, Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, 2, Sun Nov 30 2025 21:55:11 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:55:11 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_stores` VALUES
(1, 'Pen', 'ST1', NULL, Sun Nov 30 2025 21:45:41 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:45:41 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_suppliers` VALUES
(1, 'test supplier', '7808689033', 'testsupplier@gmail.com', 'test', 'test supplier person', '784541214521', 'testsupplier@gmail.com', NULL, Sun Nov 30 2025 21:46:50 GMT+0530 (India Standard Time), Sun Nov 30 2025 21:46:50 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `languages` VALUES
(1, 'English', 'en', 1, 1, Thu Dec 04 2025 10:24:54 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:54 GMT+0530 (India Standard Time)),
(2, 'Hindi', 'hi', 0, 1, Thu Dec 04 2025 10:24:54 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:54 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(1, 'Sick Leave', 'sick leve', NULL, 1, Sun Nov 30 2025 00:54:51 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:54:51 GMT+0530 (India Standard Time)),
(2, 'Casual Leave', 'casual leave', NULL, 1, Sun Nov 30 2025 00:55:14 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:55:14 GMT+0530 (India Standard Time)),
(3, 'Maternity Leave', NULL, NULL, 1, Sun Nov 30 2025 00:55:26 GMT+0530 (India Standard Time), Sun Nov 30 2025 00:55:26 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lesson_plans` VALUES
(1, 5, 1, 7, NULL, 'Computer Hardware', Wed Dec 03 2025 00:00:00 GMT+0530 (India Standard Time), 'Shopify Store Demo & Discussion', 'test', 'test', 'test', 'test', 'test', 'test', 'test', 'published', Tue Dec 02 2025 10:27:53 GMT+0530 (India Standard Time), Tue Dec 02 2025 10:27:53 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `marksheet_templates` VALUES
(1, 'template 1', 'svn chaita', 'marksheet', 'estd2004', 'Hi 

mark sheet for {student_name}, {admission_no}, {class}, {section}, {exam_name}, {marks}, {percentage}, {grade}

Thanks', 'test', 'test c', 'test r', 100, 50, 500, 800, 1, 100, NULL, Sun Nov 30 2025 14:49:08 GMT+0530 (India Standard Time), Sun Nov 30 2025 14:49:08 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `marks_grades` VALUES
(1, 'general_purpose', 'A', '10.00', '80.00', '99.99', NULL, Sun Nov 30 2025 11:37:28 GMT+0530 (India Standard Time), Sun Nov 30 2025 11:37:28 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `modules` VALUES
(1, 'dashboard', 'Dashboard', 'Main dashboard overview', '📊', '/dashboard', NULL, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(2, 'front-office', 'Front Office', 'Reception and front office activities', '🏢', '/front-office', NULL, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(3, 'students', 'Student Information', 'Student search, profile, admission, history', '👥', '/students', NULL, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(4, 'fees', 'Fees Collection', 'Fees collection, fees master, dues, reports', '💰', '/fees', NULL, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(5, 'income', 'Income', 'Income management (other than fees)', '📈', '/income', NULL, 5, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(6, 'expenses', 'Expenses', 'School expense management', '📉', '/expenses', NULL, 6, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(7, 'attendance', 'Attendance', 'Student attendance and reports', '✅', '/attendance', NULL, 7, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(8, 'examinations', 'Examinations', 'Exam creation, scheduling, marks entry, grading', '📋', '/examinations', NULL, 8, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(9, 'online-examinations', 'Online Examinations', 'Online exam management', '💻', '/online-examinations', NULL, 9, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(10, 'lesson-plan', 'Lesson Plan', 'Subject status and lesson plan management', '📚', '/lesson-plan', NULL, 10, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(11, 'academics', 'Academics', 'Classes, sections, subjects, teacher assignment, timetable, student promotion', '🎓', '/academics', NULL, 11, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(12, 'hr', 'Human Resource', 'Staff information, attendance, payroll, leaves', '👔', '/hr', NULL, 12, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(13, 'communicate', 'Communicate', 'Messaging system for students, parents, and teachers', '📧', '/communicate', NULL, 13, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(14, 'download-center', 'Download Center', 'Document management (assignments, study material, syllabus)', '📥', '/download-center', NULL, 14, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Fri Dec 05 2025 19:24:49 GMT+0530 (India Standard Time)),
(15, 'homework', 'Homework', 'Homework assignment and evaluation', '📝', '/homework', NULL, 15, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(16, 'library', 'Library', 'Library book management', '📖', '/library', NULL, 16, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(17, 'inventory', 'Inventory', 'School assets and stock management', '📦', '/inventory', NULL, 17, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(18, 'transport', 'Transport', 'Transportation routes and fares', '🚌', '/transport', NULL, 18, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(19, 'hostel', 'Hostel', 'Hostel rooms and fare management', '🏠', '/hostel', NULL, 19, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(20, 'certificate', 'Certificate', 'Student certificate and ID card design/generation', '📜', '/certificate', NULL, 20, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(21, 'front-cms', 'Front CMS', 'Public website management (pages, menus, events, gallery, news)', '🌐', '/front-cms', NULL, 21, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(22, 'alumni', 'Alumni', 'Alumni records and events', '🎓', '/alumni', NULL, 22, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(23, 'reports', 'Reports', 'Various reports from different modules', '📊', '/reports', NULL, 23, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(24, 'settings', 'System Settings', 'School configuration, sessions, admin password, SMS, payment gateways, backup/restore, languages', '⚙️', '/settings', NULL, 24, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(25, 'calendar', 'Calendar & ToDo List', 'Daily/monthly activities and task management', '📅', '/calendar', NULL, 25, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(26, 'chat', 'Chat', 'Two-way messaging for staff and students', '💬', '/chat', NULL, 26, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(27, 'users', 'User Management', 'Manage system users and roles', '👤', '/users', NULL, 27, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(28, 'roles', 'Roles & Permissions', 'Manage roles and permissions', '🔐', '/roles', NULL, 28, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time));

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
(1, 'Annual Science Fair 2024 - A Grand Success', 'annual-science-fair-2024', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking.', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking. The event featured over 50 projects covering various scientific disciplines including physics, chemistry, biology, and environmental science.', 'academic', NULL, 'School Admin', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 1, 1, 0, Sun Dec 07 2025 01:46:56 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:52:32 GMT+0530 (India Standard Time)),
(2, 'Basketball Team Wins Regional Championship', 'basketball-team-wins-regional-championship', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution.', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution. The team displayed exceptional teamwork and determination throughout the tournament.', 'sports', '/uploads/front-cms/news-events/news-events-1765052573204-872841768.jpg', 'Sports Department', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 0, 1, 0, Sun Dec 07 2025 01:46:56 GMT+0530 (India Standard Time), Sun Dec 07 2025 01:52:53 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notice_board` VALUES
(1, 'Tomorrow is holiday', 'Hi this testing', Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), Wed Dec 03 2025 00:00:00 GMT+0530 (India Standard Time), 'students', 2, Sun Nov 30 2025 20:04:25 GMT+0530 (India Standard Time), Sun Nov 30 2025 20:04:25 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notification_settings` VALUES
(1, 'student_admission', 'Student Admission', 'Send notification when a new student is admitted', 0, 1, 0, 0, 1, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(2, 'exam_result', 'Exam Result', 'Send notification when exam results are published', 1, 0, 0, 1, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(3, 'fees_submission', 'Fees Submission', 'Send notification when fees are paid', 0, 1, 0, 0, 1, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(4, 'absent_student', 'Absent Student', 'Send notification when student is marked absent', 0, 1, 0, 0, 1, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(5, 'login_credential', 'Login Credential', 'Send login credentials to users', 1, 1, 1, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(6, 'homework_created', 'Homework Created', 'Send notification when homework is assigned', 1, 1, 0, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(7, 'fees_due_reminder', 'Fees Due Reminder', 'Send reminder for due fees', 0, 1, 0, 0, 1, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(8, 'live_classes', 'Live Classes', 'Send notification for live classes', 1, 1, 0, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(9, 'live_meetings', 'Live Meetings', 'Send notification for live meetings', 0, 0, 1, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(10, 'gmeet_live_meeting', 'Gmeet Live Meeting', 'Send notification for Google Meet meetings', 0, 0, 1, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(11, 'gmeet_live_classes', 'Gmeet Live Classes', 'Send notification for Google Meet classes', 1, 1, 0, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time)),
(12, 'forgot_password', 'Forgot Password', 'Send password reset link', 1, 1, 1, 0, 0, 0, Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time), Thu Dec 04 2025 10:24:51 GMT+0530 (India Standard Time));

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
  `is_result_published` tinyint(1) DEFAULT 0,
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
  KEY `idx_result_published` (`is_result_published`),
  CONSTRAINT `online_exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exams_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exams_ibfk_3` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_exams_ibfk_4` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_exams_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `online_exams` VALUES
(4, 'Test Exam', 7, 1, 4, NULL, Mon Dec 08 2025 00:00:00 GMT+0530 (India Standard Time), '11:55:00', '19:55:00', 60, '1.00', '9.99', 'This is just dummy instruction ', 1, 0, 1, 2, Mon Dec 08 2025 11:56:05 GMT+0530 (India Standard Time), Mon Dec 08 2025 14:12:56 GMT+0530 (India Standard Time)),
(6, 'Exam 2', 7, 1, 4, NULL, Mon Dec 08 2025 00:00:00 GMT+0530 (India Standard Time), '15:25:00', '22:26:00', 60, '2.00', '10.00', 'THis is just simple instructions', 1, 1, 1, 2, Mon Dec 08 2025 15:26:25 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:38:31 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `online_exam_answers` VALUES
(1, 1, 1, 'B', 0, '0.00', Mon Dec 08 2025 14:19:17 GMT+0530 (India Standard Time), Mon Dec 08 2025 14:19:23 GMT+0530 (India Standard Time)),
(4, 2, 3, 'A', 1, '1.00', Mon Dec 08 2025 15:28:05 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:28:05 GMT+0530 (India Standard Time)),
(5, 2, 1, 'C', 1, '1.00', Mon Dec 08 2025 15:28:18 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:28:18 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `online_exam_attempts` VALUES
(1, 4, 12, Mon Dec 08 2025 14:19:06 GMT+0530 (India Standard Time), Mon Dec 08 2025 14:19:27 GMT+0530 (India Standard Time), 0, '1.00', '0.00', '0.00', 'submitted', Mon Dec 08 2025 14:19:06 GMT+0530 (India Standard Time), Mon Dec 08 2025 14:19:27 GMT+0530 (India Standard Time)),
(2, 6, 12, Mon Dec 08 2025 15:28:02 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:28:30 GMT+0530 (India Standard Time), 0, '2.00', '2.00', '100.00', 'submitted', Mon Dec 08 2025 15:28:02 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:28:30 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `online_exam_questions` VALUES
(7, 4, 1, '1.00', 1, Mon Dec 08 2025 14:12:56 GMT+0530 (India Standard Time)),
(8, 6, 3, '1.00', 1, Mon Dec 08 2025 15:27:43 GMT+0530 (India Standard Time)),
(9, 6, 1, '1.00', 1, Mon Dec 08 2025 15:27:43 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `online_exam_students` VALUES
(22, 4, 12, Mon Dec 08 2025 14:12:49 GMT+0530 (India Standard Time)),
(23, 4, 13, Mon Dec 08 2025 14:12:49 GMT+0530 (India Standard Time)),
(24, 4, 14, Mon Dec 08 2025 14:12:49 GMT+0530 (India Standard Time)),
(25, 6, 12, Mon Dec 08 2025 15:27:34 GMT+0530 (India Standard Time)),
(26, 6, 13, Mon Dec 08 2025 15:27:34 GMT+0530 (India Standard Time)),
(27, 6, 14, Mon Dec 08 2025 15:27:34 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` VALUES
(1, 'view', 'View', 'View/Read access to module data', Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(2, 'add', 'Add', 'Create/Add new records', Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(3, 'edit', 'Edit', 'Update/Modify existing records', Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(4, 'delete', 'Delete', 'Remove/Delete records', Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `question_bank` VALUES
(1, 7, '1. Who is known as Father of Computer', 'Jonh', 'Charles Chaplin', 'Charles Babbage', 'Mr Bean', NULL, 'C', '1.00', Sun Nov 30 2025 15:24:39 GMT+0530 (India Standard Time), Sun Nov 30 2025 15:24:39 GMT+0530 (India Standard Time)),
(2, 8, 'Which of theme is called as brain of computer', 'RAM', 'CPU', 'Keyboard', 'Monitor', NULL, 'B', '1.00', Sun Nov 30 2025 15:25:30 GMT+0530 (India Standard Time), Sun Nov 30 2025 15:25:30 GMT+0530 (India Standard Time)),
(3, 7, 'Keyboard is ........................ device', 'Input', 'output', 'processing', 'None of these', NULL, 'A', '1.00', Mon Dec 08 2025 15:14:00 GMT+0530 (India Standard Time), Mon Dec 08 2025 15:14:00 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` VALUES
(1, 'superadmin', 'Super Administrator with full access', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(2, 'admin', 'Administrator', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(3, 'teacher', 'Teacher', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(4, 'student', 'Student', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(5, 'parent', 'Parent/Guardian', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(6, 'accountant', 'Accountant', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(7, 'librarian', 'Librarian', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time)),
(8, 'receptionist', 'Receptionist', Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` VALUES
(1, 1, 1, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(2, 1, 2, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(3, 1, 3, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(4, 1, 4, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(5, 1, 5, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(6, 1, 6, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(7, 1, 7, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(8, 1, 8, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(9, 1, 9, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(10, 1, 10, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(11, 1, 11, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(12, 1, 12, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(13, 1, 13, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(14, 1, 14, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(15, 1, 15, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(16, 1, 16, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(17, 1, 17, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(18, 1, 18, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(19, 1, 19, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(20, 1, 20, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(21, 1, 21, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(22, 1, 22, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(23, 1, 23, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(24, 1, 24, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(25, 1, 25, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(26, 1, 26, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(27, 1, 27, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(28, 1, 28, 2, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(29, 1, 1, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(30, 1, 2, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(31, 1, 3, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(32, 1, 4, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(33, 1, 5, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(34, 1, 6, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(35, 1, 7, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(36, 1, 8, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(37, 1, 9, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(38, 1, 10, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(39, 1, 11, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(40, 1, 12, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(41, 1, 13, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(42, 1, 14, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(43, 1, 15, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(44, 1, 16, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(45, 1, 17, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(46, 1, 18, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(47, 1, 19, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(48, 1, 20, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(49, 1, 21, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(50, 1, 22, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(51, 1, 23, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(52, 1, 24, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(53, 1, 25, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(54, 1, 26, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(55, 1, 27, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(56, 1, 28, 4, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(57, 1, 1, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(58, 1, 2, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(59, 1, 3, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(60, 1, 4, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(61, 1, 5, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(62, 1, 6, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(63, 1, 7, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(64, 1, 8, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(65, 1, 9, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(66, 1, 10, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(67, 1, 11, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(68, 1, 12, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(69, 1, 13, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(70, 1, 14, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(71, 1, 15, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(72, 1, 16, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(73, 1, 17, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(74, 1, 18, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(75, 1, 19, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(76, 1, 20, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(77, 1, 21, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(78, 1, 22, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(79, 1, 23, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(80, 1, 24, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(81, 1, 25, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(82, 1, 26, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(83, 1, 27, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(84, 1, 28, 3, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(85, 1, 1, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(86, 1, 2, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(87, 1, 3, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(88, 1, 4, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(89, 1, 5, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(90, 1, 6, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(91, 1, 7, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(92, 1, 8, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(93, 1, 9, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(94, 1, 10, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(95, 1, 11, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(96, 1, 12, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(97, 1, 13, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(98, 1, 14, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(99, 1, 15, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(100, 1, 16, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(101, 1, 17, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(102, 1, 18, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(103, 1, 19, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(104, 1, 20, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(105, 1, 21, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(106, 1, 22, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(107, 1, 23, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(108, 1, 24, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(109, 1, 25, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(110, 1, 26, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(111, 1, 27, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(112, 1, 28, 1, 1, Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:06 GMT+0530 (India Standard Time)),
(128, 6, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(129, 2, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(130, 7, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(131, 5, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(132, 8, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(133, 4, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(134, 3, 1, 1, 1, Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time), Tue Dec 02 2025 18:28:07 GMT+0530 (India Standard Time)),
(142, 2, 1, 2, 1, Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time), Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time)),
(147, 2, 1, 3, 1, Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time), Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time)),
(148, 2, 1, 4, 1, Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time), Tue Dec 02 2025 23:38:14 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `room_types`;
CREATE TABLE `room_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `room_types` VALUES
(1, 'AC Room', NULL, Mon Dec 01 2025 19:17:56 GMT+0530 (India Standard Time), Mon Dec 01 2025 19:17:56 GMT+0530 (India Standard Time)),
(2, 'Non AC Room', NULL, Mon Dec 01 2025 19:18:05 GMT+0530 (India Standard Time), Mon Dec 01 2025 19:18:05 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `routes` VALUES
(1, 'Angarghat', '500.00', NULL, Sun Nov 30 2025 22:07:25 GMT+0530 (India Standard Time), Sun Nov 30 2025 22:07:25 GMT+0530 (India Standard Time));

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
(1, 'A', Sat Nov 29 2025 23:25:48 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:25:48 GMT+0530 (India Standard Time)),
(2, 'B', Sat Nov 29 2025 23:25:53 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:25:53 GMT+0530 (India Standard Time)),
(3, 'C', Sat Nov 29 2025 23:25:57 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:25:57 GMT+0530 (India Standard Time)),
(4, 'D', Sat Nov 29 2025 23:26:01 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:26:01 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sessions` VALUES
(1, '2024-25', Mon Apr 01 2024 00:00:00 GMT+0530 (India Standard Time), Mon Mar 31 2025 00:00:00 GMT+0530 (India Standard Time), 1, Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time), Sat Nov 29 2025 21:52:59 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `staff` VALUES
(13, 'Staff01', 34, 3, 3, 2, 'Suraj', 'Kumar', 'Staff01Father', 'Staff01Mother', 'male', 'single', Fri Jan 02 1998 00:00:00 GMT+0530 (India Standard Time), Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), '3214567890', '1234567890', 'staff01@schoolwizard.com', NULL, 'Chaita', 'Chaita North Samastipur', 'B.Ed & D.El.Ed', '5 year of work experience in teaching', 'This teacher is good in the mathematics teaching technique.', NULL, '11999.97', 'permanent', 'morning', 'Chaita', 20, 'SBI', '3420921212', 'State Bank of India', 'SBIN0018976', 'Chaita', NULL, NULL, NULL, NULL, 1, NULL, NULL, Tue Dec 16 2025 16:15:46 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:15:46 GMT+0530 (India Standard Time)),
(14, 'staff02', 35, 3, 2, 2, 'Vijay Kumar', 'Amit', 'Staff02Father', 'Staff02Mother', 'male', 'married', Mon Oct 12 1998 00:00:00 GMT+0530 (India Standard Time), Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), '3214215647', '4561237418', 'staff02@schoolwizard.com', NULL, 'Chaita North', 'Chaita North, Samstipur', 'B.Ed from Rampur Jalalpur', '15 year of teaching experience', 'Expert in Science and mathematic teaching.', NULL, '44999.99', 'permanent', 'morning', 'Chaita', 20, 'PNB', '32145612341', 'panjab nataional bank', 'PNB00189098', 'dalsingasarai', NULL, NULL, NULL, NULL, 1, NULL, NULL, Tue Dec 16 2025 16:19:00 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:19:00 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `staff_attendance` VALUES
(3, 13, Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), 'late', '16:23:00', '16:23:00', 'Late By 30 min', Tue Dec 16 2025 16:24:37 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:24:37 GMT+0530 (India Standard Time)),
(4, 14, Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), 'present', '16:01:00', '16:01:00', NULL, Tue Dec 16 2025 16:24:37 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:24:37 GMT+0530 (India Standard Time)),
(5, 13, Mon Dec 15 2025 00:00:00 GMT+0530 (India Standard Time), 'present', '16:24:00', '16:24:00', NULL, Tue Dec 16 2025 16:25:02 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:02 GMT+0530 (India Standard Time)),
(6, 14, Mon Dec 15 2025 00:00:00 GMT+0530 (India Standard Time), 'present', '16:24:00', '16:24:00', NULL, Tue Dec 16 2025 16:25:02 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:02 GMT+0530 (India Standard Time)),
(7, 13, Sun Dec 14 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, NULL, NULL, Tue Dec 16 2025 16:25:13 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:13 GMT+0530 (India Standard Time)),
(8, 14, Sun Dec 14 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, NULL, NULL, Tue Dec 16 2025 16:25:13 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:13 GMT+0530 (India Standard Time)),
(9, 13, Wed Dec 10 2025 00:00:00 GMT+0530 (India Standard Time), 'holiday', NULL, NULL, 'Holiday', Tue Dec 16 2025 16:25:33 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:33 GMT+0530 (India Standard Time)),
(10, 14, Wed Dec 10 2025 00:00:00 GMT+0530 (India Standard Time), 'holiday', NULL, NULL, 'Holiday', Tue Dec 16 2025 16:25:33 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:25:33 GMT+0530 (India Standard Time));

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
  `photo` longtext DEFAULT NULL,
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
  `father_photo` longtext DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `mother_occupation` varchar(255) DEFAULT NULL,
  `mother_phone` varchar(20) DEFAULT NULL,
  `mother_email` varchar(255) DEFAULT NULL,
  `mother_photo` longtext DEFAULT NULL,
  `guardian_name` varchar(255) DEFAULT NULL,
  `guardian_relation` varchar(100) DEFAULT NULL,
  `guardian_occupation` varchar(255) DEFAULT NULL,
  `guardian_phone` varchar(20) DEFAULT NULL,
  `guardian_email` varchar(255) DEFAULT NULL,
  `guardian_photo` longtext DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `students` VALUES
(5, 'STU-2024-005', '14', 21, 1, 1, 1, 'Ram', 'Kumar', 'male', Tue May 10 2005 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '7577796574', 'ram@gmail.com', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'data:image/png;base64,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', NULL, NULL, NULL, NULL, NULL, NULL, 'Ram Father', NULL, '4501488577', 'father@gmail.com', NULL, 'Ram Mother', NULL, '', '', NULL, '', NULL, NULL, '', '', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Sun Dec 07 2025 13:57:33 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:33:04 GMT+0530 (India Standard Time)),
(6, 'STU-2024-004', '15', 23, 1, 1, 1, 'Shyam', 'Kumar', 'male', Sat Jan 01 2000 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '8789876567', 'shyam@gmail.com', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'data:image/png;base64,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', NULL, NULL, NULL, NULL, NULL, NULL, 'Shaym Father', NULL, '', 'shayamfather@gmail.com', NULL, '', NULL, '', '', NULL, '', NULL, NULL, '', '', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Sun Dec 07 2025 13:59:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:32:40 GMT+0530 (India Standard Time)),
(12, 'STU-2024-001', 'R001', 25, 4, 1, 1, 'Rahul', 'Sharma', 'male', Sat May 15 2010 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '9876543210', 'rahul.sharma@example.com', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'data:image/png;base64,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', NULL, NULL, NULL, NULL, NULL, NULL, 'Rajesh Sharma', NULL, '9876543211', 'rajesh.sharma@example.com', NULL, 'Priya Sharma', NULL, '9876543212', 'priya.sharma@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Sun Dec 07 2025 15:27:51 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:27:51 GMT+0530 (India Standard Time)),
(13, 'STU-2024-002', 'R002', 28, 4, 1, 1, 'Priya', 'Patel', 'female', Mon Feb 01 2010 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '9876543213', 'priya.patel@example.com', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAC4jAAAuIwF4pT92AAAHY2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDggNzkuMTY0MDM2LCAyMDE5LzA4LzEzLTAxOjA2OjU3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDowMjFkMzMwYy0wNTM4LTdmNDAtODRhYS01MzIwYjU0YzdkZjQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MDk0M2U0YzQtMDJkMi0xZTQwLTkzZmYtYWQ0YmEyOGE0ZmRjIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9IkQxRUU2MTM2RjZBQTg3RjkxRUNGMUNBRjQ4MDkyOTFFIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IiIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDItMjhUMTI6MDA6MTMrMDU6MzAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTAyLTI4VDEyOjEyOjQ1KzA1OjMwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTAyLTI4VDEyOjEyOjQ1KzA1OjMwIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MzZlZDdhNTMtYzc3NS03ZjQ0LTk3ZjgtOGUzZDc4ZDIyYzRlIiBzdEV2dDp3aGVuPSIyMDIwLTAyLTI4VDEyOjEyOjQ1KzA1OjMwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgMjEuMCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBpbWFnZS9qcGVnIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iZGVyaXZlZCIgc3RFdnQ6cGFyYW1ldGVycz0iY29udmVydGVkIGZyb20gaW1hZ2UvanBlZyB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA5NDNlNGM0LTAyZDItMWU0MC05M2ZmLWFkNGJhMjhhNGZkYyIgc3RFdnQ6d2hlbj0iMjAyMC0wMi0yOFQxMjoxMjo0NSswNTozMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjAgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozNmVkN2E1My1jNzc1LTdmNDQtOTdmOC04ZTNkNzhkMjJjNGUiIHN0UmVmOmRvY3VtZW50SUQ9IkQxRUU2MTM2RjZBQTg3RjkxRUNGMUNBRjQ4MDkyOTFFIiBzdFJlZjpvcmlnaW5hbERvY3VtZW50SUQ9IkQxRUU2MTM2RjZBQTg3RjkxRUNGMUNBRjQ4MDkyOTFFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+OO6xowABYSJJREFUeJzs/XeUXdd92It/djnn3DINwKAQBMAGik3spFhEUpRISqI61UXLir1sJ5Lt5+QlSmwnz3HsxPGy4xfnl2XHL7bjRLItirKK1SmRFClRFItIsQMkCJBEr4Mpt56y9/79ccrcGQAESJQ7gzkfrLMGc++5d/Y99+y9v/0rnHOUlJSUlJSULCxkvwdQUlJSUlJScuIpBYCSkpKSkpIFSCkAlJSUlJSULEBKAaCkpKSkpGQBUgoAJSUlJSUlC5BSACgpKSkpKVmAlAJASUlJSUnJAqQUAEpKSkpKShYgpQBQUlJSUlKyACkFgJKSkpKSkgVIKQCUlJSUlJQsQEoBoKSkpKSkZAFSCgAlJSUlJSULkFIAKCkpKSkpWYCUAkBJSUlJSckCpBQASkpKSkpKFiClAFBSUlJSUrIAKQWAkpKSkpKSBUgpAJSUlJSUlCxASgGgpKSkpKRkAVIKACUlJSUlJQuQUgAoKSkpKSlZgOh+D6CkpOR1Izqdjux2u97k5GSwf//+yv79+6uTk5NBq9Xy4zjW3W5XWWtlHMcqiqLiiONYGWOE53lWKWW01tb3/SQIAuP7fuJ5npVSWs/zjO/7pl6vR8PDw+GiRYu6ixYt6g4ODoaVSiWp1WoOcP2+ECUlJa+dUgAoKZkjOOdkq9Wq7NmzZ9G2bdtWjY2Nrd6yZcvKsbGxFdu2bVuxffv2lXv27Fk+Pj6+eHJycrDT6dTCMPTojyXPAbZSqUS1Wq09PDw8tXjx4vGlS5fuXLly5Y5TTz119+LFi3eddtppO5YsWbJ11apVO5YtW7a/Xq9HQgjbh/GWlJTMQjhXCu8lJScCY4wA9NjY2MDGjRtXbtmy5Q1PPfXUeTt27HjDhg0bznjppZdW79u3b6m1tkq2qVerVZIkIY5j0d/RvzpCCHrXEq2101rT7Xbzh6yUsj06OrrnzDPP3PqGN7zh5ZUrV264+OKLn1+zZs2GtWvX7liyZElTCGGklOWiVFJyAigFgJKS44Oy1g48/vjjqzds2PDGhx9++OInnnjiws2bN6+dmJhY3m6369ZaLaUU1k4rxEKIYjOdPTeFEEgpi+ettQecc6LJxyOEcM45YYw54JxDfSYpJdZaJ6VMarVaY2RkZPeaNWs2Xnrppc9ec801T55zzjnPXX755VuFEE2gtBqUlBxjSgGgpOTokWEYDjz//POn/+QnP7nkgQceuOLxxx+/dPPmzWeHYbhYSukJIZi9OUopD7rR96KUAijOmw/zVUqJlKlXIkmSQ56XCwa9AlDP4845FwdBMLZmzZoXL7/88ievv/76x6699tonzz333FeCIGhRCgUlJUdFKQCUlLx2VKPRWLJnz54LvvSlL13+2GOPXfbggw9esHv37tOUUgNBEMgkSUQURcULpJQopRBCOGutyLX3fP4ppYrN3hhzWO1eKYWUkjiOj+8nPQy+72OMOUC4ESL1WDjnCstF7+frPT/7LA7AWnuAFSEIApRSNgxDa4xpLl++fPO111777BVXXPHExz72sceWLVu2bnBwcD9woPmhpKTkkJQCQEnJYXDOCaCyY8eO0+67774rvva1r137wx/+8KqxsbGzpZQD1tpD+uczM/ch3/vVnldKzdgoZ/vZ5wOzP0Mvh7s2SqlXFYSEENY511yyZMmLb3nLWx657bbbHnzrW9/62MqVKzcLIcJj8gFKSk5iSgGgpOTgSGvtoo0bN77x29/+9tVf+tKXrn7qqacu7nQ6K4EAQGtdbGC92r0xpti0cjN3burufVwpRZIkxfO52Xy2f7/3PXLNOj/vUJvrieJg45q9affGLvQ+75xDaz3DTZC7D6y1WGsLoSe7Xq7nOeGcy69h/sfCarW6+eKLL370ox/96APvfve7H167du0mKWX7hFyMkpJ5RikAlJTMZNHGjRsv/sIXvnD9nXfeed26desuApYCarbPOt+cZvvy8438YNptvhHmm+DRasFzlXzTfzUBpfezzw5u7EUpNePx2e6F3uve8z3EwPbzzz//0Y997GM/vP322x9cu3bti0ApDJSUZJQCQEkJeK1W6/Svf/3rb/6zP/uzmx577LFrjTGrrbVevwdWcvRIKSOl1CtXXHHFT37913/9vve///0P1uv1LaRCQknJgqUUAEoWMktefPHFK/7oj/7o5jvuuOOt7Xb7XN/3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', NULL, NULL, NULL, NULL, NULL, NULL, 'Amit Patel', NULL, '9876543214', 'amit.patel@example.com', NULL, 'Sunita Patel', NULL, '9876543215', 'sunita.patel@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Sun Dec 07 2025 15:30:06 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:30:06 GMT+0530 (India Standard Time)),
(14, 'STU-2024-003', 'R003', 31, 4, 1, 1, 'Arjun', 'Kumar', 'male', Tue Jan 04 2011 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, '9876543216', 'arjun.kumar@example.com', Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Vikash Kumar', NULL, '9876543217', 'vikash.kumar@example.com', NULL, 'Meera Kumar', NULL, '9876543218', 'meera.kumar@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 1, NULL, NULL, Sun Dec 07 2025 15:31:53 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:31:53 GMT+0530 (India Standard Time));

DROP TABLE IF EXISTS `students_backup`;
CREATE TABLE `students_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `admission_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `roll_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_of_birth` date NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `religion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caste` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admission_date` date NOT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `blood_group` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `house_id` int(11) DEFAULT NULL,
  `height` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `as_on_date` date DEFAULT NULL,
  `sibling_id` int(11) DEFAULT NULL,
  `father_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `father_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mother_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_relation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_occupation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardian_photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permanent_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transport_route_id` int(11) DEFAULT NULL,
  `hostel_id` int(11) DEFAULT NULL,
  `hostel_room_id` int(11) DEFAULT NULL,
  `is_rte` tinyint(1) DEFAULT 0,
  `rte_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `disable_reason_id` int(11) DEFAULT NULL,
  `disable_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_attendance` VALUES
(1, 12, 4, 1, 1, Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 2, Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time)),
(2, 13, 4, 1, 1, Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'late', NULL, 2, Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time)),
(3, 14, 4, 1, 1, Sun Dec 07 2025 00:00:00 GMT+0530 (India Standard Time), 'present', NULL, 2, Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time), Sun Dec 07 2025 15:52:13 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_categories` VALUES
(1, 'Student Category 1', Sun Nov 30 2025 13:52:21 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:52:21 GMT+0530 (India Standard Time)),
(2, 'Student Category 2', Sun Nov 30 2025 13:52:35 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:52:35 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_houses` VALUES
(1, 'House 1', Sun Nov 30 2025 13:52:47 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:52:47 GMT+0530 (India Standard Time)),
(2, 'House 2', Sun Nov 30 2025 13:52:53 GMT+0530 (India Standard Time), Sun Nov 30 2025 13:52:53 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subjects` VALUES
(1, 'Hindi', 'HI01', 'theory', Sat Nov 29 2025 23:27:57 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:27:57 GMT+0530 (India Standard Time)),
(2, 'English', 'EN01', 'theory', Sat Nov 29 2025 23:28:08 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:28:08 GMT+0530 (India Standard Time)),
(3, 'Math', 'MA', 'theory', Sat Nov 29 2025 23:28:17 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:28:17 GMT+0530 (India Standard Time)),
(4, 'Science', 'SC01', 'theory', Sat Nov 29 2025 23:28:46 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:28:46 GMT+0530 (India Standard Time)),
(5, 'Science', 'SC02', 'practical', Sat Nov 29 2025 23:29:00 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:29:00 GMT+0530 (India Standard Time)),
(6, 'Social Science', 'SSC', 'theory', Sat Nov 29 2025 23:29:14 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:29:14 GMT+0530 (India Standard Time)),
(7, 'Computer', 'COM01', 'theory', Sat Nov 29 2025 23:29:27 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:29:27 GMT+0530 (India Standard Time)),
(8, 'Computer', 'COM02', 'practical', Sat Nov 29 2025 23:29:38 GMT+0530 (India Standard Time), Sat Nov 29 2025 23:29:38 GMT+0530 (India Standard Time));

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
(1, 'group 1', 5, 1, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time), Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time));

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
(1, 1, 7, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time)),
(2, 1, 2, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time)),
(3, 1, 1, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time)),
(4, 1, 3, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time)),
(5, 1, 4, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time)),
(6, 1, 6, Sat Dec 06 2025 02:07:34 GMT+0530 (India Standard Time));

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
(1, 5, 1, 7, NULL, 'Hardware', Tue Dec 02 2025 00:00:00 GMT+0530 (India Standard Time), Fri Dec 05 2025 00:00:00 GMT+0530 (India Standard Time), 'not_started', 0, NULL, Tue Dec 02 2025 10:17:08 GMT+0530 (India Standard Time), Tue Dec 02 2025 10:17:08 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `todo_tasks` VALUES
(1, 2, 'Call To Warish', Mon Dec 01 2025 00:00:00 GMT+0530 (India Standard Time), 1, Mon Dec 01 2025 22:01:21 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:01:18 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:01:21 GMT+0530 (India Standard Time)),
(2, 2, 'Call To Ravi', Tue Dec 16 2025 00:00:00 GMT+0530 (India Standard Time), 1, Mon Dec 15 2025 19:48:42 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:01:32 GMT+0530 (India Standard Time), Mon Dec 15 2025 19:48:45 GMT+0530 (India Standard Time)),
(3, 2, 'Bring Pen', Mon Dec 01 2025 00:00:00 GMT+0530 (India Standard Time), 0, NULL, Mon Dec 01 2025 22:01:58 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:01:58 GMT+0530 (India Standard Time)),
(4, 2, 'Bring the pencil from shop', Sun Nov 30 2025 00:00:00 GMT+0530 (India Standard Time), 1, Mon Dec 01 2025 22:02:19 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:02:15 GMT+0530 (India Standard Time), Mon Dec 01 2025 22:02:28 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` VALUES
(2, 'admin@schoolwizard.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'System Administrator', 1, 1, NULL, Sat Nov 29 2025 22:04:09 GMT+0530 (India Standard Time), Sat Nov 29 2025 22:07:22 GMT+0530 (India Standard Time)),
(21, 'ram@gmail.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Ram Kumar', 4, 1, NULL, Sun Dec 07 2025 13:57:32 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:28:32 GMT+0530 (India Standard Time)),
(22, 'father@gmail.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Ram Father', 5, 1, NULL, Sun Dec 07 2025 13:57:33 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:28:47 GMT+0530 (India Standard Time)),
(23, 'shyam@gmail.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Shyam Kumar', 4, 1, NULL, Sun Dec 07 2025 13:59:39 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(24, 'shayamfather@gmail.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Shaym Father', 5, 1, NULL, Sun Dec 07 2025 13:59:40 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(25, 'rahul.sharma@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Rahul Sharma', 4, 1, NULL, Sun Dec 07 2025 15:27:51 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(26, 'rajesh.sharma@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Rajesh Sharma', 5, 1, NULL, Sun Dec 07 2025 15:27:51 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(27, 'priya.sharma@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Priya Sharma', 5, 1, NULL, Sun Dec 07 2025 15:27:52 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(28, 'priya.patel@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Priya Patel', 4, 1, NULL, Sun Dec 07 2025 15:30:06 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(29, 'amit.patel@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Amit Patel', 5, 1, NULL, Sun Dec 07 2025 15:30:07 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(30, 'sunita.patel@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Sunita Patel', 5, 1, NULL, Sun Dec 07 2025 15:30:07 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(31, 'arjun.kumar@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Arjun Kumar', 4, 1, NULL, Sun Dec 07 2025 15:31:53 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(32, 'vikash.kumar@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Vikash Kumar', 5, 1, NULL, Sun Dec 07 2025 15:31:54 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(33, 'meera.kumar@example.com', '$2a$10$TTAsNMZ9c8EfPdv8eY3n5uSzXrElfNSgVgLFOA32aQpOkhlMqDRJW', 'Meera Kumar', 5, 1, NULL, Sun Dec 07 2025 15:31:54 GMT+0530 (India Standard Time), Sun Dec 07 2025 17:31:04 GMT+0530 (India Standard Time)),
(34, 'staff01@schoolwizard.com', '$2a$10$ZDOLYt1XR4PlHezXI4FKyeRvi6j02r8y5C9lPsD/yc.JVxLs5uW9C', 'Suraj Kumar', 3, 1, NULL, Tue Dec 16 2025 16:15:45 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:15:45 GMT+0530 (India Standard Time)),
(35, 'staff02@schoolwizard.com', '$2a$10$bsLqUvESCyuniRLlwDIrMev62XH6HvvCrBpxZqBMD9ktx/ceV8cwe', 'Vijay Kumar Amit', 3, 1, NULL, Tue Dec 16 2025 16:18:59 GMT+0530 (India Standard Time), Tue Dec 16 2025 16:18:59 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicles` VALUES
(1, 'BR33A 5334', 'CAR MODEL', 2025, 'Jitendra Ji', 'DL01JHG090', '7808689033', NULL, Sun Nov 30 2025 22:12:18 GMT+0530 (India Standard Time), Sun Nov 30 2025 22:12:18 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicle_assignments` VALUES
(1, 1, 1, Sun Nov 30 2025 22:12:36 GMT+0530 (India Standard Time), Sun Nov 30 2025 22:12:36 GMT+0530 (India Standard Time));

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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `visitors` VALUES
(1, NULL, 'Banty', '78475478744', 'NO ID Card', 1, Sat Nov 29 2025 00:00:00 GMT+0530 (India Standard Time), '23:40:00', '23:44:00', NULL, NULL, Sat Nov 29 2025 23:41:18 GMT+0530 (India Standard Time));

SET FOREIGN_KEY_CHECKS=1;
