import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { platformService } from '../../services/api/platformService';

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1rem',
};

const formatBytes = (bytes?: number | null) => {
  const value = Number(bytes || 0);
  if (!value) return '0 MB';
  const mb = value / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
};

export default function PlatformSchoolDetails() {
  const params = useParams<{ id: string }>();
  const schoolId = Number(params.id);

  const { data, isLoading, error } = useQuery(
    ['platform-school-details', schoolId],
    () => platformService.getSchool(schoolId),
    { enabled: Number.isInteger(schoolId) && schoolId > 0 }
  );

  const school = data?.data;
  const hasError = Boolean(error);
  const errorMessage = hasError
    ? String((error as any)?.response?.data?.message || 'Failed to load school details')
    : '';
  const trialDays = useMemo(() => {
    if (!school?.trial_ends_at) return null;
    const d = new Date(school.trial_ends_at);
    const now = new Date();
    return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }, [school?.trial_ends_at]);

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>School Details</h1>
          <p style={{ color: '#6b7280', marginTop: '0.35rem' }}>
            Platform-level insights for the selected school.
          </p>
        </div>
        <Link to="/platform">Back to Platform Admin</Link>
      </div>

      {isLoading && <div>Loading school details...</div>}
      {hasError && (
        <div style={{ color: '#b91c1c' }}>
          {errorMessage}
        </div>
      )}

      {school && (
        <>
          <div style={{ ...cardStyle, marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>{school.name}</h3>
            <p style={{ margin: '0.3rem 0' }}><strong>Slug:</strong> {school.slug}</p>
            <p style={{ margin: '0.3rem 0' }}><strong>Status:</strong> {school.status}</p>
            <p style={{ margin: '0.3rem 0' }}><strong>Admin:</strong> {school.admin_name || '—'} ({school.admin_email || '—'})</p>
            <p style={{ margin: '0.3rem 0' }}><strong>Custom Domain:</strong> {school.custom_domain || '—'}</p>
            <p style={{ margin: '0.3rem 0' }}><strong>Trial Ends:</strong> {school.trial_ends_at ? new Date(school.trial_ends_at).toLocaleDateString() : '—'}</p>
            <p style={{ margin: '0.3rem 0' }}><strong>Trial Days Left:</strong> {trialDays == null ? '—' : trialDays}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Users</h4>
              <p style={{ fontSize: '1.5rem', margin: 0 }}>{school.users_count ?? 0}</p>
            </div>
            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Students</h4>
              <p style={{ fontSize: '1.5rem', margin: 0 }}>{school.students_count ?? 0}</p>
            </div>
            <div style={cardStyle}>
              <h4 style={{ marginTop: 0 }}>Storage Used</h4>
              <p style={{ fontSize: '1.2rem', margin: 0 }}>{formatBytes(school.storage_used_bytes)}</p>
              <small style={{ color: '#6b7280' }}>
                Approximate uploaded-file usage tracked from school file references.
              </small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
