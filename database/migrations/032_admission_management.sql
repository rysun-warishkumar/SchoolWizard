-- Admission Management Tables

-- Admission Inquiries Table (submissions from public website)
CREATE TABLE IF NOT EXISTS admission_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_name VARCHAR(255) NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  previous_school VARCHAR(255) NULL,
  address TEXT NOT NULL,
  message TEXT NULL,
  status ENUM('pending', 'contacted', 'approved', 'rejected') DEFAULT 'pending',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Important Dates Table
CREATE TABLE IF NOT EXISTS admission_important_dates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  date_value DATE NOT NULL,
  description TEXT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admission Contact Details Table
CREATE TABLE IF NOT EXISTS admission_contact_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  call_us_numbers TEXT NULL, -- JSON array of phone numbers
  email_us_addresses TEXT NULL, -- JSON array of email addresses
  visit_us_address TEXT NULL,
  office_hours TEXT NULL,
  important_dates_visible BOOLEAN DEFAULT TRUE,
  contact_details_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_contact_details (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default contact details
INSERT INTO admission_contact_details (
  call_us_numbers,
  email_us_addresses,
  visit_us_address,
  office_hours,
  important_dates_visible,
  contact_details_visible
)
VALUES (
  '["+91 1234567890", "+91 9876543210"]',
  '["admissions@schoolname.edu", "info@schoolname.edu"]',
  'School Address, City\nState - PIN Code',
  'Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM',
  TRUE,
  TRUE
)
ON DUPLICATE KEY UPDATE call_us_numbers = call_us_numbers;

-- Insert default important dates
INSERT INTO admission_important_dates (title, date_value, description, sort_order, is_active)
VALUES
  ('Application Start', '2025-01-01', 'Admission applications open for the new academic year', 1, TRUE),
  ('Last Date', '2025-03-31', 'Last date to submit admission applications', 2, TRUE),
  ('Assessment', '2025-04-15', 'Student assessment and interaction sessions (April 15-30, 2025)', 3, TRUE),
  ('Result Declaration', '2025-05-15', 'Admission results will be announced', 4, TRUE)
ON DUPLICATE KEY UPDATE title = title;

