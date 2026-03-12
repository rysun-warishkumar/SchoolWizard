import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import './Login.css'; // reuse same styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword({ email });
      if (res.success) {
        setMessage(res.message || 'If an account exists, a reset link has been sent.');
      } else {
        setError(res.message || 'Failed to send reset link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-form-section">
            <h1 className="login-form-title">Forgot Password</h1>
            <p className="login-form-desc">Enter your email to receive a password reset link.</p>
            <form onSubmit={handleSubmit} className="login-form">
              {message && <div className="login-form-success">{message}</div>}
              {error && <div className="login-form-error">{error}</div>}
              <div className="login-input-wrap">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className="login-input"
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
