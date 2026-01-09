import { useQuery } from 'react-query';
import { studentsService } from '../../services/api/studentsService';
import './StudentProfile.css';

const StudentProfile = () => {
  const { data: student, isLoading } = useQuery(
    'my-student-profile',
    () => studentsService.getMyProfile(),
    { refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!student) {
    return <div className="empty-state">Profile not found</div>;
  }

  return (
    <div className="student-profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-photo-section">
            {(() => {
              // Helper function to get photo URL
              const getPhotoUrl = (photo: string | null | undefined): string | null => {
                if (!photo) return null;
                
                const photoStr = String(photo).trim();
                if (!photoStr || photoStr === 'null' || photoStr === 'undefined') return null;
                
                // File path - construct full URL
                if (photoStr.startsWith('/uploads/')) {
                  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
                  return apiBaseUrl.replace('/api/v1', '') + photoStr;
                }
                
                // Data URL (base64) - return as-is (browser handles it directly)
                if (photoStr.startsWith('data:image/')) {
                  return photoStr;
                }
                
                // External URL - return as-is
                if (photoStr.startsWith('http://') || photoStr.startsWith('https://')) {
                  return photoStr;
                }
                
                // Relative path - construct URL
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
                return apiBaseUrl.replace('/api/v1', '') + (photoStr.startsWith('/') ? photoStr : '/' + photoStr);
              };
              
              const photoUrl = getPhotoUrl(student.photo);
              const hasPhoto = photoUrl !== null && photoUrl !== '';
              
              return (
                <div className="profile-photo-wrapper">
                  {hasPhoto ? (
                    <img
                      src={photoUrl!}
                      alt={`${student.first_name} ${student.last_name || ''}`}
                      className="profile-photo"
                      style={{ display: 'block' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.profile-photo-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement;
                        const placeholder = target.parentElement?.querySelector('.profile-photo-placeholder') as HTMLElement;
                        if (placeholder) {
                          placeholder.style.display = 'none';
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="profile-photo-placeholder"
                    style={{ display: hasPhoto ? 'none' : 'flex' }}
                  >
                    {student.first_name.charAt(0).toUpperCase()}
                  </div>
                </div>
              );
            })()}
            <div className="profile-basic-info">
              <h2>
                {student.first_name} {student.last_name || ''}
              </h2>
              <p className="admission-no">Admission No: {student.admission_no}</p>
              {student.roll_no && <p className="roll-no">Roll No: {student.roll_no}</p>}
              <p className="class-info">
                {student.class_name} - {student.section_name}
              </p>
            </div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Date of Birth</label>
                <span>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}</span>
              </div>
              <div className="info-item">
                <label>Gender</label>
                <span>{student.gender || '-'}</span>
              </div>
              <div className="info-item">
                <label>Blood Group</label>
                <span>{student.blood_group || '-'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{student.email || '-'}</span>
              </div>
              <div className="info-item">
                <label>Mobile</label>
                <span>{student.student_mobile || '-'}</span>
              </div>
              <div className="info-item">
                <label>Category</label>
                <span>{student.category_name || '-'}</span>
              </div>
              {student.house_name && (
                <div className="info-item">
                  <label>House</label>
                  <span>{student.house_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3>Father's Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>{student.father_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Occupation</label>
                <span>{(student as any).father_occupation || '-'}</span>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <span>{student.father_phone || '-'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{student.father_email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Mother's Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>{student.mother_name || '-'}</span>
              </div>
              <div className="info-item">
                <label>Occupation</label>
                <span>{(student as any).mother_occupation || '-'}</span>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <span>{student.mother_phone || '-'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{student.mother_email || '-'}</span>
              </div>
            </div>
          </div>

          {(student.guardian_name || student.guardian_phone) && (
            <div className="profile-section">
              <h3>Guardian's Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <span>{student.guardian_name || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Relation</label>
                  <span>{(student as any).guardian_relation || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Occupation</label>
                  <span>{(student as any).guardian_occupation || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <span>{student.guardian_phone || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{student.guardian_email || '-'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="profile-section">
            <h3>Address Information</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Current Address</label>
                <span>{(student as any).current_address || '-'}</span>
              </div>
              <div className="info-item full-width">
                <label>Permanent Address</label>
                <span>{(student as any).permanent_address || '-'}</span>
              </div>
            </div>
          </div>

          {student.documents && student.documents.length > 0 && (
            <div className="profile-section">
              <h3>Documents</h3>
              <div className="documents-list">
                {student.documents.map((doc: any) => (
                  <div key={doc.id} className="document-item">
                    <span className="document-name">{doc.document_name}</span>
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}${doc.document_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

