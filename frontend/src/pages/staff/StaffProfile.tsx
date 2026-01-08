import React from 'react';
import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import { useAuth } from '../../contexts/AuthContext';
import './StaffProfile.css';

const StaffProfile = () => {
  const { user } = useAuth();

  const { data: staffData, isLoading } = useQuery(
    'my-staff-profile',
    () => hrService.getMyStaffProfile(),
    { enabled: !!user?.id, refetchOnWindowFocus: false }
  );

  const staff = staffData?.data;

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!staff) {
    return <div className="empty-state">Staff profile not found</div>;
  }

  return (
    <div className="staff-profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-photo-section">
            {staff.photo && staff.photo.trim() !== '' ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${staff.photo.startsWith('/') ? staff.photo : '/' + staff.photo}`}
                alt={`${staff.first_name} ${staff.last_name || ''}`}
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
              style={{ display: staff.photo && staff.photo.trim() !== '' ? 'none' : 'flex' }}
            >
              {staff.first_name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-basic-info">
              <h2>
                {staff.first_name} {staff.last_name || ''}
              </h2>
              <p className="staff-id">Staff ID: {staff.staff_id}</p>
              {staff.designation_name && (
                <p className="designation">{staff.designation_name}</p>
              )}
              {staff.department_name && (
                <p className="department">{staff.department_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Date of Birth</label>
                <span>{staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString() : '-'}</span>
              </div>
              <div className="info-item">
                <label>Gender</label>
                <span>{staff.gender || '-'}</span>
              </div>
              <div className="info-item">
                <label>Marital Status</label>
                <span>{staff.marital_status || '-'}</span>
              </div>
              <div className="info-item">
                <label>Email</label>
                <span>{staff.email || '-'}</span>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <span>{staff.phone || '-'}</span>
              </div>
              <div className="info-item">
                <label>Emergency Contact</label>
                <span>{staff.emergency_contact || '-'}</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Employment Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Date of Joining</label>
                <span>{staff.date_of_joining ? new Date(staff.date_of_joining).toLocaleDateString() : '-'}</span>
              </div>
              <div className="info-item">
                <label>Contract Type</label>
                <span>{staff.contract_type || '-'}</span>
              </div>
              <div className="info-item">
                <label>Work Shift</label>
                <span>{staff.work_shift || '-'}</span>
              </div>
              {staff.basic_salary && (
                <div className="info-item">
                  <label>Basic Salary</label>
                  <span>₹{parseFloat(staff.basic_salary.toString()).toLocaleString()}</span>
                </div>
              )}
              {staff.epf_no && (
                <div className="info-item">
                  <label>EPF Number</label>
                  <span>{staff.epf_no}</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h3>Address Information</h3>
            <div className="info-grid">
              <div className="info-item full-width">
                <label>Current Address</label>
                <span>{staff.current_address || '-'}</span>
              </div>
              <div className="info-item full-width">
                <label>Permanent Address</label>
                <span>{staff.permanent_address || '-'}</span>
              </div>
            </div>
          </div>

          {(staff.qualification || staff.work_experience) && (
            <div className="profile-section">
              <h3>Education & Experience</h3>
              <div className="info-grid">
                {staff.qualification && (
                  <div className="info-item full-width">
                    <label>Qualification</label>
                    <span>{staff.qualification}</span>
                  </div>
                )}
                {staff.work_experience && (
                  <div className="info-item full-width">
                    <label>Work Experience</label>
                    <span>{staff.work_experience}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {staff.note && (
            <div className="profile-section">
              <h3>Notes</h3>
              <div className="info-grid">
                <div className="info-item full-width">
                  <span>{staff.note}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;

