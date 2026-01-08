USE schoolwizard;

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

