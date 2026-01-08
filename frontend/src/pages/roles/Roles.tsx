import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { rolesService, Role, ModulePermission } from '../../services/api/rolesService';
import { useToast } from '../../contexts/ToastContext';
import './Roles.css';

// Module icon mapping - ensures icons always display correctly
const moduleIconMap: Record<string, string> = {
  'dashboard': '📊',
  'front-office': '🏢',
  'students': '👥',
  'fees': '💰',
  'income': '📈',
  'expenses': '📉',
  'attendance': '✅',
  'examinations': '📋',
  'online-examinations': '💻',
  'lesson-plan': '📚',
  'academics': '🎓',
  'hr': '👔',
  'communicate': '📧',
  'download-center': '📥',
  'homework': '📝',
  'library': '📖',
  'inventory': '📦',
  'transport': '🚌',
  'hostel': '🏠',
  'certificate': '📜',
  'front-cms': '🌐',
  'alumni': '🎓',
  'reports': '📊',
  'settings': '⚙️',
  'calendar': '📅',
  'chat': '💬',
  'users': '👤',
  'roles': '🔐',
};

// Helper function to get module icon
const getModuleIcon = (moduleName: string, iconFromDb?: string | null): string => {
  // Normalize module name (lowercase, trim)
  const normalizedName = moduleName?.toLowerCase().trim() || '';
  
  // Check if database icon is invalid (contains question marks, is empty, or looks corrupted)
  const isInvalidIcon = !iconFromDb || 
    !iconFromDb.trim() || 
    iconFromDb.includes('?') || 
    iconFromDb === '????' ||
    iconFromDb.length === 0 ||
    iconFromDb.trim().length === 0;
  
  // Always prefer the mapping - it's more reliable
  // Only use database icon if it's clearly valid AND the mapping doesn't exist
  if (moduleIconMap[normalizedName]) {
    // If mapping exists, use it (more reliable than database)
    return moduleIconMap[normalizedName];
  }
  
  // If no mapping exists, try database icon if valid
  if (!isInvalidIcon) {
    return iconFromDb;
  }
  
  // Final fallback
  return '📁';
};

const Roles = () => {
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  // Store permissions for all roles: { roleId: { moduleId: { permissionId: granted } } }
  const [allRolePermissions, setAllRolePermissions] = useState<Record<number, Record<number, Record<number, boolean>>>>({});

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: rolesData, isLoading } = useQuery('roles', () => rolesService.getRoles());
  const { data: modulesData } = useQuery('modules', () => rolesService.getModules());
  const { data: permissionsData } = useQuery('permissions', () => rolesService.getPermissions());

  // Load permissions for all roles when modal opens
  useEffect(() => {
    if (showPermissionsModal && rolesData?.data && modulesData?.data) {
      const loadAllPermissions = async () => {
        const permissions: Record<number, Record<number, Record<number, boolean>>> = {};
        
        for (const role of rolesData.data) {
          try {
            const response = await rolesService.getRolePermissions(String(role.id));
            const rolePerms: Record<number, Record<number, boolean>> = {};
            
            response.data.modules.forEach((module: ModulePermission) => {
              rolePerms[module.id] = {};
              module.permissions.forEach((perm) => {
                rolePerms[module.id][perm.id] = perm.granted;
              });
            });
            
            permissions[role.id] = rolePerms;
          } catch (error) {
            console.error(`Failed to load permissions for role ${role.id}:`, error);
          }
        }
        
        setAllRolePermissions(permissions);
      };
      
      loadAllPermissions();
    }
  }, [showPermissionsModal, rolesData, modulesData]);

  const createMutation = useMutation(rolesService.createRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      setShowModal(false);
      resetForm();
      showToast('Role created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create role', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => rolesService.updateRole(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        setShowModal(false);
        resetForm();
        showToast('Role updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update role', 'error');
      },
    }
  );

  const deleteMutation = useMutation(rolesService.deleteRole, {
    onSuccess: () => {
      queryClient.invalidateQueries('roles');
      showToast('Role deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete role', 'error');
    },
  });


  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingRole(null);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const handleManagePermissions = () => {
    setShowPermissionsModal(true);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      updateMutation.mutate({ id: String(editingRole.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      deleteMutation.mutate(String(id));
    }
  };

  const handlePermissionToggle = (roleId: number, moduleId: number, permissionId: number, granted: boolean) => {
    if (roleId === 1) return; // Cannot modify superadmin
    
    setAllRolePermissions((prev) => {
      const updated = { ...prev };
      if (!updated[roleId]) updated[roleId] = {};
      if (!updated[roleId][moduleId]) updated[roleId][moduleId] = {};
      updated[roleId][moduleId][permissionId] = granted;
      return updated;
    });
  };

  const handleModuleToggle = (roleId: number, moduleId: number, granted: boolean) => {
    if (roleId === 1) return; // Cannot modify superadmin
    
    if (!permissionsData?.data) return;
    
    setAllRolePermissions((prev) => {
      const updated = { ...prev };
      if (!updated[roleId]) updated[roleId] = {};
      if (!updated[roleId][moduleId]) updated[roleId][moduleId] = {};
      
      // Toggle all permissions for this module
      permissionsData.data.forEach((perm) => {
        updated[roleId][moduleId][perm.id] = granted;
      });
      
      return updated;
    });
  };

  const handleSaveAllPermissions = async () => {
    if (!rolesData?.data || !modulesData?.data || !permissionsData?.data) return;

    try {
      // Save permissions for each role (except superadmin)
      const savePromises = rolesData.data
        .filter((role) => role.id !== 1) // Skip superadmin
        .map((role) => {
          const rolePerms = allRolePermissions[role.id] || {};
          const permissions = modulesData.data.flatMap((module) => {
            const modulePerms = rolePerms[module.id] || {};
            return permissionsData.data.map((perm) => ({
              module_id: module.id,
              permission_id: perm.id,
              granted: modulePerms[perm.id] || false,
            }));
          });

          return rolesService.updateRolePermissions(String(role.id), { permissions });
        });

      await Promise.all(savePromises);
      queryClient.invalidateQueries(['role-permissions']);
      showToast('All permissions updated successfully', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save permissions', 'error');
    }
  };

  const getPermissionStatus = (roleId: number, moduleId: number, permissionId: number): boolean => {
    return allRolePermissions[roleId]?.[moduleId]?.[permissionId] || false;
  };

  const hasAnyPermission = (roleId: number, moduleId: number): boolean => {
    if (!permissionsData?.data) return false;
    return permissionsData.data.some((perm) => getPermissionStatus(roleId, moduleId, perm.id));
  };

  // Group modules by category (for future use)
  const groupedModules = modulesData?.data || [];

  return (
    <div className="roles-page">
      <div className="page-header">
        <h1>Roles & Permissions</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleManagePermissions}>
            Manage Permissions
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + Add Role
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading roles...</div>
      ) : (
        <div className="roles-grid">
          {rolesData?.data.map((role) => (
            <div key={role.id} className="role-card">
              <div className="role-header">
                <h3>{role.name}</h3>
                {role.id === 1 && <span className="protected-badge">Protected</span>}
              </div>
              <p className="role-description">{role.description || 'No description'}</p>
              <div className="role-actions">
                {role.id !== 1 && (
                  <>
                    <button onClick={() => handleEdit(role)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="btn-delete">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRole ? 'Edit Role' : 'Add Role'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., teacher, accountant"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Role description..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Management Modal - Table Layout */}
      {showPermissionsModal && (
        <div className="modal-overlay" onClick={() => { if (!isEditing) { setShowPermissionsModal(false); } }}>
          <div className="modal-content permissions-modal-table" onClick={(e) => e.stopPropagation()}>
            <div className="permissions-header">
              <h2>Roles & Permissions</h2>
              <div className="permissions-header-actions">
                {!isEditing ? (
                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Permissions
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={async () => {
                        setIsEditing(false);
                        // Reload permissions to discard changes
                        if (rolesData?.data) {
                          const permissions: Record<number, Record<number, Record<number, boolean>>> = {};
                          for (const role of rolesData.data) {
                            try {
                              const response = await rolesService.getRolePermissions(String(role.id));
                              const rolePerms: Record<number, Record<number, boolean>> = {};
                              response.data.modules.forEach((module: ModulePermission) => {
                                rolePerms[module.id] = {};
                                module.permissions.forEach((perm) => {
                                  rolePerms[module.id][perm.id] = perm.granted;
                                });
                              });
                              permissions[role.id] = rolePerms;
                            } catch (error) {
                              console.error(`Failed to load permissions for role ${role.id}:`, error);
                            }
                          }
                          setAllRolePermissions(permissions);
                        }
                      }}
                    >
                      Cancel Editing
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleSaveAllPermissions}
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>

            {modulesData?.data && rolesData?.data && permissionsData?.data ? (
              <div className="permissions-table-container">
                <table className="permissions-table">
                  <thead>
                    <tr>
                      <th className="module-column">Module</th>
                      {rolesData.data.map((role) => (
                        <th key={role.id} className="role-column">
                          <div className="role-header-cell">
                            <span className="role-name">{role.name}</span>
                            {role.id === 1 && <span className="protected-badge-small">Protected</span>}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedModules.map((module) => (
                      <tr key={module.id} className="module-row">
                        <td className="module-info-cell">
                          <div className="module-info">
                            <span className="module-icon">{getModuleIcon(module.name, module.icon)}</span>
                            <div className="module-details">
                              <div className="module-name">{module.display_name}</div>
                              {module.description && (
                                <div className="module-description">{module.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        {rolesData.data.map((role) => (
                          <td key={role.id} className="permission-cell">
                            {isEditing && role.id !== 1 ? (
                              <div className="permission-toggles">
                                {permissionsData.data.map((permission) => (
                                  <label key={permission.id} className="permission-toggle-item">
                                    <input
                                      type="checkbox"
                                      checked={getPermissionStatus(role.id, module.id, permission.id)}
                                      onChange={(e) =>
                                        handlePermissionToggle(role.id, module.id, permission.id, e.target.checked)
                                      }
                                    />
                                    <span>{permission.display_name}</span>
                                  </label>
                                ))}
                                <button
                                  className="toggle-all-btn"
                                  onClick={() =>
                                    handleModuleToggle(role.id, module.id, !hasAnyPermission(role.id, module.id))
                                  }
                                >
                                  {hasAnyPermission(role.id, module.id) ? 'Remove All' : 'Grant All'}
                                </button>
                              </div>
                            ) : (
                              <div className="permission-status">
                                {hasAnyPermission(role.id, module.id) ? (
                                  <div className="permission-badges">
                                    {permissionsData.data.map((permission) => {
                                      const hasPermission = getPermissionStatus(role.id, module.id, permission.id);
                                      return hasPermission ? (
                                        <span key={permission.id} className="permission-badge">
                                          {permission.display_name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                ) : (
                                  <span className="no-permission">No access</span>
                                )}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="loading">Loading permissions...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
