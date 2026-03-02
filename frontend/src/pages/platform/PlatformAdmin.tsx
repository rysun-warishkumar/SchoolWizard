import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  platformService,
  PlatformSchool,
  PlatformSchoolDetail,
} from '../../services/api/platformService';
import { useToast } from '../../contexts/ToastContext';
import './PlatformAdmin.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'suspended', label: 'Suspended' },
];

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

export default function PlatformAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PlatformSchoolDetail | null>(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('');
  const [formTrialEndsAt, setFormTrialEndsAt] = useState('');
  const [formCustomDomain, setFormCustomDomain] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isPlatformUser =
    user?.isPlatformAdmin === true ||
    (user?.role === 'superadmin' && (user?.schoolId == null || user?.schoolId === undefined));

  useEffect(() => {
    if (user && !isPlatformUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isPlatformUser, navigate]);

  const { data, isLoading, error } = useQuery(
    ['platform-schools', statusFilter, search, page],
    () =>
      platformService.getSchools({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 15,
      }),
    { keepPreviousData: true }
  );

  const updateMutation = useMutation(
    (payload: { id: number; data: Parameters<typeof platformService.updateSchool>[1] }) =>
      platformService.updateSchool(payload.id, payload.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['platform-schools']);
        setEditing(null);
        showToast('School updated successfully', 'success');
      },
      onError: (err: any) => {
        showToast(err.response?.data?.message || 'Update failed', 'error');
      },
    }
  );

  const schools = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 15, total: 0 };

  const openEdit = (school: PlatformSchool) => {
    setEditing({ ...school, students_count: 0, users_count: 0 });
    setFormName(school.name);
    setFormStatus(school.status);
    setFormTrialEndsAt(school.trial_ends_at ? school.trial_ends_at.slice(0, 10) : '');
    setFormCustomDomain(school.custom_domain || '');
  };

  const handleExtendTrial = (school: PlatformSchool) => {
    const end = school.trial_ends_at ? new Date(school.trial_ends_at) : new Date();
    end.setDate(end.getDate() + 30);
    updateMutation.mutate({
      id: school.id,
      data: { trial_ends_at: end.toISOString().slice(0, 10), status: 'trial' },
    });
  };

  const handleMarkUpgraded = (school: PlatformSchool) => {
    updateMutation.mutate({ id: school.id, data: { status: 'active', trial_ends_at: null } });
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      data: {
        name: formName.trim() || undefined,
        status: formStatus || undefined,
        trial_ends_at: formTrialEndsAt || null,
        custom_domain: formCustomDomain.trim() || null,
      },
    });
  };

  if (user && !isPlatformUser) {
    return (
      <div className="platform-admin" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="platform-admin-subtitle" style={{ marginBottom: '1rem' }}>
          Platform Admin is only available for platform administrators.
        </p>
        <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>
          Log in with a platform admin account (superadmin with no school) to manage schools.
        </p>
        <button
          type="button"
          className="platform-admin-filter-btn"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="platform-admin">
      <header className="platform-admin-header">
        <h1>Platform Admin</h1>
        <p className="platform-admin-subtitle">Manage schools, trials, and custom domains</p>
      </header>

      <div className="platform-admin-filters">
        <input
          type="text"
          placeholder="Search by name, slug, or admin email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="platform-admin-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="platform-admin-status-select"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button type="button" className="platform-admin-filter-btn" onClick={() => setPage(1)}>
          Apply
        </button>
      </div>

      {error && (
        <div className="platform-admin-error">
          {String((error as any)?.response?.data?.message ?? 'Failed to load schools. You may need to run the Phase 1 database migration.')}
        </div>
      )}

      {isLoading ? (
        <div className="platform-admin-loading">Loading schools...</div>
      ) : (
        <>
          <div className="platform-admin-table-wrap">
            <table className="platform-admin-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Admin email</th>
                  <th>Status</th>
                  <th>Trial ends</th>
                  <th>Custom domain</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr><td colSpan={7}>No schools found</td></tr>
                ) : (
                  schools.map((school) => (
                    <tr key={school.id}>
                      <td>
                        <strong>{school.name}</strong>
                        <span className="platform-admin-slug">{school.slug}</span>
                      </td>
                      <td>{school.admin_email || '—'}</td>
                      <td>
                        <span className={`platform-admin-badge platform-admin-badge--${school.status}`}>
                          {school.status}
                        </span>
                      </td>
                      <td>{formatDate(school.trial_ends_at)}</td>
                      <td>{school.custom_domain || '—'}</td>
                      <td>{formatDate(school.created_at)}</td>
                      <td>
                        <div className="platform-admin-actions">
                          <button type="button" className="platform-admin-btn platform-admin-btn--small" onClick={() => openEdit(school)}>Edit</button>
                          {school.status === 'trial' && (
                            <>
                              <button type="button" className="platform-admin-btn platform-admin-btn--small platform-admin-btn--primary" onClick={() => handleExtendTrial(school)} disabled={updateMutation.isLoading}>+30 days</button>
                              <button type="button" className="platform-admin-btn platform-admin-btn--small platform-admin-btn--success" onClick={() => handleMarkUpgraded(school)} disabled={updateMutation.isLoading}>Mark upgraded</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > pagination.limit && (
            <div className="platform-admin-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
              <button type="button" disabled={page >= Math.ceil(pagination.total / pagination.limit)} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="platform-admin-modal-overlay" onClick={() => setEditing(null)}>
          <div className="platform-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit school: {editing.name}</h2>
            <div className="platform-admin-form">
              <label>Name
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </label>
              <label>Status
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <label>Trial ends at (date)
                <input type="date" value={formTrialEndsAt} onChange={(e) => setFormTrialEndsAt(e.target.value)} />
              </label>
              <label>Custom domain
                <input type="text" placeholder="e.g. app.schoolname.com" value={formCustomDomain} onChange={(e) => setFormCustomDomain(e.target.value)} />
                <small>DNS/SSL can be configured later when you enable custom domain access.</small>
              </label>
            </div>
            <div className="platform-admin-modal-actions">
              <button type="button" className="platform-admin-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="platform-admin-btn platform-admin-btn--primary" onClick={handleSaveEdit} disabled={updateMutation.isLoading}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
