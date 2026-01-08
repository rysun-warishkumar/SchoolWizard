-- Email Settings Table
-- This table stores SMTP configuration for sending emails

USE schoolwizard;

CREATE TABLE IF NOT EXISTS email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL DEFAULT 587,
    smtp_secure TINYINT(1) DEFAULT 0 COMMENT '0 for TLS, 1 for SSL',
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    is_enabled TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default email settings (disabled by default)
INSERT INTO email_settings (smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password, from_email, from_name, is_enabled)
VALUES ('smtp.gmail.com', 587, 0, '', '', '', 'SchoolWizard', 0)
ON DUPLICATE KEY UPDATE smtp_host = smtp_host;

