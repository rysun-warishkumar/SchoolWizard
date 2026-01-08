-- RBAC (Role-Based Access Control) System
-- This migration creates tables for managing module permissions per role

-- Modules table - defines all available modules in the system
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Module identifier (e.g., students, fees, attendance)',
    display_name VARCHAR(200) NOT NULL COMMENT 'Human-readable module name',
    description TEXT COMMENT 'Module description',
    icon VARCHAR(50) COMMENT 'Icon identifier for UI',
    route_path VARCHAR(200) COMMENT 'Frontend route path',
    parent_module_id INT NULL COMMENT 'For sub-modules, reference to parent module',
    display_order INT DEFAULT 0 COMMENT 'Order for displaying in sidebar',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether module is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_module_id) REFERENCES modules(id) ON DELETE SET NULL,
    INDEX idx_parent_module (parent_module_id),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table - defines all possible permissions
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission identifier (e.g., view, add, edit, delete)',
    display_name VARCHAR(200) NOT NULL COMMENT 'Human-readable permission name',
    description TEXT COMMENT 'Permission description',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role permissions table - links roles to modules and permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted BOOLEAN DEFAULT TRUE COMMENT 'Whether permission is granted (true) or denied (false)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_module_permission (role_id, module_id, permission_id),
    INDEX idx_role_id (role_id),
    INDEX idx_module_id (module_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT INTO permissions (name, display_name, description) VALUES
('view', 'View', 'View/Read access to module data'),
('add', 'Add', 'Create/Add new records'),
('edit', 'Edit', 'Update/Modify existing records'),
('delete', 'Delete', 'Remove/Delete records')
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Insert default modules (27 admin modules)
INSERT INTO modules (name, display_name, description, icon, route_path, display_order) VALUES
('dashboard', 'Dashboard', 'Main dashboard overview', '📊', '/dashboard', 1),
('front-office', 'Front Office', 'Reception and front office activities', '🏢', '/front-office', 2),
('students', 'Student Information', 'Student search, profile, admission, history', '👥', '/students', 3),
('fees', 'Fees Collection', 'Fees collection, fees master, dues, reports', '💰', '/fees', 4),
('income', 'Income', 'Income management (other than fees)', '📈', '/income', 5),
('expenses', 'Expenses', 'School expense management', '📉', '/expenses', 6),
('attendance', 'Attendance', 'Student attendance and reports', '✅', '/attendance', 7),
('examinations', 'Examinations', 'Exam creation, scheduling, marks entry, grading', '📋', '/examinations', 8),
('online-examinations', 'Online Examinations', 'Online exam management', '💻', '/online-examinations', 9),
('lesson-plan', 'Lesson Plan', 'Subject status and lesson plan management', '📚', '/lesson-plan', 10),
('academics', 'Academics', 'Classes, sections, subjects, teacher assignment, timetable, student promotion', '🎓', '/academics', 11),
('hr', 'Human Resource', 'Staff information, attendance, payroll, leaves', '👔', '/hr', 12),
('communicate', 'Communicate', 'Messaging system for students, parents, and teachers', '📧', '/communicate', 13),
('download-center', 'Download Center', 'Document management (assignments, study material, syllabus)', '📥', '/download-center', 14),
('homework', 'Homework', 'Homework assignment and evaluation', '📝', '/homework', 15),
('library', 'Library', 'Library book management', '📖', '/library', 16),
('inventory', 'Inventory', 'School assets and stock management', '📦', '/inventory', 17),
('transport', 'Transport', 'Transportation routes and fares', '🚌', '/transport', 18),
('hostel', 'Hostel', 'Hostel rooms and fare management', '🏠', '/hostel', 19),
('certificate', 'Certificate', 'Student certificate and ID card design/generation', '📜', '/certificate', 20),
('front-cms', 'Front CMS', 'Public website management (pages, menus, events, gallery, news)', '🌐', '/front-cms', 21),
('alumni', 'Alumni', 'Alumni records and events', '🎓', '/alumni', 22),
('reports', 'Reports', 'Various reports from different modules', '📊', '/reports', 23),
('settings', 'System Settings', 'School configuration, sessions, admin password, SMS, payment gateways, backup/restore, languages', '⚙️', '/settings', 24),
('calendar', 'Calendar & ToDo List', 'Daily/monthly activities and task management', '📅', '/calendar', 25),
('chat', 'Chat', 'Two-way messaging for staff and students', '💬', '/chat', 26),
('users', 'User Management', 'Manage system users and roles', '👤', '/users', 27),
('roles', 'Roles & Permissions', 'Manage roles and permissions', '🔐', '/roles', 28)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name), description=VALUES(description);

-- Grant full permissions to superadmin role (role_id = 1) for all modules
INSERT INTO role_permissions (role_id, module_id, permission_id, granted)
SELECT 1, m.id, p.id, TRUE
FROM modules m
CROSS JOIN permissions p
WHERE m.is_active = TRUE
ON DUPLICATE KEY UPDATE granted=TRUE;

-- Grant view permission to all roles for dashboard
INSERT INTO role_permissions (role_id, module_id, permission_id, granted)
SELECT r.id, m.id, p.id, TRUE
FROM roles r
CROSS JOIN modules m
CROSS JOIN permissions p
WHERE m.name = 'dashboard' AND p.name = 'view'
ON DUPLICATE KEY UPDATE granted=TRUE;

