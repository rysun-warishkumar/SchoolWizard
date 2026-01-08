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

