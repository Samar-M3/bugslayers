import React, { useState } from 'react';
import { Mail, MessageSquare, Send, AlertCircle, CheckCircle } from 'lucide-react';
import '../styles/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Sending your message...');
    setStatusType('');
    try {
      const response = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("Message sent successfully! We'll get back to you soon.");
        setStatusType('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus(''), 4000);
      } else {
        setStatus(data.message || 'Failed to send message. Please try again.');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Failed to send message. Please check your connection and try again.');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      {/* Header */}
      <div className="contact-header">
        <div className="header-content">
          <h1 className="header-title">Get in Touch</h1>
          <p className="header-subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-content">
        {/* Contact Form Card */}
        <div className="contact-form-card">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us what's on your mind..."
                rows="6"
                required
                disabled={loading}
              ></textarea>
            </div>

            {/* Status Message */}
            {status && (
              <div className={`status-message ${statusType}`}>
                {statusType === 'success' ? (
                  <CheckCircle size={18} />
                ) : statusType === 'error' ? (
                  <AlertCircle size={18} />
                ) : null}
                <span>{status}</span>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              <Send size={18} />
              <span>{loading ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>

        {/* Contact Info Cards */}
        <div className="contact-info">
          <div className="info-card">
            <div className="info-icon">
              <Mail size={24} />
            </div>
            <h3>Email</h3>
            <p>ParkFasto@parkingapp.com</p>
          </div>
          <div className="info-card">
            <div className="info-icon">
              <MessageSquare size={24} />
            </div>
            <h3>Support</h3>
            <p>Available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

