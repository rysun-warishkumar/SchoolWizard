-- About Us Page Content Tables

-- Mission & Vision Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_mission_vision (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mission_content TEXT NOT NULL,
  vision_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mission_vision (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Counter/Stats Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_counters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  counter_number VARCHAR(50) NOT NULL,
  counter_label VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- History Content Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  history_content TEXT NOT NULL,
  history_image VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_history (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Core Values Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  icon_class VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_year VARCHAR(20) NOT NULL,
  achievement_title VARCHAR(255) NOT NULL,
  achievement_description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leadership Table
CREATE TABLE IF NOT EXISTS front_cms_about_us_leadership (
  id INT PRIMARY KEY AUTO_INCREMENT,
  leader_name VARCHAR(255) NOT NULL,
  leader_role VARCHAR(255) NOT NULL,
  leader_bio TEXT NOT NULL,
  leader_image VARCHAR(255) NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort_order (sort_order),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Mission & Vision
INSERT INTO front_cms_about_us_mission_vision (mission_content, vision_content)
VALUES (
  'To provide a holistic education that nurtures the intellectual, physical, emotional, and social development of every student. We are committed to creating a learning environment that inspires curiosity, fosters creativity, and prepares students to become responsible global citizens.',
  'To be a leading educational institution recognized for academic excellence, innovative teaching methods, and the development of well-rounded individuals who contribute positively to society. We envision a school where every student realizes their full potential.'
)
ON DUPLICATE KEY UPDATE mission_content = mission_content;

-- Insert default History
INSERT INTO front_cms_about_us_history (history_content, history_image)
VALUES (
  'Founded in 1974, our school has been a beacon of educational excellence for over five decades. What started as a small institution with a vision to provide quality education has grown into one of the most respected schools in the region.\n\nOver the years, we have continuously evolved to meet the changing needs of education while maintaining our core values of excellence, integrity, and community. Our commitment to providing a well-rounded education has helped thousands of students achieve their dreams and make meaningful contributions to society.\n\nToday, we stand proud of our legacy while looking forward to an even brighter future. We continue to invest in modern facilities, innovative teaching methods, and comprehensive programs that prepare our students for the challenges and opportunities of the 21st century.',
  NULL
)
ON DUPLICATE KEY UPDATE history_content = history_content;

