import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentProfile.css';

const ParentProfile = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData, isLoading: childrenLoading } = useQuery(
    'my-children',
    () => studentsService.getMyChildren(),
    { refetchOnWindowFocus: false }
  );

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const { data: student, isLoading: studentLoading } = useQuery(
    ['child-profile', selectedChildId],
    () => studentsService.getStudentById(selectedChildId!.toString()),
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  if (childrenLoading || studentLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  if (!selectedChild) {
    return (
      <div className="parent-profile-page">
        <ChildSelector
          children={children}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />
        <div className="empty-state">Please select a child to view their profile</div>
      </div>
    );
  }

  const profile = student?.data || selectedChild;

  return (
    <div className="parent-profile-page">
      <div className="profile-header">
        <h1>Child Profile</h1>
        <p className="profile-subtitle">Viewing profile for: {profile.first_name} {profile.last_name || ''}</p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-photo-section">
            {profile.photo && profile.photo.trim() !== '' ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${profile.photo.startsWith('/') ? profile.photo : '/' + profile.photo}`}
                alt={`${profile.first_name} ${profile.last_name || ''}`}
                className="profile-photo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder && placeholder.classList.contains('profile-photo-placeholder')) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className="profile-photo-placeholder"
              style={{ display: profile.photo && profile.photo.trim() !== '' ? 'none' : 'flex' }}
            >
              {profile.first_name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-basic-info">
              <h2>
                {profile.first_name} {profile.last_name || ''}
              </h2>
              <p className="admission-no">Admission No: {profile.admission_no}</p>
              {profile.roll_no && <p className="roll-no">Roll No: {profile.roll_no}</p>}
              <p className="class-info">
                {profile.class_name} - {profile.section_name}
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
                <span>{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '-'}</span>
              </div>
              <div className="info-item">
                <label>Gender</label>
                <span>{profile.gender || '-'}</span>
              </div>
              <div className="info-item">
                <label>Blood Group</label>
                <span>{profile.blood_group || '-'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{profile.email || '-'}</span>
              </div>
              <div className="info-item">
                <label>Mobile</label>
                <span>{profile.student_mobile || '-'}</span>
              </div>
              <div className="info-item">
                <label>Category</label>
                <span>{profile.category_name || '-'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Parent/Guardian Information</h3>
            <div className="info-grid">
              {profile.father_name && (
                <>
                  <div className="info-item">
                    <label>Father Name</label>
                    <span>{profile.father_name}</span>
                  </div>
                  {profile.father_phone && (
                    <div className="info-item">
                      <label>Father Phone</label>
                      <span>{profile.father_phone}</span>
                    </div>
                  )}
                </>
              )}
              {profile.mother_name && (
                <>
                  <div className="info-item">
                    <label>Mother Name</label>
                    <span>{profile.mother_name}</span>
                  </div>
                  {profile.mother_phone && (
                    <div className="info-item">
                      <label>Mother Phone</label>
                      <span>{profile.mother_phone}</span>
                    </div>
                  )}
                </>
              )}
              {profile.guardian_name && (
                <>
                  <div className="info-item">
                    <label>Guardian Name</label>
                    <span>{profile.guardian_name}</span>
                  </div>
                  {profile.guardian_relation && (
                    <div className="info-item">
                      <label>Relation</label>
                      <span>{profile.guardian_relation}</span>
                    </div>
                  )}
                  {profile.guardian_phone && (
                    <div className="info-item">
                      <label>Guardian Phone</label>
                      <span>{profile.guardian_phone}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3>Address Information</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Current Address</label>
                <span>{profile.current_address || '-'}</span>
              </div>
              <div className="info-item full-width">
                <label>Permanent Address</label>
                <span>{profile.permanent_address || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentProfile;

