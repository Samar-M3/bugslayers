import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, MapPin, Eye, EyeOff } from 'lucide-react';
import '../styles/Register.css';

const Register = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false); // Tracks API request status
  const [error, setError] = useState('');       // Stores error messages for display
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // --- Event Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation: Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // API call to backend registration endpoint (using upstream URL)
      const response = await fetch('http://localhost:8000/api/v1/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful registration: Redirect to login page
        console.log('Registration successful:', data);
        navigate('/login');
      } else {
        // Server returned an error (e.g., User already exists)
        setError(data.message || 'Registration failed. Please try again.');
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
    <div className="register-page">
      <div className="register-card">
        {/* Header Section: Logo and Title */}
        <div className="register-header">
          <div className="logo-container">
            <div className="logo-icon-wrapper">
              <MapPin className="logo-icon" size={32} fill="#3b82f6" />
            </div>
            <h1>Parking Area Allocation System</h1>
          </div>
        </div>

        <div className="register-body">
          <h2>Create Account</h2>
          
          {/* Error Feedback: Displayed only when error state is set */}
          {error && <div className="error-message" style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #fecaca' }}>{error}</div>}

          {/* Registration Form Section */}
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {/* First Name Input */}
              <div className="input-group">
                <div className="input-icon">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* Last Name Input */}
              <div className="input-group">
                <div className="input-icon">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {/* Email Input */}
            <div className="input-group">
              <div className="input-icon">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
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

            {/* Confirm Password Input */}
            <div className="input-group">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit Button: Changes state based on loading */}
            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="register-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
