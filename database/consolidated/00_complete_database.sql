-- ============================================================================
-- SchoolWizard Database - Complete Database Schema
-- ============================================================================
-- This is a SINGLE consolidated file containing the entire database schema
-- Import this ONE file to set up the complete database
-- ============================================================================
-- Alternative: Use the 5 separate files (01-05) if you prefer modular setup
-- ============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS u524544702_schoolwizard;
USE u524544702_schoolwizard;

-- ============================================================================
-- BASE TABLES (from schema.sql)
-- ============================================================================

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Table (Academic Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_current (is_current)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    numeric_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sections Table
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Class Sections (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS class_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_section (class_id, section_id),
    INDEX idx_class (class_id),
    INDEX idx_section (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Roles
INSERT INTO roles (name, description) VALUES
('superadmin', 'Super Administrator with full access'),
('admin', 'Administrator'),
('teacher', 'Teacher'),
('student', 'Student'),
('parent', 'Parent/Guardian'),
('accountant', 'Accountant'),
('librarian', 'Librarian'),
('receptionist', 'Receptionist')
ON DUPLICATE KEY UPDATE name=name;

-- Insert Default Session
INSERT INTO sessions (name, start_date, end_date, is_current) VALUES
('2024-25', '2024-04-01', '2025-03-31', 1)
ON DUPLICATE KEY UPDATE name=name;

-- Create Default Admin User (password: admin123 - should be changed after first login)
INSERT INTO users (email, password, name, role_id, is_active, created_at) VALUES
('admin@schoolwizard.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System Administrator', 1, 1, NOW())
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  name = VALUES(name),
  role_id = VALUES(role_id),
  is_active = VALUES(is_active);

-- ============================================================================
-- MIGRATION FILES (System Settings, RBAC, Email, Backup)
-- ============================================================================

-- ============================================================================
-- Source: 011_email_settings_table.sql
-- ============================================================================

-- Email Settings Table
-- This table stores SMTP configuration for sending emails

USE u524544702_schoolwizard;

CREATE TABLE IF NOT EXISTS email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_secure TINYINT(1) DEFAULT 0 COMMENT '0 for TLS, 1 for SSL',
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    is_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default email settings (disabled by default)
INSERT INTO email_settings (smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password, from_email, from_name, is_enabled)
VALUES ('smtp.gmail.com', 587, 0, '', '', '', 'SchoolWizard', 0)
ON DUPLICATE KEY UPDATE smtp_host = smtp_host;




-- ============================================================================
-- Source: 027_rbac_permissions_tables.sql
-- ============================================================================

-- RBAC (Role-Based Access Control) System
-- This migration creates tables for managing module permissions per role

-- Modules table - defines all available modules in the system
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Module identifier (e.g., students, fees, attendance)',
    display_name VARCHAR(200) NOT NULL COMMENT 'Human-readable module name',
    description TEXT COMMENT 'Module description',
    icon VARCHAR(50) COMMENT 'Icon identifier for UI',
    route_path VARCHAR(200) COMMENT 'Frontend route path',
    parent_module_id INT NULL COMMENT 'For sub-modules, reference to parent module',
    display_order INT DEFAULT 0 COMMENT 'Order for displaying in sidebar',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether module is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_module_id) REFERENCES modules(id) ON DELETE SET NULL,
    INDEX idx_parent_module (parent_module_id),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table - defines all possible permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission identifier (e.g., view, add, edit, delete)',
    display_name VARCHAR(200) NOT NULL COMMENT 'Human-readable permission name',
    description TEXT COMMENT 'Permission description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role permissions table - links roles to modules and permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted BOOLEAN DEFAULT TRUE COMMENT 'Whether permission is granted (true) or denied (false)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_module_permission (role_id, module_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_module_id (module_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT INTO permissions (name, display_name, description) VALUES
('view', 'View', 'View/Read access to module data'),
('add', 'Add', 'Create/Add new records'),
('edit', 'Edit', 'Update/Modify existing records'),
('delete', 'Delete', 'Remove/Delete records')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Insert default modules (27 admin modules)
INSERT INTO modules (name, display_name, description, icon, route_path, display_order) VALUES
('dashboard', 'Dashboard', 'Main dashboard overview', 'ðŸ“Š', '/dashboard', 1),
('front-office', 'Front Office', 'Reception and front office activities', 'ðŸ¢', '/front-office', 2),
('students', 'Student Information', 'Student search, profile, admission, history', 'ðŸ‘¥', '/students', 3),
('fees', 'Fees Collection', 'Fees collection, fees master, dues, reports', 'ðŸ’°', '/fees', 4),
('income', 'Income', 'Income management (other than fees)', 'ðŸ“ˆ', '/income', 5),
('expenses', 'Expenses', 'School expense management', 'ðŸ“‰', '/expenses', 6),
('attendance', 'Attendance', 'Student attendance and reports', 'âœ…', '/attendance', 7),
('examinations', 'Examinations', 'Exam creation, scheduling, marks entry, grading', 'ðŸ“‹', '/examinations', 8),
('online-examinations', 'Online Examinations', 'Online exam management', 'ðŸ’»', '/online-examinations', 9),
('lesson-plan', 'Lesson Plan', 'Subject status and lesson plan management', 'ðŸ“š', '/lesson-plan', 10),
('academics', 'Academics', 'Classes, sections, subjects, teacher assignment, timetable, student promotion', 'ðŸŽ“', '/academics', 11),
('hr', 'Human Resource', 'Staff information, attendance, payroll, leaves', 'ðŸ‘”', '/hr', 12),
('communicate', 'Communicate', 'Messaging system for students, parents, and teachers', 'ðŸ“§', '/communicate', 13),
('download-center', 'Download Center', 'Document management (assignments, study material, syllabus)', 'ðŸ“¥', '/download-center', 14),
('homework', 'Homework', 'Homework assignment and evaluation', 'ðŸ“', '/homework', 15),
('library', 'Library', 'Library book management', 'ðŸ“–', '/library', 16),
('inventory', 'Inventory', 'School assets and stock management', 'ðŸ“¦', '/inventory', 17),
('transport', 'Transport', 'Transportation routes and fares', 'ðŸšŒ', '/transport', 18),
('hostel', 'Hostel', 'Hostel rooms and fare management', 'ðŸ ', '/hostel', 19),
('certificate', 'Certificate', 'Student certificate and ID card design/generation', 'ðŸ“œ', '/certificate', 20),
('front-cms', 'Front CMS', 'Public website management (pages, menus, events, gallery, news)', 'ðŸŒ', '/front-cms', 21),
('alumni', 'Alumni', 'Alumni records and events', 'ðŸŽ“', '/alumni', 22),
('reports', 'Reports', 'Various reports from different modules', 'ðŸ“Š', '/reports', 23),
('settings', 'System Settings', 'School configuration, sessions, admin password, SMS, payment gateways, backup/restore, languages', 'âš™ï¸', '/settings', 24),
('calendar', 'Calendar & ToDo List', 'Daily/monthly activities and task management', 'ðŸ“…', '/calendar', 25),
('chat', 'Chat', 'Two-way messaging for staff and students', 'ðŸ’¬', '/chat', 26),
('users', 'User Management', 'Manage system users and roles', 'ðŸ‘¤', '/users', 27),
('roles', 'Roles & Permissions', 'Manage roles and permissions', 'ðŸ”', '/roles', 28)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), description=VALUES(description);

-- Grant full permissions to superadmin role (role_id = 1) for all modules
INSERT INTO role_permissions (role_id, module_id, permission_id, granted)
SELECT 1, m.id, p.id, TRUE
FROM modules m
CROSS JOIN permissions p
WHERE m.is_active = TRUE
ON DUPLICATE KEY UPDATE granted=TRUE;

-- Grant view permission to all roles for dashboard
INSERT INTO role_permissions (role_id, module_id, permission_id, granted)
SELECT r.id, m.id, p.id, TRUE
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE m.name = 'dashboard' AND p.name = 'view'
ON DUPLICATE KEY UPDATE granted=TRUE;




-- ============================================================================
-- Source: 028_system_settings_tables.sql
-- ============================================================================

-- System Settings Tables
-- This migration creates tables for various system settings

USE u524544702_schoolwizard;

-- SMS Settings Table
CREATE TABLE IF NOT EXISTS sms_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sms_gateway VARCHAR(50) NOT NULL COMMENT 'Gateway name: twilio, msg91, clickatell, textlocal, sms_country, custom',
    sms_api_key VARCHAR(255),
    sms_api_secret VARCHAR(255),
    sms_sender_id VARCHAR(50),
    sms_username VARCHAR(255),
    sms_password VARCHAR(255),
    sms_url VARCHAR(500) COMMENT 'For custom gateway',
    additional_params TEXT COMMENT 'JSON for additional gateway-specific parameters',
    is_enabled TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gateway (sms_gateway),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Event identifier: student_admission, exam_result, fees_submission, absent_student, login_credential, homework_created, fees_due_reminder, live_classes, live_meetings, gmeet_live_meeting, gmeet_live_classes, forgot_password',
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    email_enabled_student TINYINT(1) DEFAULT 0,
    email_enabled_guardian TINYINT(1) DEFAULT 0,
    email_enabled_staff TINYINT(1) DEFAULT 0,
    sms_enabled_student TINYINT(1) DEFAULT 0,
    sms_enabled_guardian TINYINT(1) DEFAULT 0,
    sms_enabled_staff TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_name (event_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification events
INSERT INTO notification_settings (event_name, display_name, description, email_enabled_student, email_enabled_guardian, email_enabled_staff, sms_enabled_student, sms_enabled_guardian, sms_enabled_staff) VALUES
('student_admission', 'Student Admission', 'Send notification when a new student is admitted', 0, 1, 0, 0, 1, 0),
('exam_result', 'Exam Result', 'Send notification when exam results are published', 1, 0, 0, 1, 0, 0),
('fees_submission', 'Fees Submission', 'Send notification when fees are paid', 0, 1, 0, 0, 1, 0),
('absent_student', 'Absent Student', 'Send notification when student is marked absent', 0, 1, 0, 0, 1, 0),
('login_credential', 'Login Credential', 'Send login credentials to users', 1, 1, 1, 0, 0, 0),
('homework_created', 'Homework Created', 'Send notification when homework is assigned', 1, 1, 0, 0, 0, 0),
('fees_due_reminder', 'Fees Due Reminder', 'Send reminder for due fees', 0, 1, 0, 0, 1, 0),
('live_classes', 'Live Classes', 'Send notification for live classes', 1, 1, 0, 0, 0, 0),
('live_meetings', 'Live Meetings', 'Send notification for live meetings', 0, 0, 1, 0, 0, 0),
('gmeet_live_meeting', 'Gmeet Live Meeting', 'Send notification for Google Meet meetings', 0, 0, 1, 0, 0, 0),
('gmeet_live_classes', 'Gmeet Live Classes', 'Send notification for Google Meet classes', 1, 1, 0, 0, 0, 0),
('forgot_password', 'Forgot Password', 'Send password reset link', 1, 1, 1, 0, 0, 0)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), description=VALUES(description);

-- Payment Gateway Settings Table
CREATE TABLE IF NOT EXISTS payment_gateways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway_name VARCHAR(50) NOT NULL COMMENT 'Gateway name: paypal, stripe, payu, ccavenue, instamojo, paystack, razorpay',
    display_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    merchant_id VARCHAR(255),
    test_mode TINYINT(1) DEFAULT 1 COMMENT '1 for test mode, 0 for live mode',
    additional_params TEXT COMMENT 'JSON for additional gateway-specific parameters',
    is_enabled TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gateway_name (gateway_name),
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- General Settings Table (if not exists)
CREATE TABLE IF NOT EXISTS general_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text' COMMENT 'text, number, boolean, json',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default general settings
INSERT INTO general_settings (setting_key, setting_value, setting_type, description) VALUES
('school_name', 'SchoolWizard', 'text', 'School Name'),
('school_code', '', 'text', 'School Code/Affiliation Number'),
('address', '', 'text', 'School Address'),
('phone', '', 'text', 'School Phone'),
('email', '', 'text', 'School Email'),
('session_start_month', 'April', 'text', 'Academic Session Start Month'),
('attendance_type', 'day_wise', 'text', 'Attendance Type: day_wise or period_wise'),
('biometric_attendance', '0', 'boolean', 'Enable Biometric Attendance'),
('language', 'english', 'text', 'Default System Language'),
('date_format', 'Y-m-d', 'text', 'Date Format'),
('timezone', 'UTC', 'text', 'System Timezone'),
('currency', 'USD', 'text', 'Currency Code'),
('currency_symbol', '$', 'text', 'Currency Symbol'),
('currency_symbol_place', 'before', 'text', 'Currency Symbol Place: before or after'),
('admission_no_prefix', '', 'text', 'Admission Number Prefix'),
('admission_no_digit', '6', 'number', 'Admission Number Digits'),
('admission_start_from', '1', 'number', 'Admission Number Start From'),
('auto_staff_id', '1', 'boolean', 'Auto Generate Staff ID'),
('staff_id_prefix', '', 'text', 'Staff ID Prefix'),
('staff_no_digit', '6', 'number', 'Staff ID Digits'),
('staff_id_start_from', '1', 'number', 'Staff ID Start From'),
('duplicate_fees_invoice', '0', 'boolean', 'Allow Duplicate Fees Invoice'),
('fees_due_days', '30', 'number', 'Fees Due Days'),
('teacher_restricted_mode', '0', 'boolean', 'Teacher Restricted Mode'),
('online_admission', '0', 'boolean', 'Enable Online Admission'),
('print_logo', '', 'text', 'Print Logo Path'),
('admin_logo', '', 'text', 'Admin Logo Path'),
('admin_small_logo', '', 'text', 'Admin Small Logo Path'),
('app_logo', '', 'text', 'Mobile App Logo Path'),
('mobile_app_api_url', '', 'text', 'Mobile App API URL'),
('mobile_app_primary_color', '#2563eb', 'text', 'Mobile App Primary Color Code'),
('mobile_app_secondary_color', '#64748b', 'text', 'Mobile App Secondary Color Code'),
('android_app_registered', '0', 'boolean', 'Android App Registration Status')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Print Header Footer Settings Table
CREATE TABLE IF NOT EXISTS print_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_type ENUM('header', 'footer') NOT NULL,
    header_image VARCHAR(500) COMMENT 'Path to header image',
    footer_text TEXT COMMENT 'Footer text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Settings Table
CREATE TABLE IF NOT EXISTS front_cms_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    is_enabled TINYINT(1) DEFAULT 1,
    sidebar_enabled TINYINT(1) DEFAULT 1,
    rtl_mode TINYINT(1) DEFAULT 0,
    logo VARCHAR(500),
    favicon VARCHAR(500),
    footer_text TEXT,
    google_analytics TEXT,
    facebook_url VARCHAR(500),
    twitter_url VARCHAR(500),
    youtube_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    instagram_url VARCHAR(500),
    pinterest_url VARCHAR(500),
    whatsapp_url VARCHAR(500),
    current_theme VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Front CMS settings
INSERT INTO front_cms_settings (is_enabled, sidebar_enabled, rtl_mode, current_theme) VALUES
(1, 1, 0, 'default')
ON DUPLICATE KEY UPDATE is_enabled=is_enabled;

-- Languages Table
CREATE TABLE IF NOT EXISTS languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT 'ISO language code',
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default languages
INSERT INTO languages (name, code, is_default, is_active) VALUES
('English', 'en', 1, 1),
('Hindi', 'hi', 0, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Custom Fields Table
CREATE TABLE IF NOT EXISTS custom_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_belongs_to ENUM('student', 'staff') NOT NULL,
    field_type VARCHAR(50) NOT NULL COMMENT 'text, number, date, select, textarea, etc.',
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_values TEXT COMMENT 'For select type, comma-separated values or JSON',
    grid_column INT DEFAULT 12,
    is_required TINYINT(1) DEFAULT 0,
    is_visible TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_field_belongs_to (field_belongs_to),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Fields Table (to track which default fields are enabled/disabled)
CREATE TABLE IF NOT EXISTS system_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_belongs_to ENUM('student', 'staff') NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    is_enabled TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_field (field_belongs_to, field_name),
    INDEX idx_field_belongs_to (field_belongs_to),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 029_backup_restore_tables.sql
-- ============================================================================

-- Backup and Restore Tables
-- This migration creates tables for managing database backups

USE u524544702_schoolwizard;

-- Backup Records Table
CREATE TABLE IF NOT EXISTS backup_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT COMMENT 'File size in bytes',
    backup_type ENUM('manual', 'automatic') DEFAULT 'manual',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_backup_type (backup_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backup Settings Table
CREATE TABLE IF NOT EXISTS backup_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auto_backup_enabled TINYINT(1) DEFAULT 0,
    backup_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
    backup_time TIME DEFAULT '02:00:00',
    keep_backups INT DEFAULT 7 COMMENT 'Number of backups to keep',
    cron_secret_key VARCHAR(255) UNIQUE,
    last_backup_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default backup settings
INSERT INTO backup_settings (auto_backup_enabled, backup_frequency, backup_time, keep_backups) VALUES
(0, 'daily', '02:00:00', 7)
ON DUPLICATE KEY UPDATE auto_backup_enabled=auto_backup_enabled;





-- ============================================================================
-- SchoolWizard Database - Consolidated SQL File
-- This file was automatically generated by combining multiple migration files
-- ============================================================================
-- IMPORTANT: Run files in order: 01, 02, 03, 04, 05
-- ============================================================================

USE u524544702_schoolwizard;

-- ============================================================================
-- Source: 002_academics_tables.sql
-- ============================================================================

-- Academics Module Tables

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type ENUM('theory', 'practical') DEFAULT 'theory',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subject Groups Table
CREATE TABLE IF NOT EXISTS subject_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    INDEX idx_class_section (class_id, section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subject Group Subjects (Many-to-Many)
CREATE TABLE IF NOT EXISTS subject_group_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_group_id INT NOT NULL,
    subject_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_subject_group_subject (subject_group_id, subject_id),
    INDEX idx_subject_group (subject_group_id),
    INDEX idx_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Class Teachers (Assign teachers to class-sections)
CREATE TABLE IF NOT EXISTS class_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_section_teacher (class_id, section_id, teacher_id),
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Class Timetable
CREATE TABLE IF NOT EXISTS class_timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_group_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    room_no VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 003_add_missing_columns_only.sql
-- ============================================================================

-- Add only the columns that are actually missing
-- This script checks if each column exists before adding it
-- Run this in phpMyAdmin SQL tab

USE u524544702_schoolwizard;

-- Function to add column only if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE directly
-- So we'll use a stored procedure approach or just run them individually

-- Since father_photo already exists (you got the duplicate error), skip it
-- Just run the ones that don't exist yet

-- Add mother_photo (if missing)
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;

-- Add guardian_photo (if missing)
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;

-- Add transport_route_id (if missing)
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;

-- Add hostel_id (if missing)
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;

-- Add hostel_room_id (if missing)
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- After running, verify the count
-- Should have 49 columns total (including id, created_at, updated_at)
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';




-- ============================================================================
-- Source: 003_check_and_add_columns.sql
-- ============================================================================

-- Script to check which columns exist and add only the missing ones
-- Run this in phpMyAdmin SQL tab

USE u524544702_schoolwizard;

-- Check current columns
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Now add only the missing columns
-- Run these one by one and skip any that give "Duplicate column name" errors

-- Try to add father_photo (skip if error)
ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email;

-- Try to add mother_photo (skip if error)
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;

-- Try to add guardian_photo (skip if error)
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;

-- Try to add transport_route_id (skip if error)
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;

-- Try to add hostel_id (skip if error)
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;

-- Try to add hostel_room_id (skip if error)
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- Verify final structure
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';




-- ============================================================================
-- Source: 003_get_exact_table_structure.sql
-- ============================================================================

-- Get the exact structure of the students table
-- Run this to see all columns in order

USE u524544702_schoolwizard;

-- Get all columns in the exact order they appear in the table
SELECT 
    ORDINAL_POSITION as position,
    COLUMN_NAME as column_name,
    DATA_TYPE as data_type,
    IS_NULLABLE as nullable
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Count total columns (should be 49 including id, created_at, updated_at)
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students';

-- List columns that should be in INSERT (excluding id, created_at, updated_at, disable_reason_id, disable_date)
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at', 'disable_reason_id', 'disable_date')
ORDER BY ORDINAL_POSITION;




-- ============================================================================
-- Source: 003_students_tables.sql
-- ============================================================================

-- Student Information Module Tables

-- Student Categories
CREATE TABLE IF NOT EXISTS student_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Houses
CREATE TABLE IF NOT EXISTS student_houses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disable Reasons
CREATE TABLE IF NOT EXISTS disable_reasons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table
-- Note: This table includes all columns. If you get column count errors, 
-- make sure this migration has been run: mysql -u root schoolwizard < database/migrations/003_students_tables.sql
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_no VARCHAR(50) NOT NULL UNIQUE,
    roll_no VARCHAR(50),
    user_id INT,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    session_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    gender ENUM('male', 'female', 'other') NOT NULL,
    date_of_birth DATE NOT NULL,
    category_id INT,
    religion VARCHAR(100),
    caste VARCHAR(100),
    student_mobile VARCHAR(20),
    email VARCHAR(255),
    admission_date DATE NOT NULL,
    photo VARCHAR(255),
    blood_group VARCHAR(10),
    house_id INT,
    height VARCHAR(20),
    weight VARCHAR(20),
    as_on_date DATE,
    sibling_id INT,
    -- Father Details
    father_name VARCHAR(255),
    father_occupation VARCHAR(255),
    father_phone VARCHAR(20),
    father_email VARCHAR(255),
    father_photo VARCHAR(255),
    -- Mother Details
    mother_name VARCHAR(255),
    mother_occupation VARCHAR(255),
    mother_phone VARCHAR(20),
    mother_email VARCHAR(255),
    mother_photo VARCHAR(255),
    -- Guardian Details
    guardian_name VARCHAR(255),
    guardian_relation VARCHAR(100),
    guardian_occupation VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    guardian_photo VARCHAR(255),
    -- Address Details
    current_address TEXT,
    permanent_address TEXT,
    -- Transport
    transport_route_id INT,
    -- Hostel
    hostel_id INT,
    hostel_room_id INT,
    -- RTE
    is_rte TINYINT(1) DEFAULT 0,
    rte_details TEXT,
    -- Status
    is_active TINYINT(1) DEFAULT 1,
    disable_reason_id INT,
    disable_date DATE,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE RESTRICT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES student_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (house_id) REFERENCES student_houses(id) ON DELETE SET NULL,
    FOREIGN KEY (disable_reason_id) REFERENCES disable_reasons(id) ON DELETE SET NULL,
    INDEX idx_admission_no (admission_no),
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_session (session_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Documents
CREATE TABLE IF NOT EXISTS student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Admissions (Pending)
CREATE TABLE IF NOT EXISTS online_admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admission_no VARCHAR(50),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    gender ENUM('male', 'female', 'other') NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    class_id INT,
    number_of_child INT DEFAULT 1,
    -- Parent Details
    father_name VARCHAR(255),
    father_phone VARCHAR(20),
    mother_name VARCHAR(255),
    mother_phone VARCHAR(20),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    -- Address
    address TEXT,
    -- Status
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ============================================================================
-- Source: 003_students_tables_ALTER.sql
-- ============================================================================

-- ALTER script to add missing columns to students table if they don't exist
-- Run this if you get "Column count doesn't match" errors
-- Usage: mysql -u root schoolwizard < database/migrations/003_students_tables_ALTER.sql

USE u524544702_schoolwizard;

-- Add missing columns if they don't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS father_photo VARCHAR(255) AFTER father_email,
ADD COLUMN IF NOT EXISTS mother_photo VARCHAR(255) AFTER mother_email,
ADD COLUMN IF NOT EXISTS guardian_photo VARCHAR(255) AFTER guardian_email,
ADD COLUMN IF NOT EXISTS transport_route_id INT AFTER permanent_address,
ADD COLUMN IF NOT EXISTS hostel_id INT AFTER transport_route_id,
ADD COLUMN IF NOT EXISTS hostel_room_id INT AFTER hostel_id;

-- Note: If the above doesn't work (MySQL version < 8.0.19), use this instead:
-- Check each column and add if missing manually in phpMyAdmin or MySQL client




-- ============================================================================
-- Source: 003_students_tables_ALTER_SAFE.sql
-- ============================================================================

-- Safe ALTER script to add missing columns to students table
-- This will NOT delete any data
-- Run this in phpMyAdmin SQL tab or MySQL client

USE u524544702_schoolwizard;

-- Disable foreign key checks temporarily (MySQL will re-enable automatically)
SET FOREIGN_KEY_CHECKS = 0;

-- Add missing columns one by one
-- If a column already exists, you'll get an error - that's okay, just continue

-- Check and add father_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'father_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email', 
  'SELECT "Column father_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add mother_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'mother_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email', 
  'SELECT "Column mother_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add guardian_photo
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'guardian_photo');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email', 
  'SELECT "Column guardian_photo already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add transport_route_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'transport_route_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address', 
  'SELECT "Column transport_route_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add hostel_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'hostel_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id', 
  'SELECT "Column hostel_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add hostel_room_id
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'schoolwizard' 
  AND TABLE_NAME = 'students' 
  AND COLUMN_NAME = 'hostel_room_id');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id', 
  'SELECT "Column hostel_room_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify the table structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;




-- ============================================================================
-- Source: 003_students_tables_ALTER_SIMPLE.sql
-- ============================================================================

-- Simple ALTER script to add missing columns
-- Run this in phpMyAdmin SQL tab
-- If you get "Duplicate column name" errors, that means the column already exists - that's fine!

USE u524544702_schoolwizard;

-- Add missing columns (ignore errors if they already exist)
ALTER TABLE students ADD COLUMN father_photo VARCHAR(255) AFTER father_email;
ALTER TABLE students ADD COLUMN mother_photo VARCHAR(255) AFTER mother_email;
ALTER TABLE students ADD COLUMN guardian_photo VARCHAR(255) AFTER guardian_email;
ALTER TABLE students ADD COLUMN transport_route_id INT AFTER permanent_address;
ALTER TABLE students ADD COLUMN hostel_id INT AFTER transport_route_id;
ALTER TABLE students ADD COLUMN hostel_room_id INT AFTER hostel_id;

-- Verify: This should show 49 columns total (including id, created_at, updated_at)
SELECT COUNT(*) as total_columns FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' AND TABLE_NAME = 'students';




-- ============================================================================
-- Source: 003_verify_table_structure.sql
-- ============================================================================

-- Script to verify the students table structure
-- Run this first to see what columns you have

USE u524544702_schoolwizard;

-- List all columns in the students table
SELECT 
    ORDINAL_POSITION as position,
    COLUMN_NAME as column_name,
    DATA_TYPE as data_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'students'
ORDER BY ORDINAL_POSITION;

-- Count total columns
SELECT COUNT(*) as total_columns 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students';

-- Check for specific missing columns
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'father_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as father_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'mother_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as mother_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'guardian_photo'
    ) THEN 'EXISTS' ELSE 'MISSING' END as guardian_photo,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'transport_route_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as transport_route_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'hostel_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as hostel_id,
    CASE WHEN EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'schoolwizard' 
        AND TABLE_NAME = 'students' 
        AND COLUMN_NAME = 'hostel_room_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as hostel_room_id;




-- ============================================================================
-- Source: 010_add_admit_card_fields.sql
-- ============================================================================

-- Add missing columns to admit_card_templates table
USE u524544702_schoolwizard;

ALTER TABLE admit_card_templates
ADD COLUMN IF NOT EXISTS heading VARCHAR(255) AFTER name,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER heading,
ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255) AFTER title;




-- ============================================================================
-- Source: 012_fix_student_photo_column.sql
-- ============================================================================

-- Fix student photo column to support base64 images
-- Base64 encoded images are much longer than 255 characters
-- This migration changes the photo column from VARCHAR(255) to LONGTEXT

USE u524544702_schoolwizard;

-- Change photo column to LONGTEXT to support full base64 image data
ALTER TABLE students MODIFY COLUMN photo LONGTEXT;

-- Also update parent photo columns if they exist
ALTER TABLE students MODIFY COLUMN father_photo LONGTEXT;
ALTER TABLE students MODIFY COLUMN mother_photo LONGTEXT;
ALTER TABLE students MODIFY COLUMN guardian_photo LONGTEXT;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'schoolwizard' 
AND TABLE_NAME = 'students' 
AND COLUMN_NAME LIKE '%photo%';





-- ============================================================================
-- SchoolWizard Database - Consolidated SQL File
-- This file was automatically generated by combining multiple migration files
-- ============================================================================
-- IMPORTANT: Run files in order: 01, 02, 03, 04, 05
-- ============================================================================

USE u524544702_schoolwizard;

-- ============================================================================
-- Source: 004_front_office_tables.sql
-- ============================================================================

-- Front Office Module Tables

-- Front Office Setup
CREATE TABLE IF NOT EXISTS front_office_purposes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS front_office_complain_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS front_office_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS front_office_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admission Enquiry
CREATE TABLE IF NOT EXISTS admission_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    description TEXT,
    note TEXT,
    enquiry_date DATE NOT NULL,
    next_follow_up_date DATE,
    assigned_to INT,
    reference_id INT,
    source_id INT,
    class_id INT,
    number_of_child INT DEFAULT 1,
    status ENUM('pending', 'contacted', 'enrolled', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reference_id) REFERENCES front_office_references(id) ON DELETE SET NULL,
    FOREIGN KEY (source_id) REFERENCES front_office_sources(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_enquiry_date (enquiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enquiry Follow Ups
CREATE TABLE IF NOT EXISTS enquiry_follow_ups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enquiry_id INT NOT NULL,
    follow_up_date DATE NOT NULL,
    next_follow_up_date DATE,
    response TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enquiry_id) REFERENCES admission_enquiries(id) ON DELETE CASCADE,
    INDEX idx_enquiry (enquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitor Book
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purpose_id INT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    id_card VARCHAR(100),
    number_of_person INT DEFAULT 1,
    visit_date DATE NOT NULL,
    in_time TIME NOT NULL,
    out_time TIME,
    note TEXT,
    document_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purpose_id) REFERENCES front_office_purposes(id) ON DELETE SET NULL,
    INDEX idx_visit_date (visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phone Call Log
CREATE TABLE IF NOT EXISTS phone_call_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    call_date DATE NOT NULL,
    call_time TIME,
    description TEXT,
    next_follow_up_date DATE,
    call_duration VARCHAR(50),
    note TEXT,
    call_type ENUM('incoming', 'outgoing') DEFAULT 'incoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_call_date (call_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Postal Dispatch
CREATE TABLE IF NOT EXISTS postal_dispatch (
    id INT AUTO_INCREMENT PRIMARY KEY,
    to_title VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    address TEXT,
    note TEXT,
    from_title VARCHAR(255),
    dispatch_date DATE NOT NULL,
    document_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dispatch_date (dispatch_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Postal Receive
CREATE TABLE IF NOT EXISTS postal_receive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_title VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    address TEXT,
    note TEXT,
    to_title VARCHAR(255),
    receive_date DATE NOT NULL,
    document_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receive_date (receive_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complain
CREATE TABLE IF NOT EXISTS complains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complain_type_id INT,
    source_id INT,
    complain_by VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    complain_date DATE NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT,
    assigned_to INT,
    note TEXT,
    document_path VARCHAR(500),
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (complain_type_id) REFERENCES front_office_complain_types(id) ON DELETE SET NULL,
    FOREIGN KEY (source_id) REFERENCES front_office_sources(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_complain_date (complain_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 005_human_resource_tables.sql
-- ============================================================================

-- Human Resource Module Tables
-- Departments, Designations, Leave Types, Staff, Attendance, Payroll, Leaves

USE u524544702_schoolwizard;

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Designations
CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    max_days INT DEFAULT NULL,
    is_paid TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Members
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    user_id INT,
    role_id INT NOT NULL,
    designation_id INT,
    department_id INT,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    gender ENUM('male', 'female', 'other') NOT NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT 'single',
    date_of_birth DATE,
    date_of_joining DATE NOT NULL,
    phone VARCHAR(20),
    emergency_contact VARCHAR(20),
    email VARCHAR(255),
    photo VARCHAR(255),
    current_address TEXT,
    permanent_address TEXT,
    qualification TEXT,
    work_experience TEXT,
    note TEXT,
    epf_no VARCHAR(100),
    basic_salary DECIMAL(10, 2) DEFAULT 0,
    contract_type ENUM('permanent', 'contract', 'temporary', 'probation') DEFAULT 'permanent',
    work_shift ENUM('morning', 'evening', 'night', 'flexible') DEFAULT 'morning',
    location VARCHAR(255),
    number_of_leaves INT DEFAULT 0,
    bank_account_title VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(255),
    ifsc_code VARCHAR(20),
    bank_branch_name VARCHAR(255),
    facebook_url VARCHAR(255),
    twitter_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    instagram_url VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    leaving_date DATE,
    resignation_letter VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_staff_id (staff_id),
    INDEX idx_role (role_id),
    INDEX idx_department (department_id),
    INDEX idx_active (is_active),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Documents
CREATE TABLE IF NOT EXISTS staff_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    document_type ENUM('resume', 'joining_letter', 'other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    INDEX idx_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'late', 'absent', 'half_day', 'holiday') NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_date (staff_id, attendance_date),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    leave_type_id INT NOT NULL,
    apply_date DATE NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT,
    note TEXT,
    document_path VARCHAR(500),
    status ENUM('pending', 'approved', 'disapproved') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_staff (staff_id),
    INDEX idx_status (status),
    INDEX idx_leave_date (leave_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10, 2) DEFAULT 0,
    total_earnings DECIMAL(10, 2) DEFAULT 0,
    total_deductions DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) DEFAULT 0,
    status ENUM('not_generated', 'generated', 'paid') DEFAULT 'not_generated',
    payment_date DATE,
    payment_mode ENUM('cash', 'cheque', 'bank_transfer', 'online') DEFAULT 'bank_transfer',
    payment_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_staff_month_year (staff_id, month, year),
    INDEX idx_month_year (month, year),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Earnings
CREATE TABLE IF NOT EXISTS payroll_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id INT NOT NULL,
    earning_type VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
    INDEX idx_payroll (payroll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll Deductions
CREATE TABLE IF NOT EXISTS payroll_deductions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id INT NOT NULL,
    deduction_type VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES payroll(id) ON DELETE CASCADE,
    INDEX idx_payroll (payroll_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher Ratings
CREATE TABLE IF NOT EXISTS teacher_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_approved TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 006_fees_collection_tables.sql
-- ============================================================================

-- Fees Collection Module Tables
-- Fees Type, Fees Group, Fees Master, Fees Discount, Fees Collection, Fees Reminder

USE u524544702_schoolwizard;

-- Fees Types
CREATE TABLE IF NOT EXISTS fees_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Groups
CREATE TABLE IF NOT EXISTS fees_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Group Types (Many-to-Many: Fees Group can have multiple Fees Types)
CREATE TABLE IF NOT EXISTS fees_group_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_group_id INT NOT NULL,
    fees_type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_group_id) REFERENCES fees_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (fees_type_id) REFERENCES fees_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_type (fees_group_id, fees_type_id),
    INDEX idx_group (fees_group_id),
    INDEX idx_type (fees_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Master (Session-wise fees amounts)
CREATE TABLE IF NOT EXISTS fees_master (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_group_id INT NOT NULL,
    fees_type_id INT NOT NULL,
    session_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    fine_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_group_id) REFERENCES fees_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (fees_type_id) REFERENCES fees_types(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_group (fees_group_id),
    INDEX idx_type (fees_type_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Group Assignments (Assign Fees Groups to Class-Section or Individual Students)
CREATE TABLE IF NOT EXISTS fees_group_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_group_id INT NOT NULL,
    session_id INT NOT NULL,
    class_id INT,
    section_id INT,
    student_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_group_id) REFERENCES fees_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_group (fees_group_id),
    INDEX idx_session (session_id),
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_student (student_id),
    -- Either class-section OR student_id should be set, not both
    CHECK ((class_id IS NOT NULL AND section_id IS NOT NULL AND student_id IS NULL) OR 
           (class_id IS NULL AND section_id IS NULL AND student_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Discounts
CREATE TABLE IF NOT EXISTS fees_discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Discount Assignments
CREATE TABLE IF NOT EXISTS fees_discount_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_discount_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_discount_id) REFERENCES fees_discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_discount (fees_discount_id, student_id),
    INDEX idx_discount (fees_discount_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Invoices (Generated when Fees Group is assigned to student)
CREATE TABLE IF NOT EXISTS fees_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    fees_master_id INT NOT NULL,
    session_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (fees_master_id) REFERENCES fees_master(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_invoice_no (invoice_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Payments
CREATE TABLE IF NOT EXISTS fees_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(50) NOT NULL UNIQUE,
    fees_invoice_id INT NOT NULL,
    student_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    payment_mode ENUM('cash', 'cheque', 'bank_transfer', 'online', 'card') DEFAULT 'cash',
    note TEXT,
    collected_by INT,
    is_reverted TINYINT(1) DEFAULT 0,
    reverted_at TIMESTAMP NULL,
    reverted_by INT,
    revert_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_invoice_id) REFERENCES fees_invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reverted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_id (payment_id),
    INDEX idx_invoice (fees_invoice_id),
    INDEX idx_student (student_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_reverted (is_reverted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Discount Applications (Track when discount is applied to payment)
CREATE TABLE IF NOT EXISTS fees_discount_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_discount_id INT NOT NULL,
    fees_payment_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_discount_id) REFERENCES fees_discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (fees_payment_id) REFERENCES fees_payments(id) ON DELETE CASCADE,
    INDEX idx_discount (fees_discount_id),
    INDEX idx_payment (fees_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Carry Forward (Balance fees from previous session)
CREATE TABLE IF NOT EXISTS fees_carry_forward (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    from_session_id INT NOT NULL,
    to_session_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (from_session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (to_session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_to_session (to_session_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Reminder Settings
CREATE TABLE IF NOT EXISTS fees_reminder_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reminder_type ENUM('before_1', 'before_2', 'after_1', 'after_2') NOT NULL,
    is_active TINYINT(1) DEFAULT 0,
    days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reminder_type (reminder_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fees Reminder Logs
CREATE TABLE IF NOT EXISTS fees_reminder_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fees_invoice_id INT NOT NULL,
    reminder_type ENUM('before_1', 'before_2', 'after_1', 'after_2') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fees_invoice_id) REFERENCES fees_invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice (fees_invoice_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 007_income_expenses_tables.sql
-- ============================================================================

-- Income and Expenses Module Tables

USE u524544702_schoolwizard;

-- Income Heads
CREATE TABLE IF NOT EXISTS income_heads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Income Records
CREATE TABLE IF NOT EXISTS income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    income_head_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    document_path VARCHAR(500),
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (income_head_id) REFERENCES income_heads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_income_head (income_head_id),
    INDEX idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Heads
CREATE TABLE IF NOT EXISTS expense_heads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Records
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_head_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    document_path VARCHAR(500),
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_head_id) REFERENCES expense_heads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_expense_head (expense_head_id),
    INDEX idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





-- ============================================================================
-- SchoolWizard Database - Consolidated SQL File
-- This file was automatically generated by combining multiple migration files
-- ============================================================================
-- IMPORTANT: Run files in order: 01, 02, 03, 04, 05
-- ============================================================================

USE u524544702_schoolwizard;

-- ============================================================================
-- Source: 008_student_attendance_tables.sql
-- ============================================================================

-- Student Attendance Module Tables

USE u524544702_schoolwizard;

-- Student Attendance (Day Wise)
CREATE TABLE IF NOT EXISTS student_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    session_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'late', 'absent', 'half_day', 'holiday') NOT NULL,
    note TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_student_date (student_id, attendance_date, session_id),
    INDEX idx_date (attendance_date),
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Attendance Period Wise (for period-by-period attendance)
CREATE TABLE IF NOT EXISTS student_attendance_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_attendance_id INT NOT NULL,
    period_number INT NOT NULL,
    subject_id INT,
    status ENUM('present', 'late', 'absent') NOT NULL,
    note TEXT,
    FOREIGN KEY (student_attendance_id) REFERENCES student_attendance(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance_period (student_attendance_id, period_number),
    INDEX idx_period (period_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Leave Requests
CREATE TABLE IF NOT EXISTS student_leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    session_id INT NOT NULL,
    apply_date DATE NOT NULL,
    leave_date DATE NOT NULL,
    leave_type ENUM('sick', 'casual', 'emergency', 'other') DEFAULT 'casual',
    reason TEXT NOT NULL,
    document_path VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_date (leave_date),
    INDEX idx_status (status),
    INDEX idx_class_section (class_id, section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 009_examinations_tables.sql
-- ============================================================================

-- Examinations Module Tables
-- Marks Grade, Exam Groups, Exams, Exam Subjects, Exam Marks, Exam Results, Admit Cards, Marksheets

USE u524544702_schoolwizard;

-- Marks Grades (Grading System)
CREATE TABLE IF NOT EXISTS marks_grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_type ENUM('general_purpose', 'school_based', 'college_based', 'gpa') NOT NULL,
    grade_name VARCHAR(50) NOT NULL,
    percent_from DECIMAL(5, 2) NOT NULL,
    percent_upto DECIMAL(5, 2) NOT NULL,
    grade_point DECIMAL(4, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_exam_type (exam_type),
    INDEX idx_percent (percent_from, percent_upto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Groups
CREATE TABLE IF NOT EXISTS exam_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exam_type ENUM('general_purpose', 'school_based', 'college_based', 'gpa') NOT NULL DEFAULT 'general_purpose',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_exam_type (exam_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_group_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    session_id INT NOT NULL,
    is_published TINYINT(1) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_group_id) REFERENCES exam_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_group (exam_group_id),
    INDEX idx_session (session_id),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Students (Assign students to exam)
CREATE TABLE IF NOT EXISTS exam_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    roll_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_student (exam_id, student_id),
    INDEX idx_exam (exam_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Subjects (Subjects in an exam with schedule)
CREATE TABLE IF NOT EXISTS exam_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE,
    exam_time_from TIME,
    exam_time_to TIME,
    room_number VARCHAR(50),
    credit_hours DECIMAL(4, 2) DEFAULT 0,
    max_marks DECIMAL(6, 2) NOT NULL DEFAULT 100,
    passing_marks DECIMAL(6, 2) DEFAULT 33,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_exam (exam_id),
    INDEX idx_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Marks
CREATE TABLE IF NOT EXISTS exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    exam_subject_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained DECIMAL(6, 2) DEFAULT 0,
    grade VARCHAR(10),
    grade_point DECIMAL(4, 2),
    note TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_exam_subject_student (exam_id, exam_subject_id, student_id),
    INDEX idx_exam (exam_id),
    INDEX idx_student (student_id),
    INDEX idx_subject (exam_subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Linked Exams (for merging exams to get consolidated results)
CREATE TABLE IF NOT EXISTS linked_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_group_id INT NOT NULL,
    exam_id INT NOT NULL,
    linked_exam_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_group_id) REFERENCES exam_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_link (exam_id, linked_exam_id),
    INDEX idx_exam (exam_id),
    INDEX idx_linked (linked_exam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admit Card Templates
CREATE TABLE IF NOT EXISTS admit_card_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    heading VARCHAR(255),
    title VARCHAR(255),
    exam_name VARCHAR(255),
    header_left_text VARCHAR(255),
    header_center_text VARCHAR(255),
    header_right_text VARCHAR(255),
    body_text TEXT,
    footer_left_text VARCHAR(255),
    footer_center_text VARCHAR(255),
    footer_right_text VARCHAR(255),
    header_height INT DEFAULT 100,
    footer_height INT DEFAULT 50,
    body_height INT DEFAULT 400,
    body_width INT DEFAULT 800,
    show_student_photo TINYINT(1) DEFAULT 1,
    photo_height INT DEFAULT 100,
    background_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marksheet Templates
CREATE TABLE IF NOT EXISTS marksheet_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    header_left_text VARCHAR(255),
    header_center_text VARCHAR(255),
    header_right_text VARCHAR(255),
    body_text TEXT,
    footer_left_text VARCHAR(255),
    footer_center_text VARCHAR(255),
    footer_right_text VARCHAR(255),
    header_height INT DEFAULT 100,
    footer_height INT DEFAULT 50,
    body_height INT DEFAULT 500,
    body_width INT DEFAULT 800,
    show_student_photo TINYINT(1) DEFAULT 1,
    photo_height INT DEFAULT 100,
    background_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 013_online_examinations_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Question Bank Table
CREATE TABLE IF NOT EXISTS question_bank (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    option_e TEXT,
    correct_answer ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
    marks DECIMAL(5,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Exams Table
CREATE TABLE IF NOT EXISTS online_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject_id INT NOT NULL,
    session_id INT NOT NULL,
    class_id INT,
    section_id INT,
    exam_date DATE,
    exam_time_from TIME,
    exam_time_to TIME,
    duration_minutes INT DEFAULT 60,
    total_marks DECIMAL(10,2) DEFAULT 0,
    passing_marks DECIMAL(10,2) DEFAULT 0,
    instructions TEXT,
    is_published TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_subject (subject_id),
    INDEX idx_session (session_id),
    INDEX idx_class_section (class_id, section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Exam Questions Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS online_exam_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    online_exam_id INT NOT NULL,
    question_id INT NOT NULL,
    marks DECIMAL(5,2) DEFAULT 1.00,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (online_exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_question (online_exam_id, question_id),
    INDEX idx_exam (online_exam_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Exam Students Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS online_exam_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    online_exam_id INT NOT NULL,
    student_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (online_exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_exam_student (online_exam_id, student_id),
    INDEX idx_exam (online_exam_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Exam Attempts Table
CREATE TABLE IF NOT EXISTS online_exam_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    online_exam_id INT NOT NULL,
    student_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    time_taken_minutes INT,
    total_marks DECIMAL(10,2) DEFAULT 0,
    obtained_marks DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('in_progress', 'submitted', 'time_up') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (online_exam_id) REFERENCES online_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_exam (online_exam_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Online Exam Answers Table
CREATE TABLE IF NOT EXISTS online_exam_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer ENUM('A', 'B', 'C', 'D', 'E', '') DEFAULT '',
    is_correct TINYINT(1) DEFAULT 0,
    marks_obtained DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES online_exam_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attempt_question (attempt_id, question_id),
    INDEX idx_attempt (attempt_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 014_homework_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Homework Table
CREATE TABLE IF NOT EXISTS homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_group_id INT,
    subject_id INT NOT NULL,
    homework_date DATE NOT NULL,
    submission_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    attachment_url VARCHAR(500),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_subject (subject_id),
    INDEX idx_homework_date (homework_date),
    INDEX idx_submission_date (submission_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Homework Evaluations Table (to track which students completed homework)
CREATE TABLE IF NOT EXISTS homework_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    is_completed TINYINT(1) DEFAULT 0,
    evaluation_date DATE,
    remarks TEXT,
    marks DECIMAL(5,2),
    evaluated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_homework_student (homework_id, student_id),
    INDEX idx_homework (homework_id),
    INDEX idx_student (student_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 015_library_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Books Table
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_title VARCHAR(255) NOT NULL,
    book_no VARCHAR(100) UNIQUE,
    isbn_no VARCHAR(100),
    publisher VARCHAR(255),
    author VARCHAR(255),
    subject_id INT,
    rack_no VARCHAR(100),
    qty INT NOT NULL DEFAULT 0,
    available_qty INT NOT NULL DEFAULT 0,
    book_price DECIMAL(10, 2),
    inward_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_book_title (book_title),
    INDEX idx_book_no (book_no),
    INDEX idx_isbn (isbn_no),
    INDEX idx_subject (subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Library Members Table (for both students and staff)
CREATE TABLE IF NOT EXISTS library_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_type ENUM('student', 'staff') NOT NULL,
    student_id INT,
    staff_id INT,
    member_code VARCHAR(100) UNIQUE,
    joined_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_member (student_id),
    UNIQUE KEY unique_staff_member (staff_id),
    INDEX idx_member_type (member_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Book Issues Table
CREATE TABLE IF NOT EXISTS book_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    due_date DATE NOT NULL,
    return_status ENUM('issued', 'returned', 'lost', 'damaged') DEFAULT 'issued',
    fine_amount DECIMAL(10, 2) DEFAULT 0,
    remarks TEXT,
    issued_by INT,
    returned_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES library_members(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (returned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_book (book_id),
    INDEX idx_member (member_id),
    INDEX idx_issue_date (issue_date),
    INDEX idx_return_status (return_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 016_download_center_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Download Contents Table
CREATE TABLE IF NOT EXISTS download_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_title VARCHAR(255) NOT NULL,
    content_type ENUM('assignments', 'study_material', 'syllabus', 'other_downloads') NOT NULL,
    available_for ENUM('students', 'staff', 'both') DEFAULT 'students',
    class_id INT,
    section_id INT,
    upload_date DATE NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_content_type (content_type),
    INDEX idx_available_for (available_for),
    INDEX idx_class_section (class_id, section_id),
    INDEX idx_upload_date (upload_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 017_communicate_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Notice Board Table
CREATE TABLE IF NOT EXISTS notice_board (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notice_date DATE NOT NULL,
    publish_date DATE NOT NULL,
    message_to ENUM('students', 'guardians', 'staff', 'all') DEFAULT 'all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notice_date (notice_date),
    INDEX idx_publish_date (publish_date),
    INDEX idx_message_to (message_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Log Table
CREATE TABLE IF NOT EXISTS email_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type ENUM('students', 'guardians', 'staff', 'individual', 'class', 'birthday') NOT NULL,
    recipient_ids TEXT,
    recipient_emails TEXT,
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS Log Table
CREATE TABLE IF NOT EXISTS sms_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type ENUM('students', 'guardians', 'staff', 'individual', 'class', 'birthday') NOT NULL,
    recipient_ids TEXT,
    recipient_phones TEXT,
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 018_inventory_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Item Categories Table
CREATE TABLE IF NOT EXISTS item_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Stores Table
CREATE TABLE IF NOT EXISTS item_stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_stock_code (stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Suppliers Table
CREATE TABLE IF NOT EXISTS item_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    contact_person_name VARCHAR(255),
    contact_person_phone VARCHAR(20),
    contact_person_email VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items Table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE CASCADE,
    INDEX idx_name (name),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Stocks Table
CREATE TABLE IF NOT EXISTS item_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    category_id INT NOT NULL,
    supplier_id INT,
    store_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    stock_date DATE NOT NULL,
    document_path VARCHAR(500),
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES item_suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES item_stores(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_category (category_id),
    INDEX idx_store (store_id),
    INDEX idx_stock_date (stock_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item Issues Table
CREATE TABLE IF NOT EXISTS item_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    category_id INT NOT NULL,
    user_type ENUM('student', 'staff') NOT NULL,
    user_id INT NOT NULL,
    issue_by VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    return_date DATE,
    quantity INT NOT NULL DEFAULT 1,
    note TEXT,
    status ENUM('issued', 'returned') DEFAULT 'issued',
    returned_at TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_user (user_type, user_id),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 019_transport_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Routes Table
CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    fare DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_no VARCHAR(50) NOT NULL UNIQUE,
    vehicle_model VARCHAR(255),
    year_made YEAR,
    driver_name VARCHAR(255),
    driver_license VARCHAR(100),
    driver_contact VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vehicle_no (vehicle_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicle Assignments Table (Assign vehicles to routes)
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_route_vehicle (route_id, vehicle_id),
    INDEX idx_route (route_id),
    INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 020_hostel_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Hostels Table
CREATE TABLE IF NOT EXISTS hostels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('boys', 'girls', 'mixed') NOT NULL DEFAULT 'mixed',
    address TEXT,
    intake INT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hostel Rooms Table
CREATE TABLE IF NOT EXISTS hostel_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_no VARCHAR(50) NOT NULL,
    no_of_bed INT NOT NULL DEFAULT 1,
    cost_per_bed DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_hostel_room (hostel_id, room_no),
    INDEX idx_hostel (hostel_id),
    INDEX idx_room_type (room_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 021_certificate_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Certificate Templates Table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    header_left_text TEXT,
    header_center_text TEXT,
    header_right_text TEXT,
    body_text TEXT,
    footer_left_text TEXT,
    footer_center_text TEXT,
    footer_right_text TEXT,
    header_height INT DEFAULT 100,
    footer_height INT DEFAULT 100,
    body_height INT DEFAULT 400,
    body_width INT DEFAULT 800,
    student_photo_enabled BOOLEAN DEFAULT FALSE,
    photo_height INT DEFAULT 100,
    background_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ID Card Templates Table
CREATE TABLE IF NOT EXISTS id_card_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    background_image VARCHAR(500),
    logo VARCHAR(500),
    signature VARCHAR(500),
    school_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    id_card_title VARCHAR(255),
    header_color VARCHAR(7) DEFAULT '#000000',
    admission_number_enabled BOOLEAN DEFAULT TRUE,
    student_name_enabled BOOLEAN DEFAULT TRUE,
    class_enabled BOOLEAN DEFAULT TRUE,
    father_name_enabled BOOLEAN DEFAULT FALSE,
    mother_name_enabled BOOLEAN DEFAULT FALSE,
    student_address_enabled BOOLEAN DEFAULT FALSE,
    phone_enabled BOOLEAN DEFAULT FALSE,
    date_of_birth_enabled BOOLEAN DEFAULT FALSE,
    blood_group_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 022_calendar_todo_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_color VARCHAR(7) DEFAULT '#3B82F6',
    event_type ENUM('public', 'private', 'role', 'protected') NOT NULL DEFAULT 'private',
    role_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo Tasks Table
CREATE TABLE IF NOT EXISTS todo_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    task_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_task_date (task_date),
    INDEX idx_is_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 023_chat_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Chat Conversations Table
-- Tracks conversations between two users
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    last_message_id INT NULL,
    last_message_at TIMESTAMP NULL,
    user1_unread_count INT DEFAULT 0,
    user2_unread_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation (user1_id, user2_id),
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key for last_message_id after messages table is created
ALTER TABLE chat_conversations
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;




-- ============================================================================
-- Source: 023_chat_tables_update.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Drop the foreign key constraint if it exists (to avoid errors on re-run)
-- Note: If you get an error saying the constraint doesn't exist, that's fine - just continue
SET FOREIGN_KEY_CHECKS = 0;

-- Try to drop the constraint (ignore error if it doesn't exist)
ALTER TABLE chat_conversations DROP FOREIGN KEY fk_last_message;

SET FOREIGN_KEY_CHECKS = 1;

-- Now add the foreign key constraint for last_message_id
ALTER TABLE chat_conversations
ADD CONSTRAINT fk_last_message
FOREIGN KEY (last_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Verify the constraint was added
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'schoolwizard'
AND TABLE_NAME = 'chat_conversations'
AND CONSTRAINT_NAME = 'fk_last_message';



-- ============================================================================
-- Source: 025_alumni_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Alumni Records Table
CREATE TABLE IF NOT EXISTS alumni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    admission_no VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other') DEFAULT 'male',
    graduation_year YEAR NOT NULL,
    class_id INT NULL,
    section_id INT NULL,
    class_name VARCHAR(100),
    section_name VARCHAR(100),
    current_profession VARCHAR(255),
    current_company VARCHAR(255),
    current_designation VARCHAR(255),
    current_address TEXT,
    permanent_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    photo VARCHAR(500),
    facebook_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    instagram_url VARCHAR(500),
    achievements TEXT,
    bio TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    INDEX idx_graduation_year (graduation_year),
    INDEX idx_class_id (class_id),
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_admission_no (admission_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alumni Events Table
CREATE TABLE IF NOT EXISTS alumni_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    event_end_date DATE,
    event_end_time TIME,
    event_venue VARCHAR(255),
    event_address TEXT,
    event_type ENUM('reunion', 'networking', 'seminar', 'workshop', 'other') DEFAULT 'reunion',
    registration_required BOOLEAN DEFAULT FALSE,
    registration_deadline DATE,
    max_participants INT,
    registration_fee DECIMAL(10, 2) DEFAULT 0.00,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    event_image VARCHAR(500),
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alumni Event Registrations Table
CREATE TABLE IF NOT EXISTS alumni_event_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    alumni_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM('pending', 'paid', 'free') DEFAULT 'pending',
    payment_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_date TIMESTAMP NULL,
    attendance_status ENUM('registered', 'attended', 'absent', 'cancelled') DEFAULT 'registered',
    attendance_marked_at TIMESTAMP NULL,
    special_requirements TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES alumni_events(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_id) REFERENCES alumni(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (event_id, alumni_id),
    INDEX idx_event_id (event_id),
    INDEX idx_alumni_id (alumni_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_attendance_status (attendance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 026_lesson_plan_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Subject Status Table
CREATE TABLE IF NOT EXISTS subject_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    topic_name VARCHAR(255) NOT NULL,
    start_date DATE,
    completion_date DATE,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_percentage INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_class_section_subject (class_id, section_id, subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Plans Table
CREATE TABLE IF NOT EXISTS lesson_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT,
    lesson_title VARCHAR(255) NOT NULL,
    lesson_date DATE NOT NULL,
    topic VARCHAR(255),
    learning_objectives TEXT,
    teaching_methods TEXT,
    materials_needed TEXT,
    activities TEXT,
    homework TEXT,
    assessment TEXT,
    notes TEXT,
    status ENUM('draft', 'published', 'completed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_class_section_subject (class_id, section_id, subject_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_lesson_date (lesson_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Plan Topics/Chapters Table
CREATE TABLE IF NOT EXISTS lesson_plan_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_plan_id INT NOT NULL,
    topic_name VARCHAR(255) NOT NULL,
    topic_order INT DEFAULT 0,
    estimated_duration INT COMMENT 'Duration in minutes',
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
    INDEX idx_lesson_plan_id (lesson_plan_id),
    INDEX idx_topic_order (topic_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lesson Plan Attachments Table
CREATE TABLE IF NOT EXISTS lesson_plan_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lesson_plan_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
    INDEX idx_lesson_plan_id (lesson_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;





-- ============================================================================
-- SchoolWizard Database - Consolidated SQL File
-- This file was automatically generated by combining multiple migration files
-- ============================================================================
-- IMPORTANT: Run files in order: 01, 02, 03, 04, 05
-- ============================================================================

USE u524544702_schoolwizard;

-- ============================================================================
-- Source: 024_front_cms_tables.sql
-- ============================================================================

USE u524544702_schoolwizard;

-- Front CMS Pages Table (created first as it's referenced by menu_items)
CREATE TABLE IF NOT EXISTS front_cms_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_title VARCHAR(255) NOT NULL,
    page_type ENUM('standard', 'event', 'news', 'gallery') DEFAULT 'standard',
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page_type (page_type),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Menus Table
CREATE TABLE IF NOT EXISTS front_cms_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Menu Items Table
CREATE TABLE IF NOT EXISTS front_cms_menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    parent_id INT NULL,
    menu_item VARCHAR(255) NOT NULL,
    external_url VARCHAR(500),
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    page_id INT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES front_cms_menus(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES front_cms_menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES front_cms_pages(id) ON DELETE SET NULL,
    INDEX idx_menu_id (menu_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Events Table (Public Events)
CREATE TABLE IF NOT EXISTS front_cms_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_venue VARCHAR(255),
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_start_date (event_start_date),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Galleries Table
CREATE TABLE IF NOT EXISTS front_cms_galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_title VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Gallery Images Table
CREATE TABLE IF NOT EXISTS front_cms_gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_title VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_id) REFERENCES front_cms_galleries(id) ON DELETE CASCADE,
    INDEX idx_gallery_id (gallery_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS News Table
CREATE TABLE IF NOT EXISTS front_cms_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_title VARCHAR(255) NOT NULL,
    news_date DATE NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_news_date (news_date),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Media Table
CREATE TABLE IF NOT EXISTS front_cms_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type ENUM('image', 'document', 'video') NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    youtube_url VARCHAR(500),
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_type (file_type),
    INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Banner Images Table
CREATE TABLE IF NOT EXISTS front_cms_banner_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    image_title VARCHAR(255),
    image_link VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ============================================================================
-- Source: 030_front_cms_website_settings.sql
-- ============================================================================

-- Front CMS Website Settings Table
CREATE TABLE IF NOT EXISTS front_cms_website_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  website_logo VARCHAR(255) NULL,
  school_name VARCHAR(255) NOT NULL DEFAULT 'School Name',
  tag_line VARCHAR(255) NULL,
  tag_line_visible BOOLEAN DEFAULT TRUE,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(50) NULL,
  facebook_url VARCHAR(255) NULL,
  facebook_enabled BOOLEAN DEFAULT FALSE,
  twitter_url VARCHAR(255) NULL,
  twitter_enabled BOOLEAN DEFAULT FALSE,
  youtube_url VARCHAR(255) NULL,
  youtube_enabled BOOLEAN DEFAULT FALSE,
  instagram_url VARCHAR(255) NULL,
  instagram_enabled BOOLEAN DEFAULT FALSE,
  linkedin_url VARCHAR(255) NULL,
  linkedin_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_url VARCHAR(255) NULL,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_settings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Banner Carousel Table
CREATE TABLE IF NOT EXISTS front_cms_banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_path VARCHAR(255) NOT NULL,
  button_text VARCHAR(100) NULL,
  button_url VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings (only if table is empty)
INSERT INTO front_cms_website_settings (school_name, tag_line, tag_line_visible, contact_email, contact_phone)
SELECT 'School Name', 'A School with a Difference', TRUE, 'info@schoolname.edu', '+91 1234567890'
WHERE NOT EXISTS (SELECT 1 FROM front_cms_website_settings);




-- ============================================================================
-- Source: 031_about_us_page_content.sql
-- ============================================================================

-- About Us Page Content Tables

-- Mission & Vision Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_mission_vision (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_content TEXT NOT NULL,
  vision_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mission_vision (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Counter/Stats Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_counters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  counter_number VARCHAR(50) NOT NULL,
  counter_label VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- History Content Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  history_content TEXT NOT NULL,
  history_image VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_history (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Core Values Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  icon_class VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_year VARCHAR(20) NOT NULL,
  achievement_title VARCHAR(255) NOT NULL,
  achievement_description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leadership Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_leadership (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leader_name VARCHAR(255) NOT NULL,
  leader_role VARCHAR(255) NOT NULL,
  leader_bio TEXT NOT NULL,
  leader_image VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Mission & Vision
INSERT INTO front_cms_about_us_mission_vision (mission_content, vision_content)
VALUES (
  'To provide a holistic education that nurtures the intellectual, physical, emotional, and social development of every student. We are committed to creating a learning environment that inspires curiosity, fosters creativity, and prepares students to become responsible global citizens.',
  'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and the development of well-rounded individuals who contribute positively to society. We envision a school where every student realizes their full potential.'
)
ON DUPLICATE KEY UPDATE mission_content = mission_content;

-- Insert default History
INSERT INTO front_cms_about_us_history (history_content, history_image)
VALUES (
  'Founded in 1974, our school has been a beacon of educational excellence for over five decades. What started as a small institution with a vision to provide quality education has grown into one of the most respected schools in the region.\n\nOver the years, we have continuously evolved to meet the changing needs of education while maintaining our core values of excellence, integrity, and community. Our commitment to providing a well-rounded education has helped thousands of students achieve their dreams and make meaningful contributions to society.\n\nToday, we stand proud of our legacy while looking forward to an even brighter future. We continue to invest in modern facilities, innovative teaching methods, and comprehensive programs that prepare our students for the challenges and opportunities of the 21st century.',
  NULL
)
ON DUPLICATE KEY UPDATE history_content = history_content;




-- ============================================================================
-- Source: 032_admission_management.sql
-- ============================================================================

-- Admission Management Tables

-- Admission Inquiries Table (submissions from public website)
CREATE TABLE IF NOT EXISTS admission_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_name VARCHAR(255) NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  previous_school VARCHAR(255) NULL,
  address TEXT NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'contacted', 'approved', 'rejected') DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Important Dates Table
CREATE TABLE IF NOT EXISTS admission_important_dates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  date_value DATE NOT NULL,
  description TEXT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admission Contact Details Table
CREATE TABLE IF NOT EXISTS admission_contact_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_us_numbers TEXT NULL, -- JSON array of phone numbers
  email_us_addresses TEXT NULL, -- JSON array of email addresses
  visit_us_address TEXT NULL,
  office_hours TEXT NULL,
  important_dates_visible BOOLEAN DEFAULT TRUE,
  contact_details_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_contact_details (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default contact details
INSERT INTO admission_contact_details (
  call_us_numbers,
  email_us_addresses,
  visit_us_address,
  office_hours,
  important_dates_visible,
  contact_details_visible
)
VALUES (
  '["+91 1234567890", "+91 9876543210"]',
  '["admissions@schoolname.edu", "info@schoolname.edu"]',
  'School Address, City\nState - PIN Code',
  'Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM',
  TRUE,
  TRUE
)
ON DUPLICATE KEY UPDATE call_us_numbers = call_us_numbers;

-- Insert default important dates
INSERT INTO admission_important_dates (title, date_value, description, sort_order, is_active)
VALUES
  ('Application Start', '2025-01-01', 'Admission applications open for the new academic year', 1, TRUE),
  ('Last Date', '2025-03-31', 'Last date to submit admission applications', 2, TRUE),
  ('Assessment', '2025-04-15', 'Student assessment and interaction sessions (April 15-30, 2025)', 3, TRUE),
  ('Result Declaration', '2025-05-15', 'Admission results will be announced', 4, TRUE)
ON DUPLICATE KEY UPDATE title = title;




-- ============================================================================
-- Source: 033_gallery_management.sql
-- ============================================================================

-- Gallery Management Tables

-- Gallery Categories Table
CREATE TABLE IF NOT EXISTS gallery_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active),
  UNIQUE KEY unique_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_path VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category_id (category_id),
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (category_id) REFERENCES gallery_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO gallery_categories (name, description, sort_order, is_active)
VALUES
  ('Events', 'School events and celebrations', 1, TRUE),
  ('Sports', 'Sports activities and competitions', 2, TRUE),
  ('Academics', 'Academic activities and achievements', 3, TRUE),
  ('Cultural', 'Cultural programs and performances', 4, TRUE)
ON DUPLICATE KEY UPDATE name = name;




-- ============================================================================
-- Source: 034_news_events_management.sql
-- ============================================================================

-- News and Events Management Tables

-- News Table
CREATE TABLE IF NOT EXISTS news_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  featured_image VARCHAR(500) NULL,
  author VARCHAR(255) NULL,
  published_date DATE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_published_date (published_date),
  INDEX idx_is_active (is_active),
  INDEX idx_is_featured (is_featured),
  INDEX idx_slug (slug),
  UNIQUE KEY unique_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  event_date DATE NOT NULL,
  event_time TIME NULL,
  end_date DATE NULL,
  end_time TIME NULL,
  venue VARCHAR(255) NULL,
  featured_image VARCHAR(500) NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_event_date (event_date),
  INDEX idx_is_active (is_active),
  INDEX idx_is_featured (is_featured),
  INDEX idx_slug (slug),
  UNIQUE KEY unique_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample news
INSERT INTO news_articles (title, slug, excerpt, content, category, author, published_date, is_featured, is_active)
VALUES
  ('Annual Science Fair 2024 - A Grand Success', 'annual-science-fair-2024', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking.', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking. The event featured over 50 projects covering various scientific disciplines including physics, chemistry, biology, and environmental science.', 'academic', 'School Admin', CURDATE(), TRUE, TRUE),
  ('Basketball Team Wins Regional Championship', 'basketball-team-wins-regional-championship', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution.', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution. The team displayed exceptional teamwork and determination throughout the tournament.', 'sports', 'Sports Department', DATE_SUB(CURDATE(), INTERVAL 5 DAY), FALSE, TRUE)
ON DUPLICATE KEY UPDATE title = title;

-- Insert sample events
INSERT INTO events (title, slug, description, category, event_date, event_time, venue, is_featured, is_active)
VALUES
  ('Annual Sports Day', 'annual-sports-day-2025', 'Join us for our annual sports day featuring exciting competitions, races, and team events. All students, parents, and staff are welcome.', 'Sports', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '09:00:00', 'School Grounds', TRUE, TRUE),
  ('Science Exhibition', 'science-exhibition-2025', 'Students showcase innovative science projects and experiments. Open to all visitors interested in scientific exploration.', 'Academic', DATE_ADD(CURDATE(), INTERVAL 25 DAY), '10:00:00', 'School Auditorium', FALSE, TRUE)
ON DUPLICATE KEY UPDATE title = title;





