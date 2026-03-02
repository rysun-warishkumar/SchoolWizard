import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const DEFAULT_SCHOOL_NAME = 'Make My School';

const getPublicApiBase = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
  return url.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState(DEFAULT_SCHOOL_NAME);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoginDisplay = async () => {
      try {
        const base = getPublicApiBase();
        const res = await fetch(`${base}/api/v1/public/website/login-display`);
        const json = await res.json();
        if (json?.success && json?.data?.schoolName?.trim()) {
          setSchoolName(String(json.data.schoolName).trim());
        }
      } catch {
        // Keep default "Make My School" on error or no config
      }
    };
    fetchLoginDisplay();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-welcome">
            <div className="login-welcome-sphere login-welcome-sphere--1" aria-hidden="true" />
            <div className="login-welcome-sphere login-welcome-sphere--2" aria-hidden="true" />
            <div className="login-welcome-sphere login-welcome-sphere--3" aria-hidden="true" />
            <div className="login-welcome-content">
              <h2 className="login-welcome-title">WELCOME</h2>
              <p className="login-welcome-headline">{schoolName}</p>
              <p className="login-welcome-tagline">
                School Management System. Sign in to access your dashboard.
              </p>
            </div>
          </div>
          <div className="login-form-section">
            <h1 className="login-form-title">Sign in</h1>
            <p className="login-form-desc">Enter your credentials to access your account.</p>
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="login-form-error">{error}</div>}
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
                  className="login-input"
                  autoComplete="email"
                />
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // Eye with slash (hidden)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Eye open (visible)
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="login-form-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <p className="login-register-school">
                Don&apos;t have a school account? <Link to="/register-school">Register your school</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
