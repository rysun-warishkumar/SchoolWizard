-- ============================================================================
-- Phase 1: Multi-tenant foundation – schools table, school_id on users and tenant tables
-- Plan: docs/SCHOOL_REGISTRATION_AND_TRIAL_PLAN.md
-- ============================================================================
-- Run this migration on your database (e.g. schoolwizard or u524544702_schoolwizard).
-- Steps: 1) Create schools table and default school
--        2) Add school_id to users (nullable for platform superadmin)
--        3) Add school_id to all tenant tables and backfill existing data to default school
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create schools table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    status ENUM('trial','active','expired','suspended') NOT NULL DEFAULT 'active',
    trial_starts_at TIMESTAMP NULL,
    trial_ends_at TIMESTAMP NULL,
    custom_domain VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slug (slug),
    INDEX idx_status (status),
    INDEX idx_trial_ends_at (trial_ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default school for existing data (single-tenant migration)
INSERT INTO schools (id, name, slug, status, trial_starts_at, trial_ends_at, custom_domain, created_at, updated_at)
SELECT 1, 'Default School', 'default-school', 'active', NULL, NULL, NULL, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM schools LIMIT 1);

-- ----------------------------------------------------------------------------
-- 2. Add school_id to users (nullable: NULL = platform superadmin)
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN school_id INT NULL AFTER role_id,
    ADD INDEX idx_school_id (school_id),
    ADD CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE RESTRICT;

-- Backfill: assign all existing users to default school
UPDATE users SET school_id = 1 WHERE school_id IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Tenant tables: add school_id, backfill, set NOT NULL, add FK
--    Order: add column nullable -> update -> modify NOT NULL -> add FK (where supported)
-- ----------------------------------------------------------------------------

-- Helper: add school_id to a table (run per table; backfill and constrain in next block)
-- We add column, backfill, then alter to NOT NULL and add FK in one migration.

SET @default_school_id = 1;

-- List of tenant tables (excluding roles, schools, modules, permissions, role_permissions, languages, users)
-- We add school_id to each, backfill, then set NOT NULL and add FK.

-- Sessions (academic year) – also fix unique: (school_id, name)
ALTER TABLE sessions ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE sessions SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE sessions MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE sessions DROP INDEX name, ADD UNIQUE KEY unique_school_name (school_id, name);
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Classes
ALTER TABLE classes ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE classes SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE classes MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE classes ADD CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Sections
ALTER TABLE sections ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE sections SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE sections MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE sections ADD CONSTRAINT fk_sections_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Class_sections (depends on classes, sections – already have school_id)
ALTER TABLE class_sections ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE class_sections SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE class_sections MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE class_sections ADD CONSTRAINT fk_class_sections_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Email_settings
ALTER TABLE email_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE email_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE email_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE email_settings ADD CONSTRAINT fk_email_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Sms_settings
ALTER TABLE sms_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE sms_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE sms_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE sms_settings ADD CONSTRAINT fk_sms_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Notification_settings – unique per school: (school_id, event_name)
ALTER TABLE notification_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE notification_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE notification_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE notification_settings DROP INDEX event_name, ADD UNIQUE KEY unique_school_event_name (school_id, event_name);
ALTER TABLE notification_settings ADD CONSTRAINT fk_notification_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Payment_gateways
ALTER TABLE payment_gateways ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE payment_gateways SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE payment_gateways MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE payment_gateways ADD CONSTRAINT fk_payment_gateways_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- General_settings – unique per school: (school_id, setting_key)
ALTER TABLE general_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE general_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE general_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE general_settings DROP INDEX setting_key, ADD UNIQUE KEY unique_school_setting_key (school_id, setting_key);
ALTER TABLE general_settings ADD CONSTRAINT fk_general_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Print_settings
ALTER TABLE print_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE print_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE print_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE print_settings ADD CONSTRAINT fk_print_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Front_cms_settings
ALTER TABLE front_cms_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_settings ADD CONSTRAINT fk_front_cms_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Custom_fields
ALTER TABLE custom_fields ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE custom_fields SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE custom_fields MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE custom_fields ADD CONSTRAINT fk_custom_fields_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- System_fields
ALTER TABLE system_fields ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE system_fields SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE system_fields MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE system_fields ADD CONSTRAINT fk_system_fields_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Backup_records
ALTER TABLE backup_records ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE backup_records SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE backup_records MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE backup_records ADD CONSTRAINT fk_backup_records_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Backup_settings
ALTER TABLE backup_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE backup_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE backup_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE backup_settings ADD CONSTRAINT fk_backup_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Subjects
ALTER TABLE subjects ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE subjects SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE subjects MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE subjects ADD CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Subject_groups
ALTER TABLE subject_groups ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE subject_groups SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE subject_groups MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE subject_groups ADD CONSTRAINT fk_subject_groups_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Subject_group_subjects
ALTER TABLE subject_group_subjects ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE subject_group_subjects SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE subject_group_subjects MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE subject_group_subjects ADD CONSTRAINT fk_subject_group_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Class_teachers
ALTER TABLE class_teachers ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE class_teachers SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE class_teachers MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE class_teachers ADD CONSTRAINT fk_class_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Class_timetable
ALTER TABLE class_timetable ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE class_timetable SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE class_timetable MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE class_timetable ADD CONSTRAINT fk_class_timetable_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Student_categories
ALTER TABLE student_categories ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_categories SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_categories MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_categories ADD CONSTRAINT fk_student_categories_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Student_houses
ALTER TABLE student_houses ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_houses SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_houses MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_houses ADD CONSTRAINT fk_student_houses_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Disable_reasons
ALTER TABLE disable_reasons ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE disable_reasons SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE disable_reasons MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE disable_reasons ADD CONSTRAINT fk_disable_reasons_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Students
ALTER TABLE students ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE students SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE students MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE students ADD CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Student_documents
ALTER TABLE student_documents ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_documents SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_documents MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_documents ADD CONSTRAINT fk_student_documents_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Online_admissions
ALTER TABLE online_admissions ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_admissions SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_admissions MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_admissions ADD CONSTRAINT fk_online_admissions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Front_office tables
ALTER TABLE front_office_purposes ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_office_purposes SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_office_purposes MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_office_purposes ADD CONSTRAINT fk_front_office_purposes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_office_complain_types ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_office_complain_types SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_office_complain_types MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_office_complain_types ADD CONSTRAINT fk_front_office_complain_types_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_office_sources ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_office_sources SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_office_sources MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_office_sources ADD CONSTRAINT fk_front_office_sources_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_office_references ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_office_references SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_office_references MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_office_references ADD CONSTRAINT fk_front_office_references_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE admission_enquiries ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE admission_enquiries SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE admission_enquiries MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE admission_enquiries ADD CONSTRAINT fk_admission_enquiries_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE enquiry_follow_ups ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE enquiry_follow_ups SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE enquiry_follow_ups MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE enquiry_follow_ups ADD CONSTRAINT fk_enquiry_follow_ups_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE visitors ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE visitors SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE visitors MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE visitors ADD CONSTRAINT fk_visitors_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE phone_call_logs ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE phone_call_logs SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE phone_call_logs MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE phone_call_logs ADD CONSTRAINT fk_phone_call_logs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE postal_dispatch ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE postal_dispatch SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE postal_dispatch MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE postal_dispatch ADD CONSTRAINT fk_postal_dispatch_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE postal_receive ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE postal_receive SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE postal_receive MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE postal_receive ADD CONSTRAINT fk_postal_receive_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE complains ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE complains SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE complains MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE complains ADD CONSTRAINT fk_complains_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- HR
ALTER TABLE departments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE departments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE departments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE departments ADD CONSTRAINT fk_departments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE designations ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE designations SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE designations MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE designations ADD CONSTRAINT fk_designations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE leave_types ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE leave_types SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE leave_types MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE leave_types ADD CONSTRAINT fk_leave_types_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE staff ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE staff SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE staff MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE staff ADD CONSTRAINT fk_staff_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE staff_documents ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE staff_documents SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE staff_documents MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE staff_documents ADD CONSTRAINT fk_staff_documents_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE staff_attendance ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE staff_attendance SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE staff_attendance MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE staff_attendance ADD CONSTRAINT fk_staff_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE leave_requests ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE leave_requests SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE leave_requests MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE leave_requests ADD CONSTRAINT fk_leave_requests_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE payroll ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE payroll SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE payroll MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE payroll ADD CONSTRAINT fk_payroll_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE payroll_earnings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE payroll_earnings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE payroll_earnings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE payroll_earnings ADD CONSTRAINT fk_payroll_earnings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE payroll_deductions ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE payroll_deductions SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE payroll_deductions MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE payroll_deductions ADD CONSTRAINT fk_payroll_deductions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE teacher_ratings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE teacher_ratings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE teacher_ratings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE teacher_ratings ADD CONSTRAINT fk_teacher_ratings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Fees
ALTER TABLE fees_types ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_types SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_types MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_types ADD CONSTRAINT fk_fees_types_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_groups ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_groups SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_groups MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_groups ADD CONSTRAINT fk_fees_groups_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_group_types ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_group_types SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_group_types MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_group_types ADD CONSTRAINT fk_fees_group_types_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_master ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_master SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_master MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_master ADD CONSTRAINT fk_fees_master_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_group_assignments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_group_assignments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_group_assignments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_group_assignments ADD CONSTRAINT fk_fees_group_assignments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_discounts ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_discounts SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_discounts MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_discounts ADD CONSTRAINT fk_fees_discounts_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_discount_assignments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_discount_assignments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_discount_assignments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_discount_assignments ADD CONSTRAINT fk_fees_discount_assignments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_invoices ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_invoices SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_invoices MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_invoices ADD CONSTRAINT fk_fees_invoices_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_payments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_payments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_payments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_payments ADD CONSTRAINT fk_fees_payments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_discount_applications ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_discount_applications SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_discount_applications MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_discount_applications ADD CONSTRAINT fk_fees_discount_applications_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_carry_forward ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_carry_forward SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_carry_forward MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_carry_forward ADD CONSTRAINT fk_fees_carry_forward_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_reminder_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_reminder_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_reminder_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_reminder_settings ADD CONSTRAINT fk_fees_reminder_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE fees_reminder_logs ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE fees_reminder_logs SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE fees_reminder_logs MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE fees_reminder_logs ADD CONSTRAINT fk_fees_reminder_logs_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Income / Expenses
ALTER TABLE income_heads ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE income_heads SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE income_heads MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE income_heads ADD CONSTRAINT fk_income_heads_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE income ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE income SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE income MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE income ADD CONSTRAINT fk_income_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE expense_heads ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE expense_heads SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE expense_heads MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE expense_heads ADD CONSTRAINT fk_expense_heads_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE expenses ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE expenses SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE expenses MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Attendance
ALTER TABLE student_attendance ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_attendance SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_attendance MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_attendance ADD CONSTRAINT fk_student_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE student_attendance_periods ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_attendance_periods SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_attendance_periods MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_attendance_periods ADD CONSTRAINT fk_student_attendance_periods_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE student_leave_requests ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE student_leave_requests SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE student_leave_requests MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE student_leave_requests ADD CONSTRAINT fk_student_leave_requests_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Examinations
ALTER TABLE marks_grades ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE marks_grades SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE marks_grades MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE marks_grades ADD CONSTRAINT fk_marks_grades_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exam_groups ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE exam_groups SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE exam_groups MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE exam_groups ADD CONSTRAINT fk_exam_groups_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exams ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE exams SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE exams MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE exams ADD CONSTRAINT fk_exams_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exam_students ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE exam_students SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE exam_students MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE exam_students ADD CONSTRAINT fk_exam_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exam_subjects ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE exam_subjects SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE exam_subjects MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE exam_subjects ADD CONSTRAINT fk_exam_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE exam_marks ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE exam_marks SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE exam_marks MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE exam_marks ADD CONSTRAINT fk_exam_marks_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE linked_exams ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE linked_exams SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE linked_exams MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE linked_exams ADD CONSTRAINT fk_linked_exams_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE admit_card_templates ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE admit_card_templates SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE admit_card_templates MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE admit_card_templates ADD CONSTRAINT fk_admit_card_templates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE marksheet_templates ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE marksheet_templates SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE marksheet_templates MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE marksheet_templates ADD CONSTRAINT fk_marksheet_templates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE question_bank ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE question_bank SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE question_bank MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE question_bank ADD CONSTRAINT fk_question_bank_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE online_exams ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_exams SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_exams MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_exams ADD CONSTRAINT fk_online_exams_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE online_exam_questions ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_exam_questions SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_exam_questions MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_exam_questions ADD CONSTRAINT fk_online_exam_questions_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE online_exam_students ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_exam_students SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_exam_students MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_exam_students ADD CONSTRAINT fk_online_exam_students_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE online_exam_attempts ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_exam_attempts SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_exam_attempts MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_exam_attempts ADD CONSTRAINT fk_online_exam_attempts_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE online_exam_answers ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE online_exam_answers SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE online_exam_answers MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE online_exam_answers ADD CONSTRAINT fk_online_exam_answers_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Homework
ALTER TABLE homework ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE homework SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE homework MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE homework ADD CONSTRAINT fk_homework_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE homework_evaluations ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE homework_evaluations SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE homework_evaluations MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE homework_evaluations ADD CONSTRAINT fk_homework_evaluations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Library
ALTER TABLE books ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE books SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE books MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE books ADD CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE library_members ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE library_members SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE library_members MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE library_members ADD CONSTRAINT fk_library_members_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE book_issues ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE book_issues SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE book_issues MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE book_issues ADD CONSTRAINT fk_book_issues_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Download, Communicate
ALTER TABLE download_contents ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE download_contents SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE download_contents MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE download_contents ADD CONSTRAINT fk_download_contents_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE notice_board ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE notice_board SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE notice_board MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE notice_board ADD CONSTRAINT fk_notice_board_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE email_log ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE email_log SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE email_log MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE email_log ADD CONSTRAINT fk_email_log_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE sms_log ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE sms_log SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE sms_log MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE sms_log ADD CONSTRAINT fk_sms_log_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Inventory
ALTER TABLE item_categories ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE item_categories SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE item_categories MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE item_categories ADD CONSTRAINT fk_item_categories_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE item_stores ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE item_stores SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE item_stores MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE item_stores ADD CONSTRAINT fk_item_stores_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE item_suppliers ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE item_suppliers SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE item_suppliers MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE item_suppliers ADD CONSTRAINT fk_item_suppliers_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE items ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE items SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE items MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE items ADD CONSTRAINT fk_items_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE item_stocks ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE item_stocks SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE item_stocks MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE item_stocks ADD CONSTRAINT fk_item_stocks_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE item_issues ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE item_issues SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE item_issues MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE item_issues ADD CONSTRAINT fk_item_issues_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Transport
ALTER TABLE routes ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE routes SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE routes MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE routes ADD CONSTRAINT fk_routes_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE vehicles ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE vehicles SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE vehicles MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE vehicle_assignments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE vehicle_assignments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE vehicle_assignments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE vehicle_assignments ADD CONSTRAINT fk_vehicle_assignments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Hostel
ALTER TABLE hostels ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE hostels SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE hostels MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE hostels ADD CONSTRAINT fk_hostels_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE room_types ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE room_types SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE room_types MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE room_types ADD CONSTRAINT fk_room_types_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE hostel_rooms ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE hostel_rooms SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE hostel_rooms MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE hostel_rooms ADD CONSTRAINT fk_hostel_rooms_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Certificate / ID card
ALTER TABLE certificate_templates ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE certificate_templates SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE certificate_templates MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE certificate_templates ADD CONSTRAINT fk_certificate_templates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE id_card_templates ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE id_card_templates SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE id_card_templates MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE id_card_templates ADD CONSTRAINT fk_id_card_templates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Calendar / Todo / Chat
ALTER TABLE calendar_events ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE calendar_events SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE calendar_events MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE todo_tasks ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE todo_tasks SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE todo_tasks MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE todo_tasks ADD CONSTRAINT fk_todo_tasks_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE chat_conversations ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE chat_conversations SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE chat_conversations MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE chat_conversations ADD CONSTRAINT fk_chat_conversations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE chat_messages ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE chat_messages SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE chat_messages MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_messages_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Alumni
ALTER TABLE alumni ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE alumni SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE alumni MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE alumni ADD CONSTRAINT fk_alumni_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE alumni_events ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE alumni_events SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE alumni_events MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE alumni_events ADD CONSTRAINT fk_alumni_events_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE alumni_event_registrations ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE alumni_event_registrations SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE alumni_event_registrations MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE alumni_event_registrations ADD CONSTRAINT fk_alumni_event_registrations_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Lesson plan
ALTER TABLE subject_status ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE subject_status SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE subject_status MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE subject_status ADD CONSTRAINT fk_subject_status_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE lesson_plans ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE lesson_plans SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE lesson_plans MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE lesson_plans ADD CONSTRAINT fk_lesson_plans_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE lesson_plan_topics ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE lesson_plan_topics SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE lesson_plan_topics MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE lesson_plan_topics ADD CONSTRAINT fk_lesson_plan_topics_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE lesson_plan_attachments ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE lesson_plan_attachments SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE lesson_plan_attachments MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE lesson_plan_attachments ADD CONSTRAINT fk_lesson_plan_attachments_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Front CMS (website)
ALTER TABLE front_cms_pages ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_pages SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_pages MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_pages ADD CONSTRAINT fk_front_cms_pages_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_menus ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_menus SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_menus MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_menus ADD CONSTRAINT fk_front_cms_menus_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_menu_items ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_menu_items SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_menu_items MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_menu_items ADD CONSTRAINT fk_front_cms_menu_items_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_events ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_events SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_events MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_events ADD CONSTRAINT fk_front_cms_events_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_galleries ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_galleries SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_galleries MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_galleries ADD CONSTRAINT fk_front_cms_galleries_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_gallery_images ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_gallery_images SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_gallery_images MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_gallery_images ADD CONSTRAINT fk_front_cms_gallery_images_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_news ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_news SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_news MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_news ADD CONSTRAINT fk_front_cms_news_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_media ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_media SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_media MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_media ADD CONSTRAINT fk_front_cms_media_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_banner_images ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_banner_images SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_banner_images MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_banner_images ADD CONSTRAINT fk_front_cms_banner_images_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_website_settings ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_website_settings SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_website_settings MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_website_settings ADD CONSTRAINT fk_front_cms_website_settings_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_banners ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_banners SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_banners MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_banners ADD CONSTRAINT fk_front_cms_banners_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_mission_vision ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_mission_vision SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_mission_vision MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_mission_vision ADD CONSTRAINT fk_front_cms_about_us_mission_vision_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_counters ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_counters SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_counters MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_counters ADD CONSTRAINT fk_front_cms_about_us_counters_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_history ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_history SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_history MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_history ADD CONSTRAINT fk_front_cms_about_us_history_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_values ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_values SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_values MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_values ADD CONSTRAINT fk_front_cms_about_us_values_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_achievements ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_achievements SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_achievements MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_achievements ADD CONSTRAINT fk_front_cms_about_us_achievements_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE front_cms_about_us_leadership ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE front_cms_about_us_leadership SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE front_cms_about_us_leadership MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE front_cms_about_us_leadership ADD CONSTRAINT fk_front_cms_about_us_leadership_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- Admission (front CMS) + Contact + Marketing + Gallery + News + Events
ALTER TABLE admission_inquiries ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE admission_inquiries SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE admission_inquiries MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE admission_inquiries ADD CONSTRAINT fk_admission_inquiries_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE admission_important_dates ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE admission_important_dates SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE admission_important_dates MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE admission_important_dates ADD CONSTRAINT fk_admission_important_dates_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE admission_contact_details ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE admission_contact_details SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE admission_contact_details MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE admission_contact_details ADD CONSTRAINT fk_admission_contact_details_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE contact_messages ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE contact_messages SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE contact_messages MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE contact_messages ADD CONSTRAINT fk_contact_messages_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE marketing_inquiries ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE marketing_inquiries SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE marketing_inquiries MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE marketing_inquiries ADD CONSTRAINT fk_marketing_inquiries_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE gallery_categories ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE gallery_categories SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE gallery_categories MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE gallery_categories ADD CONSTRAINT fk_gallery_categories_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE gallery_images ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE gallery_images SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE gallery_images MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE gallery_images ADD CONSTRAINT fk_gallery_images_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE news_articles ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE news_articles SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE news_articles MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE news_articles ADD CONSTRAINT fk_news_articles_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

ALTER TABLE events ADD COLUMN school_id INT NULL AFTER id, ADD INDEX idx_school_id (school_id);
UPDATE events SET school_id = @default_school_id WHERE school_id IS NULL;
ALTER TABLE events MODIFY COLUMN school_id INT NOT NULL;
ALTER TABLE events ADD CONSTRAINT fk_events_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

-- ============================================================================
-- Phase 1 complete. Tables roles, schools, modules, permissions, role_permissions, languages remain global.
-- ============================================================================
