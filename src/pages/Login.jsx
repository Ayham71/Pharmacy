import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://165.22.91.187:5000/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token if provided
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        // Store user data if needed
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }

        // Call the onLogin callback to change app state
        onLogin(data); // This should trigger the parent component to show the dashboard
      } else {
        // Handle error response
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="page-wrapper">
      {/* Decorative blobs */}
      <div className="glow-blob glow-blob-1"></div>
      <div className="glow-blob glow-blob-2"></div>

      {/* Login Card */}
      <form className="login-card" onSubmit={handleSubmit}>
        {/* Pharmacy Icon */}
        <div className="icon-wrapper">
          <div className="icon-box">
            <img src="/logo.jpeg" alt="Pharmacy Icon" />
          </div>
        </div>

        {/* Title */}
        <h1 className="card-title">Pharmacy Portal</h1>
        <p className="card-subtitle">Access your professional dashboard</p>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" style={{ fontSize: '12px' }}>EMAIL OR USERNAME</label>
          </div>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              className="text-input"
              placeholder="pharmacist@system.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" style={{ fontSize: '12px' }}>PASSWORD</label>
          </div>
          <div className="input-wrapper">
            <span className="input-icon">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="text-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={togglePassword}
              disabled={loading}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login to Dashboard'}
          {!loading && (
            <svg viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>

        {/* SSL Badge */}
        <div className="ssl-badge">
          <svg viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="ssl-text">Secure SSL Encryption Active</span>
        </div>
      </form>
    </div>
  );
}

export default Login;