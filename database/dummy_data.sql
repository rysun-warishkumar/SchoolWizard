-- ============================================================================
-- SchoolWizard Database - Dummy Data
-- This file contains dummy data for testing purposes
-- ============================================================================
-- IMPORTANT: Make sure the database schema is set up before running this file
-- ============================================================================

USE schoolwizard;

-- ============================================================================
-- Dummy Data for Students (5 students in 3 different classes)
-- ============================================================================

-- First, let's get the current session ID (assuming 2024-25 session exists)
SET @current_session_id = (SELECT id FROM sessions WHERE is_current = 1 LIMIT 1);

-- Get class IDs (get first 3 classes - adjust if needed)
SET @class_1_id = (SELECT id FROM classes ORDER BY id LIMIT 1);
SET @class_2_id = (SELECT id FROM classes ORDER BY id LIMIT 1 OFFSET 1);
SET @class_3_id = (SELECT id FROM classes ORDER BY id LIMIT 1 OFFSET 2);

-- If we don't have 3 classes, use the first class for all
SET @class_2_id = IFNULL(@class_2_id, @class_1_id);
SET @class_3_id = IFNULL(@class_3_id, @class_1_id);

-- Get section IDs (get first 3 sections - adjust if needed)
SET @section_1_id = (SELECT id FROM sections ORDER BY id LIMIT 1);
SET @section_2_id = (SELECT id FROM sections ORDER BY id LIMIT 1 OFFSET 1);
SET @section_3_id = (SELECT id FROM sections ORDER BY id LIMIT 1 OFFSET 2);

-- If we don't have 3 sections, use the first section for all
SET @section_2_id = IFNULL(@section_2_id, @section_1_id);
SET @section_3_id = IFNULL(@section_3_id, @section_1_id);

-- Insert 5 Students
INSERT INTO students (
    admission_no, roll_no, class_id, section_id, session_id,
    first_name, last_name, gender, date_of_birth, admission_date,
    student_mobile, email, father_name, father_phone, father_email,
    mother_name, mother_phone, mother_email, is_active
) VALUES
-- Student 1 - Class 1
('STU-2024-001', 'R001', @class_1_id, @section_1_id, @current_session_id,
 'Rahul', 'Sharma', 'male', '2010-05-15', '2024-04-01',
 '9876543210', 'rahul.sharma@example.com',
 'Rajesh Sharma', '9876543211', 'rajesh.sharma@example.com',
 'Priya Sharma', '9876543212', 'priya.sharma@example.com', 1),

-- Student 2 - Class 1
('STU-2024-002', 'R002', @class_1_id, @section_1_id, @current_session_id,
 'Priya', 'Patel', 'female', '2010-08-20', '2024-04-01',
 '9876543213', 'priya.patel@example.com',
 'Amit Patel', '9876543214', 'amit.patel@example.com',
 'Sunita Patel', '9876543215', 'sunita.patel@example.com', 1),

-- Student 3 - Class 2
('STU-2024-003', 'R003', @class_2_id, @section_2_id, @current_session_id,
 'Arjun', 'Kumar', 'male', '2009-03-10', '2024-04-01',
 '9876543216', 'arjun.kumar@example.com',
 'Vikash Kumar', '9876543217', 'vikash.kumar@example.com',
 'Meera Kumar', '9876543218', 'meera.kumar@example.com', 1),

-- Student 4 - Class 2
('STU-2024-004', 'R004', @class_2_id, @section_2_id, @current_session_id,
 'Ananya', 'Singh', 'female', '2009-11-25', '2024-04-01',
 '9876543219', 'ananya.singh@example.com',
 'Ravi Singh', '9876543220', 'ravi.singh@example.com',
 'Kavita Singh', '9876543221', 'kavita.singh@example.com', 1),

-- Student 5 - Class 3
('STU-2024-005', 'R005', @class_3_id, @section_3_id, @current_session_id,
 'Vikram', 'Gupta', 'male', '2008-07-12', '2024-04-01',
 '9876543222', 'vikram.gupta@example.com',
 'Suresh Gupta', '9876543223', 'suresh.gupta@example.com',
 'Neeta Gupta', '9876543224', 'neeta.gupta@example.com', 1)

ON DUPLICATE KEY UPDATE admission_no = admission_no;

-- ============================================================================
-- Dummy Data for Staff (10 staff members: 5 teachers + 5 other staff)
-- ============================================================================

-- Get role IDs
SET @teacher_role_id = (SELECT id FROM roles WHERE name = 'teacher' LIMIT 1);
SET @librarian_role_id = (SELECT id FROM roles WHERE name = 'librarian' LIMIT 1);
SET @accountant_role_id = (SELECT id FROM roles WHERE name = 'accountant' LIMIT 1);
SET @receptionist_role_id = (SELECT id FROM roles WHERE name = 'receptionist' LIMIT 1);

-- Get or create departments (if they don't exist, create them)
INSERT INTO departments (name, description) VALUES
('Academic', 'Academic Department'),
('Administration', 'Administration Department'),
('Library', 'Library Department'),
('Accounts', 'Accounts Department'),
('Front Office', 'Front Office Department')
ON DUPLICATE KEY UPDATE name = name;

SET @academic_dept_id = (SELECT id FROM departments WHERE name = 'Academic' LIMIT 1);
SET @admin_dept_id = (SELECT id FROM departments WHERE name = 'Administration' LIMIT 1);
SET @library_dept_id = (SELECT id FROM departments WHERE name = 'Library' LIMIT 1);
SET @accounts_dept_id = (SELECT id FROM departments WHERE name = 'Accounts' LIMIT 1);
SET @front_office_dept_id = (SELECT id FROM departments WHERE name = 'Front Office' LIMIT 1);

-- Get or create designations (if they don't exist, create them)
INSERT INTO designations (name, description) VALUES
('Senior Teacher', 'Senior Teacher'),
('Teacher', 'Teacher'),
('Librarian', 'Librarian'),
('Senior Accountant', 'Senior Accountant'),
('Accountant', 'Accountant'),
('Receptionist', 'Receptionist'),
('Administrative Officer', 'Administrative Officer')
ON DUPLICATE KEY UPDATE name = name;

SET @senior_teacher_desig_id = (SELECT id FROM designations WHERE name = 'Senior Teacher' LIMIT 1);
SET @teacher_desig_id = (SELECT id FROM designations WHERE name = 'Teacher' LIMIT 1);
SET @librarian_desig_id = (SELECT id FROM designations WHERE name = 'Librarian' LIMIT 1);
SET @senior_accountant_desig_id = (SELECT id FROM designations WHERE name = 'Senior Accountant' LIMIT 1);
SET @accountant_desig_id = (SELECT id FROM designations WHERE name = 'Accountant' LIMIT 1);
SET @receptionist_desig_id = (SELECT id FROM designations WHERE name = 'Receptionist' LIMIT 1);
SET @admin_officer_desig_id = (SELECT id FROM designations WHERE name = 'Administrative Officer' LIMIT 1);

-- Insert 10 Staff Members (5 Teachers + 5 Other Staff)
INSERT INTO staff (
    staff_id, role_id, designation_id, department_id,
    first_name, last_name, gender, date_of_birth, date_of_joining,
    phone, email, father_name, mother_name,
    current_address, qualification, is_active
) VALUES
-- Teachers (5)
('STF-2024-001', @teacher_role_id, @senior_teacher_desig_id, @academic_dept_id,
 'Rajesh', 'Kumar', 'male', '1985-03-15', '2020-04-01',
 '9876500001', 'rajesh.kumar@school.com',
 'Suresh Kumar', 'Kamla Devi',
 '123 Main Street, City', 'M.Sc. Mathematics, B.Ed.', 1),

('STF-2024-002', @teacher_role_id, @teacher_desig_id, @academic_dept_id,
 'Sunita', 'Sharma', 'female', '1988-07-20', '2021-04-01',
 '9876500002', 'sunita.sharma@school.com',
 'Ramesh Sharma', 'Geeta Sharma',
 '456 Park Avenue, City', 'M.A. English, B.Ed.', 1),

('STF-2024-003', @teacher_role_id, @teacher_desig_id, @academic_dept_id,
 'Amit', 'Patel', 'male', '1990-11-10', '2022-04-01',
 '9876500003', 'amit.patel@school.com',
 'Mahesh Patel', 'Lata Patel',
 '789 Garden Road, City', 'M.Sc. Physics, B.Ed.', 1),

('STF-2024-004', @teacher_role_id, @teacher_desig_id, @academic_dept_id,
 'Priya', 'Singh', 'female', '1987-05-25', '2021-04-01',
 '9876500004', 'priya.singh@school.com',
 'Vikash Singh', 'Meera Singh',
 '321 Oak Street, City', 'M.A. History, B.Ed.', 1),

('STF-2024-005', @teacher_role_id, @senior_teacher_desig_id, @academic_dept_id,
 'Vikram', 'Gupta', 'male', '1983-09-12', '2019-04-01',
 '9876500005', 'vikram.gupta@school.com',
 'Ravi Gupta', 'Kavita Gupta',
 '654 Pine Lane, City', 'M.Sc. Chemistry, B.Ed.', 1),

-- Other Staff (5)
('STF-2024-006', @librarian_role_id, @librarian_desig_id, @library_dept_id,
 'Meera', 'Joshi', 'female', '1986-02-18', '2020-04-01',
 '9876500006', 'meera.joshi@school.com',
 'Suresh Joshi', 'Kamla Joshi',
 '987 Library Street, City', 'M.Lib, B.A.', 1),

('STF-2024-007', @accountant_role_id, @senior_accountant_desig_id, @accounts_dept_id,
 'Ravi', 'Verma', 'male', '1984-06-30', '2019-04-01',
 '9876500007', 'ravi.verma@school.com',
 'Rajesh Verma', 'Sunita Verma',
 '147 Finance Avenue, City', 'M.Com, CA', 1),

('STF-2024-008', @accountant_role_id, @accountant_desig_id, @accounts_dept_id,
 'Kavita', 'Yadav', 'female', '1991-12-05', '2022-04-01',
 '9876500008', 'kavita.yadav@school.com',
 'Amit Yadav', 'Priya Yadav',
 '258 Accounts Road, City', 'B.Com, M.Com', 1),

('STF-2024-009', @receptionist_role_id, @receptionist_desig_id, @front_office_dept_id,
 'Anjali', 'Mishra', 'female', '1992-04-22', '2023-04-01',
 '9876500009', 'anjali.mishra@school.com',
 'Vikash Mishra', 'Meera Mishra',
 '369 Reception Street, City', 'B.A., Diploma in Office Management', 1),

('STF-2024-010', @receptionist_role_id, @admin_officer_desig_id, @admin_dept_id,
 'Suresh', 'Tiwari', 'male', '1989-08-14', '2021-04-01',
 '9876500010', 'suresh.tiwari@school.com',
 'Ramesh Tiwari', 'Geeta Tiwari',
 '741 Admin Lane, City', 'M.B.A., B.A.', 1)

ON DUPLICATE KEY UPDATE staff_id = staff_id;

-- ============================================================================
-- Summary
-- ============================================================================
-- Students: 5 students inserted across 3 classes
-- Staff: 10 staff members inserted (5 teachers + 5 other staff)
-- ============================================================================

