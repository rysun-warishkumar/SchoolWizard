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
