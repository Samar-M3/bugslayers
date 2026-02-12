import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import '../styles/Login.css';

const Login = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false); // Tracks API request status
  const [error, setError] = useState('');       // Stores error messages for display
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth(); // Use the login function from AuthContext

  // --- Event Handlers ---
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
      // API call to backend login endpoint (using upstream URL)
      const response = await fetch('http://localhost:8000/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.username, // Using username field for email/username
          password: formData.password
        }),
      });

      const data = await response.json();

        if (response.ok) {
          // Successful login: Use AuthContext's login function
          login(data.token); // This will store token, decode, set user, and navigate
          console.log('Login successful:', data);
        } else {
          // Server returned an error (e.g., 401 Unauthorized)
          setError(data.message || 'Login failed. Please try again.');
        }
    } catch (err) {
      // Network or connection issues
      setError('Connection error. Is the backend server running?');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header Section: Logo and Title */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon-wrapper">
              <MapPin className="logo-icon" size={32} fill="#3b82f6" />
            </div>
            <h1>Parking Area Allocation System</h1>
          </div>
        </div>

        <div className="login-body">
          <h2>Welcome Back!</h2>
          
          {/* Error Feedback: Displayed only when error state is set */}
          {error && <div className="error-message" style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #fecaca' }}>{error}</div>}

          {/* Login Form Section */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Username/Email Input */}
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
            
            {/* Password Input */}
            <div className="input-group">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Form Options: Remember Me and Forgot Password */}
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

            {/* Submit Button: Changes state based on loading */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Navigation to Registration */}
          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
