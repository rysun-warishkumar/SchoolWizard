-- Examinations Module Tables
-- Marks Grade, Exam Groups, Exams, Exam Subjects, Exam Marks, Exam Results, Admit Cards, Marksheets

USE schoolwizard;

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

