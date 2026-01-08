-- ============================================================================
-- SchoolWizard Database - Consolidated SQL File 1 of 5
-- Core Base Tables: Database, Users, Roles, Sessions, System Settings, RBAC
-- ============================================================================
-- IMPORTANT: Run files in order: 01, 02, 03, 04, 05
-- This file contains all core system tables required for basic functionality
-- ============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS schoolwizard;
USE schoolwizard;

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

USE schoolwizard;

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

USE schoolwizard;

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

USE schoolwizard;

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




