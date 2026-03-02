-- Marketing Inquiries Table (enquiries from marketing website: Contact & Get Started forms)
CREATE TABLE IF NOT EXISTS marketing_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NULL,
  message TEXT NULL,
  company VARCHAR(255) NULL,
  enquiry_type ENUM('contact', 'get_started') DEFAULT 'contact',
  status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiry_type (enquiry_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
