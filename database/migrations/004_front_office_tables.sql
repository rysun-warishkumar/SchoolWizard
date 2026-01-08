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

