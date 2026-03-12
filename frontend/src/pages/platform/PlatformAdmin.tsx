import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import {
  platformService,
  PlatformSchool,
  PlatformSchoolDetail,
  SchoolControlPlaneData,
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
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<PlatformSchool | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [provisionNotes, setProvisionNotes] = useState('');
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

  const controlPlaneQuery = useQuery(
    ['platform-control-plane', selectedSchoolId],
    () => platformService.getSchoolControlPlane(selectedSchoolId as number),
    { enabled: selectedSchoolId != null }
  );

  const registerDomainMutation = useMutation(
    (payload: { schoolId: number; domain: string }) =>
      platformService.registerDomain(payload.schoolId, { domain: payload.domain, domain_type: 'custom' }),
    {
      onSuccess: () => {
        showToast('Domain registered', 'success');
        setDomainInput('');
        queryClient.invalidateQueries(['platform-control-plane', selectedSchoolId]);
      },
      onError: (err: any) => showToast(err.response?.data?.message || 'Failed to register domain', 'error'),
    }
  );

  const provisionMutation = useMutation(
    (payload: { schoolId: number; notes: string }) =>
      platformService.requestDedicatedProvision(payload.schoolId, { notes: payload.notes || undefined }),
    {
      onSuccess: () => {
        showToast('Provision workflow requested', 'success');
        queryClient.invalidateQueries(['platform-control-plane', selectedSchoolId]);
      },
      onError: (err: any) => showToast(err.response?.data?.message || 'Failed to request provision', 'error'),
    }
  );

  const createMigrationMutation = useMutation(
    (schoolId: number) => platformService.createMigration(schoolId, {}),
    {
      onSuccess: () => {
        showToast('Migration record created', 'success');
        queryClient.invalidateQueries(['platform-control-plane', selectedSchoolId]);
      },
      onError: (err: any) => showToast(err.response?.data?.message || 'Failed to create migration', 'error'),
    }
  );

  const freezeMutation = useMutation(
    (payload: { schoolId: number; enabled: boolean }) => platformService.setReadOnlyFreeze(payload.schoolId, payload.enabled),
    {
      onSuccess: () => queryClient.invalidateQueries(['platform-control-plane', selectedSchoolId]),
      onError: (err: any) => showToast(err.response?.data?.message || 'Failed to update read-only freeze', 'error'),
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

  const controlPlaneData: SchoolControlPlaneData | null = controlPlaneQuery.data?.data ?? null;

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

      {error ? (
        <div className="platform-admin-error">
          {String((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load schools. You may need to run the Phase 1 database migration.')}
        </div>
      ) : null}

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
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/platform/schools/${school.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/platform/schools/${school.id}`);
                            }
                          }}
                          style={{
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#111827',
                          }}
                          title="Open school details"
                        >
                          {school.name}
                        </span>
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
                          <button
                            type="button"
                            className="platform-admin-btn platform-admin-btn--small"
                            onClick={() => {
                              setSelectedSchoolId(school.id);
                              setSelectedSchool(school);
                              setShowHowItWorks(false);
                            }}
                          >
                            Control Plane
                          </button>
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

      {selectedSchoolId != null && (
        <section className="platform-admin-table-wrap" style={{ marginTop: '1rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Tenant Control Plane{selectedSchool ? ` - ${selectedSchool.name}` : ''}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="platform-admin-btn platform-admin-btn--small"
                onClick={() => setShowHowItWorks(true)}
              >
                How It Work
              </button>
              <button
                type="button"
                className="platform-admin-btn platform-admin-btn--small"
                onClick={() => {
                  setSelectedSchoolId(null);
                  setSelectedSchool(null);
                  setShowHowItWorks(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
          {controlPlaneQuery.isLoading ? (
            <div className="platform-admin-loading">Loading control-plane state...</div>
          ) : controlPlaneQuery.error ? (
            <div className="platform-admin-error">
              {String((controlPlaneQuery.error as any)?.response?.data?.message ?? 'Failed to load control-plane state')}
            </div>
          ) : controlPlaneData ? (
            <>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div><strong>Status:</strong> {controlPlaneData.tenant.lifecycle_status}</div>
                <div><strong>Runtime:</strong> {controlPlaneData.tenant.runtime_mode}</div>
                <div><strong>Read-only freeze:</strong> {controlPlaneData.tenant.is_readonly_freeze ? 'ON' : 'OFF'}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="custom domain (e.g. app.school.com)"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="platform-admin-search"
                  style={{ maxWidth: '320px' }}
                />
                <button
                  type="button"
                  className="platform-admin-btn platform-admin-btn--small"
                  onClick={() => selectedSchoolId && registerDomainMutation.mutate({ schoolId: selectedSchoolId, domain: domainInput.trim() })}
                  disabled={!domainInput.trim() || registerDomainMutation.isLoading}
                >
                  Add Domain
                </button>
                <input
                  type="text"
                  placeholder="Provision notes"
                  value={provisionNotes}
                  onChange={(e) => setProvisionNotes(e.target.value)}
                  className="platform-admin-search"
                  style={{ maxWidth: '240px' }}
                />
                <button
                  type="button"
                  className="platform-admin-btn platform-admin-btn--small platform-admin-btn--primary"
                  onClick={() => selectedSchoolId && provisionMutation.mutate({ schoolId: selectedSchoolId, notes: provisionNotes.trim() })}
                  disabled={provisionMutation.isLoading}
                >
                  Request Dedicated Provision
                </button>
                <button
                  type="button"
                  className="platform-admin-btn platform-admin-btn--small platform-admin-btn--success"
                  onClick={() => selectedSchoolId && createMigrationMutation.mutate(selectedSchoolId)}
                  disabled={createMigrationMutation.isLoading}
                >
                  Create Migration
                </button>
                <button
                  type="button"
                  className="platform-admin-btn platform-admin-btn--small"
                  onClick={() =>
                    selectedSchoolId &&
                    freezeMutation.mutate({
                      schoolId: selectedSchoolId,
                      enabled: !controlPlaneData.tenant.is_readonly_freeze,
                    })
                  }
                  disabled={freezeMutation.isLoading}
                >
                  Toggle Freeze
                </button>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Domains ({controlPlaneData.domains.length})</strong>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  {controlPlaneData.domains.map((d) => `${d.domain} [${d.verification_status}/${d.ssl_status}/${d.is_active ? 'active' : 'inactive'}]`).join(' | ') || 'No domains'}
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Environments ({controlPlaneData.environments.length})</strong>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  {controlPlaneData.environments.map((e) => `${e.environment_type}:${e.environment_status}${e.server_host ? `@${e.server_host}` : ''}`).join(' | ') || 'No environments'}
                </div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Migrations ({controlPlaneData.migrations.length})</strong>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  {controlPlaneData.migrations.map((m) => `#${m.id}:${m.migration_status}`).join(' | ') || 'No migrations'}
                </div>
              </div>
              <div>
                <strong>Recent Events ({controlPlaneData.events.length})</strong>
                <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                  {controlPlaneData.events.slice(0, 5).map((e) => `${new Date(e.created_at).toLocaleString()}: ${e.event_type}`).join(' | ') || 'No events'}
                </div>
              </div>
            </>
          ) : null}
        </section>
      )}

      {showHowItWorks && (
        <div className="platform-admin-modal-overlay" onClick={() => setShowHowItWorks(false)}>
          <div className="platform-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>How It Works - Tenant Control Plane</h2>
            <div className="platform-admin-form" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <p><strong>Status:</strong> current lifecycle state of the selected tenant.</p>
              <p><strong>Runtime:</strong> where tenant runs now (`shared` or `dedicated`).</p>
              <p><strong>Read-only freeze:</strong> block write operations during final migration sync.</p>
              <p><strong>Add Domain:</strong> registers tenant domain for verification and activation.</p>
              <p><strong>Provision Notes:</strong> operational notes for dedicated provisioning steps.</p>
              <p><strong>Request Dedicated Provision:</strong> starts manual dedicated environment workflow.</p>
              <p><strong>Create Migration:</strong> creates migration record for precheck, cutover, and rollback.</p>
              <p><strong>Toggle Freeze:</strong> enable before final sync, disable after cutover validation.</p>
              <p><strong>Domains:</strong> shows DNS/verification/SSL/active state for each domain.</p>
              <p><strong>Environments:</strong> shows shared/dedicated environment provisioning status.</p>
              <p><strong>Migrations:</strong> shows migration runs and lifecycle state.</p>
              <p><strong>Recent Events:</strong> audit timeline for all control-plane operations.</p>
              <hr />
              <p><strong>Recommended setup flow:</strong></p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Select school and open Control Plane.</li>
                <li>Add domain and complete DNS + verification.</li>
                <li>Request dedicated provisioning and mark environment ready.</li>
                <li>Create migration and run prechecks.</li>
                <li>Enable freeze for final sync, then cutover.</li>
                <li>Validate and disable freeze. Use rollback if post-cutover checks fail.</li>
              </ol>
            </div>
            <div className="platform-admin-modal-actions">
              <button
                type="button"
                className="platform-admin-btn platform-admin-btn--primary"
                onClick={() => setShowHowItWorks(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
