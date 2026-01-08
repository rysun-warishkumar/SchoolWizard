USE schoolwizard;

-- Notice Board Table
CREATE TABLE IF NOT EXISTS notice_board (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notice_date DATE NOT NULL,
    publish_date DATE NOT NULL,
    message_to ENUM('students', 'guardians', 'staff', 'all') DEFAULT 'all',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notice_date (notice_date),
    INDEX idx_publish_date (publish_date),
    INDEX idx_message_to (message_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Log Table
CREATE TABLE IF NOT EXISTS email_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type ENUM('students', 'guardians', 'staff', 'individual', 'class', 'birthday') NOT NULL,
    recipient_ids TEXT,
    recipient_emails TEXT,
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMS Log Table
CREATE TABLE IF NOT EXISTS sms_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_type ENUM('students', 'guardians', 'staff', 'individual', 'class', 'birthday') NOT NULL,
    recipient_ids TEXT,
    recipient_phones TEXT,
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    error_message TEXT,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipient_type (recipient_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

