import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { useToast } from '../../contexts/ToastContext';
import './RegisterSchool.css';

const RegisterSchool = () => {
  const [schoolName, setSchoolName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.registerSchool({
        schoolName: schoolName.trim(),
        adminName: adminName.trim(),
        email: email.trim(),
        password,
      });

      const redirectUrl = response.registrationPayment?.redirectUrl;
      if (redirectUrl) {
        showToast('School registered successfully. Redirecting to PhonePe payment gateway...', 'success');
        window.location.href = redirectUrl;
        return;
      }

      showToast(response.message || 'School registered successfully. You can now sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-school-page">
      <div className="register-school-card-wrap">
        <div className="register-school-card">
          <div className="register-school-welcome">
            <div className="register-school-welcome-sphere register-school-welcome-sphere--1" aria-hidden="true" />
            <div className="register-school-welcome-sphere register-school-welcome-sphere--2" aria-hidden="true" />
            <div className="register-school-welcome-content">
              <h2 className="register-school-welcome-title">REGISTER YOUR SCHOOL</h2>
              <p className="register-school-welcome-headline">Start your 30-day free trial</p>
              <p className="register-school-welcome-tagline">
                Create your school account and get full access to the school management system. No credit card required.
              </p>
            </div>
          </div>
          <div className="register-school-form-section">
            <h1 className="register-school-form-title">Create school account</h1>
            <p className="register-school-form-desc">
              Enter your school and admin details below.
            </p>
            <form onSubmit={handleSubmit} className="register-school-form">
              {error && <div className="register-school-form-error">{error}</div>}
              <div className="register-school-input-wrap">
                <input
                  type="text"
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  placeholder="School name"
                  className="register-school-input"
                  autoComplete="organization"
                />
              </div>
              <div className="register-school-input-wrap">
                <input
                  type="text"
                  id="adminName"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Admin full name"
                  className="register-school-input"
                  autoComplete="name"
                />
              </div>
              <div className="register-school-input-wrap">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Admin email"
                  className="register-school-input"
                  autoComplete="email"
                />
              </div>
              <div className="register-school-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Password (min 6 characters)"
                  className="register-school-input"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="register-school-password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <button type="submit" className="register-school-button" disabled={loading}>
                {loading ? 'Creating account...' : 'Register school'}
              </button>
            </form>
            <p className="register-school-signin">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterSchool;
