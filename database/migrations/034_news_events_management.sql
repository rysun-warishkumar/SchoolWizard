-- News and Events Management Tables

-- News Table
CREATE TABLE IF NOT EXISTS news_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  featured_image VARCHAR(500) NULL,
  author VARCHAR(255) NULL,
  published_date DATE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_published_date (published_date),
  INDEX idx_is_active (is_active),
  INDEX idx_is_featured (is_featured),
  INDEX idx_slug (slug),
  UNIQUE KEY unique_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  event_date DATE NOT NULL,
  event_time TIME NULL,
  end_date DATE NULL,
  end_time TIME NULL,
  venue VARCHAR(255) NULL,
  featured_image VARCHAR(500) NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_event_date (event_date),
  INDEX idx_is_active (is_active),
  INDEX idx_is_featured (is_featured),
  INDEX idx_slug (slug),
  UNIQUE KEY unique_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample news
INSERT INTO news_articles (title, slug, excerpt, content, category, author, published_date, is_featured, is_active)
VALUES
  ('Annual Science Fair 2024 - A Grand Success', 'annual-science-fair-2024', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking.', 'Students showcased innovative projects and experiments at our annual science fair, demonstrating creativity and scientific thinking. The event featured over 50 projects covering various scientific disciplines including physics, chemistry, biology, and environmental science.', 'academic', 'School Admin', CURDATE(), TRUE, TRUE),
  ('Basketball Team Wins Regional Championship', 'basketball-team-wins-regional-championship', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution.', 'Our school basketball team emerged victorious in the regional championship, bringing home the trophy and pride to our institution. The team displayed exceptional teamwork and determination throughout the tournament.', 'sports', 'Sports Department', DATE_SUB(CURDATE(), INTERVAL 5 DAY), FALSE, TRUE)
ON DUPLICATE KEY UPDATE title = title;

-- Insert sample events
INSERT INTO events (title, slug, description, category, event_date, event_time, venue, is_featured, is_active)
VALUES
  ('Annual Sports Day', 'annual-sports-day-2025', 'Join us for our annual sports day featuring exciting competitions, races, and team events. All students, parents, and staff are welcome.', 'Sports', DATE_ADD(CURDATE(), INTERVAL 20 DAY), '09:00:00', 'School Grounds', TRUE, TRUE),
  ('Science Exhibition', 'science-exhibition-2025', 'Students showcase innovative science projects and experiments. Open to all visitors interested in scientific exploration.', 'Academic', DATE_ADD(CURDATE(), INTERVAL 25 DAY), '10:00:00', 'School Auditorium', FALSE, TRUE)
ON DUPLICATE KEY UPDATE title = title;

