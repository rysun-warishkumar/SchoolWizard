USE schoolwizard;

-- Front CMS Pages Table (created first as it's referenced by menu_items)
CREATE TABLE IF NOT EXISTS front_cms_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_title VARCHAR(255) NOT NULL,
    page_type ENUM('standard', 'event', 'news', 'gallery') DEFAULT 'standard',
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page_type (page_type),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Menus Table
CREATE TABLE IF NOT EXISTS front_cms_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Menu Items Table
CREATE TABLE IF NOT EXISTS front_cms_menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_id INT NOT NULL,
    parent_id INT NULL,
    menu_item VARCHAR(255) NOT NULL,
    external_url VARCHAR(500),
    open_in_new_tab BOOLEAN DEFAULT FALSE,
    page_id INT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES front_cms_menus(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES front_cms_menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES front_cms_pages(id) ON DELETE SET NULL,
    INDEX idx_menu_id (menu_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Events Table (Public Events)
CREATE TABLE IF NOT EXISTS front_cms_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_venue VARCHAR(255),
    event_start_date DATE NOT NULL,
    event_end_date DATE,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_start_date (event_start_date),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Galleries Table
CREATE TABLE IF NOT EXISTS front_cms_galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_title VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Gallery Images Table
CREATE TABLE IF NOT EXISTS front_cms_gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_title VARCHAR(255),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gallery_id) REFERENCES front_cms_galleries(id) ON DELETE CASCADE,
    INDEX idx_gallery_id (gallery_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS News Table
CREATE TABLE IF NOT EXISTS front_cms_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_title VARCHAR(255) NOT NULL,
    news_date DATE NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_keyword VARCHAR(500),
    meta_description TEXT,
    sidebar_enabled BOOLEAN DEFAULT TRUE,
    featured_image VARCHAR(500),
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_news_date (news_date),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Media Table
CREATE TABLE IF NOT EXISTS front_cms_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type ENUM('image', 'document', 'video') NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    youtube_url VARCHAR(500),
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_type (file_type),
    INDEX idx_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Front CMS Banner Images Table
CREATE TABLE IF NOT EXISTS front_cms_banner_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    image_title VARCHAR(255),
    image_link VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

