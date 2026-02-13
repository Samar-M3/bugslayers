import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import '../styles/ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setError('');

    try {
      const response = await axios.post('https://parkfasto-backend-2.onrender.com/api/v1/users/forgot-password', { email });
      
      if (response.data.success) {
        setSubmitted(true);
        setStatus(response.data.message);
        setEmail('');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <Link to="/login" className="back-link">
          <ArrowLeft size={20} />
          Back to Login
        </Link>

        {!submitted ? (
          <>
            <div className="forgot-password-header">
              <div className="forgot-password-icon">
                <Mail size={40} />
              </div>
              <h2>Forgot Password?</h2>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={loading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {status && <div className="success-message">{status}</div>}

              <button 
                type="submit" 
                disabled={loading || !email}
                className="submit-btn"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="forgot-password-footer">
              <p>Don't have an account? <Link to="/register">Sign Up</Link></p>
            </div>
          </>
        ) : (
          <div className="success-container">
            <div className="success-icon">
              <CheckCircle size={48} />
            </div>
            <h2>Check Your Email</h2>
            <p>We've sent a password reset link to <strong>{email}</strong></p>
            <p className="info-text">Please check your email and click the link to reset your password. The link will expire in 10 minutes.</p>
            <button 
              onClick={() => setSubmitted(false)}
              className="reset-btn"
            >
              Send Another Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

