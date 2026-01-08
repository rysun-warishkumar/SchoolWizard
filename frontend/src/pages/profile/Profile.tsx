import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api/profileService';
import './Profile.css';

const Profile = () => {
  const { user, updateUser: updateAuthUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery('profile', () => profileService.getProfile(), {
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData?.data) {
      setProfileForm({
        name: profileData.data.name,
        email: profileData.data.email,
      });
    }
  }, [profileData]);

  const updateProfileMutation = useMutation(profileService.updateProfile, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('profile');
      // Update auth context
      if (data.data) {
        updateAuthUser(data.data);
      }
      alert('Profile updated successfully!');
    },
  });

  const changePasswordMutation = useMutation(profileService.changePassword, {
    onSuccess: () => {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Password changed successfully!');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  const profile = profileData?.data;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2>{profile?.name || 'User'}</h2>
            <p className="user-role">{profile?.role || profile?.role_name || 'User'}</p>
            <p className="user-email">{profile?.email || ''}</p>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-tabs">
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              Profile Information
            </button>
            <button
              className={activeTab === 'password' ? 'active' : ''}
              onClick={() => setActiveTab('password')}
            >
              Change Password
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="profile-form-section">
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={profile?.role || profile?.role_name || ''}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>User ID</label>
                  <input
                    type="text"
                    value={profile?.id || ''}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={updateProfileMutation.isLoading}>
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-form-section">
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <small>Password must be at least 6 characters long</small>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={changePasswordMutation.isLoading}>
                    {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

