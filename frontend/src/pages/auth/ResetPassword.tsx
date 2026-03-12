import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authService.resetPassword({ token, newPassword, confirmPassword });
      if (res.success) {
        setMessage(res.message || 'Password has been reset. You can now log in.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.message || 'Reset failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-form-section">
            <h1 className="login-form-title">Reset Password</h1>
            <p className="login-form-desc">Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="login-form">
              {message && <div className="login-form-success">{message}</div>}
              {error && <div className="login-form-error">{error}</div>}
              <div className="login-input-wrap">
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="New Password"
                  className="login-input"
                />
              </div>
              <div className="login-input-wrap">
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm Password"
                  className="login-input"
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <p className="login-register-school">
                Remembered? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
