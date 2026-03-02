import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { chatService } from '../../services/api/chatService';
import { profileService } from '../../services/api/profileService';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';

  // Get unread chat count - use same query key as Chat component to share cache
  // Only refetch if not on chat page (chat page handles its own refetching)
  const { data: conversations = [] } = useQuery(
    ['chat-conversations'],
    () => chatService.getConversations(),
    {
      enabled: !isChatPage, // Disable when on chat page to avoid duplicate calls
      refetchInterval: false, // Disabled automatic refetching
      refetchOnWindowFocus: false, // Disabled to prevent excessive calls
      refetchOnMount: true, // Only refetch on component mount
      staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    }
  );

  const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  // Get user permissions
  const { data: permissionsData } = useQuery(
    'user-permissions',
    () => profileService.getUserPermissions(),
    { enabled: !!user, refetchOnWindowFocus: false }
  );

  const userPermissions = permissionsData?.data || {};

  // Map route paths to module names
  const routeToModuleMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/academics': 'academics',
    '/students': 'students',
    '/attendance': 'attendance',
    '/examinations': 'examinations',
    '/online-examinations': 'online-examinations',
    '/homework': 'homework',
    '/library': 'library',
    '/download-center': 'download-center',
    '/communicate': 'communicate',
    '/inventory': 'inventory',
    '/transport': 'transport',
    '/hostel': 'hostel',
    '/certificate': 'certificate',
    '/calendar': 'calendar',
    '/chat': 'chat',
    '/alumni': 'alumni',
    '/reports': 'reports',
    '/lesson-plan': 'lesson-plan',
    '/front-office': 'front-office',
    '/hr': 'hr',
    '/fees': 'fees',
    '/income': 'income',
    '/expenses': 'expenses',
    '/users': 'users',
    '/roles': 'roles',
    '/settings': 'settings',
    '/front-cms-website': 'settings',
  };

  // Define menu items
  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', module: 'dashboard' },
    { path: '/academics', label: 'Academics', icon: '📚', module: 'academics' },
    { path: '/students', label: 'Students', icon: '🎓', module: 'students' },
    { path: '/attendance', label: 'Attendance', icon: '✅', module: 'attendance' },
    { path: '/examinations', label: 'Examinations', icon: '📝', module: 'examinations' },
    { path: '/online-examinations', label: 'Online Examinations', icon: '💻', module: 'online-examinations' },
    { path: '/homework', label: 'Homework', icon: '📋', module: 'homework' },
    { path: '/library', label: 'Library', icon: '📖', module: 'library' },
    { path: '/download-center', label: 'Download Center', icon: '📥', module: 'download-center' },
    { path: '/communicate', label: 'Communicate', icon: '💬', module: 'communicate' }, // Keep emoji for communicate
    { path: '/inventory', label: 'Inventory', icon: '📦', module: 'inventory' },
    { path: '/transport', label: 'Transport', icon: '🚌', module: 'transport' },
    { path: '/hostel', label: 'Hostel', icon: '🏠', module: 'hostel' },
    { path: '/certificate', label: 'Certificate', icon: '🎓', module: 'certificate' },
    { path: '/calendar', label: 'Calendar & ToDo', icon: '📅', module: 'calendar' },
    { path: '/chat', label: 'Chat', icon: '/chat-icon.png', module: 'chat' },
    { path: '/front-cms-website', label: 'Front CMS Website', icon: '🌐', module: 'settings' },
    { path: '/alumni', label: 'Alumni', icon: '🎓', module: 'alumni' },
    { path: '/reports', label: 'Reports', icon: '📊', module: 'reports' },
    { path: '/lesson-plan', label: 'Lesson Plan', icon: '📚', module: 'lesson-plan' },
    { path: '/front-office', label: 'Front Office', icon: '🏢', module: 'front-office' },
    { path: '/hr', label: 'Human Resource', icon: '👔', module: 'hr' },
    { path: '/fees', label: 'Fees Collection', icon: '💰', module: 'fees' },
    { path: '/income', label: 'Income', icon: '💵', module: 'income' },
    { path: '/expenses', label: 'Expenses', icon: '💸', module: 'expenses' },
    { path: '/users', label: 'Users', icon: '👥', module: 'users' },
    { path: '/roles', label: 'Roles & Permissions', icon: '🔐', module: 'roles' },
    { path: '/settings', label: 'Settings', icon: '⚙️', module: 'settings' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter((item) => {
    // Superadmin (with school) always has access to normal modules
    if (user?.role === 'superadmin' && user?.schoolId != null) return true;
    // Platform admin (no school) sees only Platform Admin link; filter out others for them below
    if (user?.isPlatformAdmin) return false;
    // Superadmin with school gets all items
    if (user?.role === 'superadmin') return true;
    
    // Check if user has view permission for this module
    const moduleName = item.module || routeToModuleMap[item.path];
    if (!moduleName) return false;
    
    const modulePermissions = userPermissions[moduleName];
    return modulePermissions && modulePermissions.length > 0 && modulePermissions.includes('view');
  });

  // Platform Admin link only for platform superadmin (role superadmin + no school_id)
  // Derive from role/schoolId so it works even if isPlatformAdmin was not in stored login response
  const showPlatformAdmin =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle} title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
          {isCollapsed ? '=' : '←'}
        </button>
        {!isCollapsed && <h3 className="sidebar-title"></h3>}
        {/* Mobile close button */}
        <button 
          className="mobile-sidebar-close"
          onClick={onMobileClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {showPlatformAdmin && (
            <li>
              <NavLink
                to="/platform"
                className={({ isActive }) => (isActive ? 'active' : '')}
                title={isCollapsed ? 'Platform Admin' : ''}
              >
                <span className="menu-icon">⚙</span>
                {!isCollapsed && <span className="menu-label">Platform Admin</span>}
              </NavLink>
            </li>
          )}
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                title={isCollapsed ? item.label : ''}
              >
                {item.icon.startsWith('/') || item.icon.startsWith('http') ? (
                  <img 
                    src={item.icon} 
                    alt={item.label} 
                    className="menu-icon menu-icon-image"
                  />
                ) : (
                  <span className="menu-icon">{item.icon}</span>
                )}
                {!isCollapsed && <span className="menu-label">{item.label}</span>}
                {!isCollapsed && item.path === '/chat' && unreadCount > 0 && (
                  <span className="menu-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                {isCollapsed && item.path === '/chat' && unreadCount > 0 && (
                  <span className="menu-badge-icon">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

