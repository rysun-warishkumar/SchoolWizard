-- Backup and Restore Tables
-- This migration creates tables for managing database backups

USE schoolwizard;

-- Backup Records Table
CREATE TABLE IF NOT EXISTS backup_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT COMMENT 'File size in bytes',
    backup_type ENUM('manual', 'automatic') DEFAULT 'manual',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_backup_type (backup_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backup Settings Table
CREATE TABLE IF NOT EXISTS backup_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auto_backup_enabled TINYINT(1) DEFAULT 0,
    backup_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
    backup_time TIME DEFAULT '02:00:00',
    keep_backups INT DEFAULT 7 COMMENT 'Number of backups to keep',
    cron_secret_key VARCHAR(255) UNIQUE,
    last_backup_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default backup settings
INSERT INTO backup_settings (auto_backup_enabled, backup_frequency, backup_time, keep_backups) VALUES
(0, 'daily', '02:00:00', 7)
ON DUPLICATE KEY UPDATE auto_backup_enabled=auto_backup_enabled;

