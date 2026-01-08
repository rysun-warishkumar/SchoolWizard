import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersService } from '../../services/api/usersService';
import { rolesService } from '../../services/api/rolesService';
import { User } from '../../types/auth';
import './Users.css';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role_id: '',
  });

  const queryClient = useQueryClient();

  // Fetch users
  const { data: usersData, isLoading } = useQuery(
    ['users', page, roleFilter, searchTerm],
    () => usersService.getUsers({ page, limit: 10, role: roleFilter || undefined, search: searchTerm || undefined })
  );

  // Fetch roles
  const { data: rolesData } = useQuery('roles', () => rolesService.getRoles());

  // Create user mutation
  const createMutation = useMutation(usersService.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setShowModal(false);
      resetForm();
    },
  });

  // Update user mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => usersService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setShowModal(false);
        resetForm();
      },
    }
  );

  // Delete user mutation
  const deleteMutation = useMutation(usersService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation(usersService.toggleUserStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
    },
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', role_id: '' });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role_id: String(user.role_id || user.roleId),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      email: formData.email,
      name: formData.name,
      role_id: Number(formData.role_id),
    };

    if (editingUser) {
      if (formData.password) {
        submitData.password = formData.password;
      }
      updateMutation.mutate({ id: String(editingUser.id), data: submitData });
    } else {
      submitData.password = formData.password;
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(String(id));
    }
  };

  const handleToggleStatus = (id: string | number) => {
    toggleStatusMutation.mutate(String(id));
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-description">
            Note: Students and Staff users are created automatically when adding them in their respective modules.
            Use "Add User" only for system-level roles (Admin, Accountant, Librarian, Receptionist).
          </p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add User
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">All Roles</option>
          {rolesData?.data.map((role) => (
            <option key={role.id} value={role.name}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersData?.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="role-badge">{user.role || 'No Role'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(user)} className="btn-edit">
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`btn-toggle ${user.is_active ? 'btn-disable' : 'btn-enable'}`}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="btn-delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usersData?.pagination && usersData.pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {usersData.pagination.page} of {usersData.pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(usersData.pagination.pages, p + 1))}
                disabled={page === usersData.pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                  required
                >
                  <option value="">Select Role</option>
                  {rolesData?.data
                    .filter((role) => !['student', 'teacher'].includes(role.name.toLowerCase()))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                </select>
                <small className="form-hint">
                  Note: Student and Teacher roles should be created through their respective modules.
                </small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

