import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './TrialExpired.css';

const TrialExpired = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="trial-expired-page">
      <div className="trial-expired-card">
        <div className="trial-expired-icon" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="trial-expired-title">Trial expired</h1>
        <p className="trial-expired-message">
          Your 30-day trial has ended. To continue using {user?.schoolName || 'your school'} on SchoolWizard, please contact us to upgrade your account.
        </p>
        <p className="trial-expired-contact">
          Reach out to your administrator or contact support for upgrade options.
        </p>
        <button type="button" className="trial-expired-button" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default TrialExpired;
