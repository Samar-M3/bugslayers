import React, { useState } from 'react';
import axios from 'axios';
// import '../styles/ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending password reset link...');
    setError('');
    try {
      // In a real app, this would be an API call to your backend
      // For now, we'll simulate a successful response
      await axios.post('http://localhost:8000/api/v1/users/forgot-password', { email });
      setStatus('Password reset link sent to your email (if registered)!');
      setEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
      setStatus('');
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit} className="forgot-password-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" disabled={status.includes('Sending')}>
          {status.includes('Sending') ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {status && <p className="status-message success">{status}</p>}
      {error && <p className="status-message error">{error}</p>}
    </div>
  );
}

export default ForgotPassword;
