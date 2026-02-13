import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from "qrcode.react";
import { Camera, Mail, Lock, LogOut, ChevronRight, User as UserIcon, Download, X, QrCode } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import '../styles/Profile.css';

/**
 * Profile Component
 * Manages user personal information, profile photo, and unique QR code generation.
 */
function Profile() {
  const { showToast } = useToast();
  const formatRoleLabel = (role) => {
    const normalized = role === 'driver' ? 'user' : (role || 'user');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };
  // --- Profile State ---
  const [user, setUser] = useState(null); // Complete user object from backend
  const [selectedFile, setSelectedFile] = useState(null); // For profile picture uploads
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Toggle for edit form modal
  const [showQRModal, setShowQRModal] = useState(false); // Toggle for QR code modal
  const [qrData, setQrData] = useState(null); // Data encoded in the QR code
  const [qrId, setQrId] = useState(null);
  const qrRef = useRef(); // Reference for downloading the QR code image

  // Form state for profile updates
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found.');
        }

        const response = await axios.get('https://parkfasto-backend-2.onrender.com/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Populate state with backend data
        setUser(response.data);
        setEditForm({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          username: response.data.username || ''
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  /**
   * Handle Profile Picture Selection
   */
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  /**
   * Upload Profile Picture to Server
   */
  const handlePhotoUpload = async () => {
    if (selectedFile && user) {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found.');
        }

        const formData = new FormData();
        formData.append('photo', selectedFile);

        const response = await axios.patch('https://parkfasto-backend-2.onrender.com/api/v1/users/profile', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        
        setUser(response.data); // Update local user state with new photo URL
        setSelectedFile(null);
      } catch (err) {
        console.error('Failed to upload photo:', err);
        setError(err.response?.data?.message || 'Failed to upload photo.');
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Update Profile Text Information (Name, Email, etc.)
   */
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.patch('https://parkfasto-backend-2.onrender.com/api/v1/users/profile', editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleGenerateQR = async () => {
    if (user) {
      try {
        setLoading(true);
        const qrDataString = JSON.stringify({
          userId: user._id,
          username: user.username,
          email: user.email,
          timestamp: new Date().toISOString(),
          action: 'check-in/out'
        });

        // Save QR code to backend database
        const token = localStorage.getItem('token');
        const response = await axios.post(
          'https://parkfasto-backend-2.onrender.com/api/v1/qr/generate',
          { qrData: qrDataString },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          setQrData(qrDataString);
          setQrId(response.data.data._id);
          setShowQRModal(true);
        } else {
          showToast('Failed to generate QR code.', 'error');
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
        showToast('Failed to generate QR code. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `parking-qr-${user?.username}-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  if (loading && !user) {
    return (
      <div className="profile-container loading">
        <div className="loader"></div>
        <p>Fetching your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error">
        <div className="error-card">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-banner"></div>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-container">
            {user?.photo && !user.photo.includes('seed=John%20Doe') ? (
              <img 
                src={user.photo} 
                alt="Profile" 
                className="profile-avatar" 
              />
            ) : (
              <div className="profile-avatar initials-avatar" style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                borderRadius: 'inherit'
              }}>
                {(user?.firstName && user?.lastName) 
                  ? (user.firstName[0] + user.lastName[0]).toUpperCase()
                  : (user?.username?.substring(0, 2) || 'U').toUpperCase()}
              </div>
            )}
            <label htmlFor="photo-upload" className="avatar-edit-badge">
              <Camera size={20} />
            </label>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          {selectedFile && (
            <button 
              onClick={handlePhotoUpload} 
              className="save-photo-btn"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save New Photo'}
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="user-info-header">
          <h1 className="user-name" style={{ textTransform: 'capitalize' }}>
            {user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}`
              : user?.username || 'User'}
          </h1>
          <p className="user-role">{formatRoleLabel(user?.role)}</p>
        </div>

        <div className="profile-sections-grid">
          <section className="profile-info-section">
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Account Information</h3>
              <button 
                className="edit-profile-btn" 
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="edit-profile-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="edit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px', display: 'block' }}>First Name</label>
                    <input 
                      type="text" 
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px', display: 'block' }}>Last Name</label>
                    <input 
                      type="text" 
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '5px', display: 'block' }}>Email</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '5px'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div className="info-cards">
                <div className="info-card">
                  <div className="info-icon"><UserIcon size={20} /></div>
                  <div className="info-details">
                    <span className="info-label">First Name</span>
                    <span className="info-value" style={{ textTransform: 'capitalize' }}>{user?.firstName}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon"><UserIcon size={20} /></div>
                  <div className="info-details">
                    <span className="info-label">Last Name</span>
                    <span className="info-value" style={{ textTransform: 'capitalize' }}>{user?.lastName}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon"><Mail size={20} /></div>
                  <div className="info-details">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon"><UserIcon size={20} /></div>
                  <div className="info-details">
                    <span className="info-label">Username</span>
                    <span className="info-value">@{user?.username}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="profile-actions-section">
            <h3 className="section-title">Check-In/Out QR Code</h3>
            <div className="action-links">
              <button 
                onClick={handleGenerateQR}
                className="action-item qr-btn"
                style={{ cursor: 'pointer' }}
              >
                <div className="action-icon"><QrCode size={20} /></div>
                <span className="action-label">Generate Check-In QR</span>
                <ChevronRight size={18} className="chevron" />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
              Generate a unique QR code for parking check-in and check-out. The guard will scan this code to verify your timing.
            </p>
          </section>

          <section className="profile-actions-section">
            <h3 className="section-title">Settings & Security</h3>
            <div className="action-links">
              <Link to="/forgot-password" className="action-item">
                <div className="action-icon"><Lock size={20} /></div>
                <span className="action-label">Change Password</span>
                <ChevronRight size={18} className="chevron" />
              </Link>
              <button onClick={handleLogout} className="action-item logout-btn">
                <div className="action-icon"><LogOut size={20} /></div>
                <span className="action-label">Sign Out</span>
                <ChevronRight size={18} className="chevron" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h2>Your Check-In/Out QR Code</h2>
              <button 
                className="qr-modal-close"
                onClick={() => setShowQRModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="qr-modal-content">
              <p className="qr-info-text">
                Show this QR code to the parking lot guard for check-in and check-out. The code contains your user information and timestamp.
              </p>

              <div className="qr-code-container" ref={qrRef}>
                {qrData && (
                  <QRCodeCanvas
                    value={qrData} 
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                )}
              </div>

              <div className="qr-user-info">
                <p><strong>User:</strong> {user?.username}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleString()}</p>
                {qrId && <p><strong>QR ID:</strong> {qrId.substring(0, 8)}...</p>}
              </div>

              <div className="qr-modal-actions">
                <button 
                  className="download-qr-btn"
                  onClick={handleDownloadQR}
                >
                  <Download size={18} />
                  Download QR Code
                </button>
                <button 
                  className="close-qr-btn"
                  onClick={() => setShowQRModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

