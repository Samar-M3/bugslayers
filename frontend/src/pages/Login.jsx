import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, MapPin, ChevronDown } from 'lucide-react';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'User',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        console.log('Login successful:', data);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Is the backend server running?');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <MapPin className="pin-icon" fill="white" size={24} />
              <span className="logo-letter">P</span>
            </div>
            <h1>Parking Area Allocation System</h1>
          </div>
        </div>

        <div className="login-body">
          <h2>Welcome Back!</h2>

          {error && <div className="error-message" style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #fecaca' }}>{error}</div>}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="input-icon">
                <User size={20} />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username / Email"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="input-group">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Remember Me
              </label>
              <Link to="/forgot-password" title="Forgot Password?" className="forgot-password">
                Forgot Password?
              </Link>
            </div>
            
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="login-footer">
            Don't have an account? <Link to="/register" className="signup-link">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
