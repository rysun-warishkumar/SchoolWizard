-- Fees Collection Module Tables
-- Fees Type, Fees Group, Fees Master, Fees Discount, Fees Collection, Fees Reminder

USE schoolwizard;

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

