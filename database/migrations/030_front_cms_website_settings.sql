-- Front CMS Website Settings Table
CREATE TABLE IF NOT EXISTS front_cms_website_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  website_logo VARCHAR(255) NULL,
  school_name VARCHAR(255) NOT NULL DEFAULT 'School Name',
  tag_line VARCHAR(255) NULL,
  tag_line_visible BOOLEAN DEFAULT TRUE,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(50) NULL,
  facebook_url VARCHAR(255) NULL,
  facebook_enabled BOOLEAN DEFAULT FALSE,
  twitter_url VARCHAR(255) NULL,
  twitter_enabled BOOLEAN DEFAULT FALSE,
  youtube_url VARCHAR(255) NULL,
  youtube_enabled BOOLEAN DEFAULT FALSE,
  instagram_url VARCHAR(255) NULL,
  instagram_enabled BOOLEAN DEFAULT FALSE,
  linkedin_url VARCHAR(255) NULL,
  linkedin_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_url VARCHAR(255) NULL,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_settings (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Banner Carousel Table
CREATE TABLE IF NOT EXISTS front_cms_banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_path VARCHAR(255) NOT NULL,
  button_text VARCHAR(100) NULL,
  button_url VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings (only if table is empty)
INSERT INTO front_cms_website_settings (school_name, tag_line, tag_line_visible, contact_email, contact_phone)
SELECT 'School Name', 'A School with a Difference', TRUE, 'info@schoolname.edu', '+91 1234567890'
WHERE NOT EXISTS (SELECT 1 FROM front_cms_website_settings);

