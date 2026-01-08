USE schoolwizard;

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

