import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Import axios
import '../styles/Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
        if (!token) {
          throw new Error('No authentication token found.');
        }

        const response = await axios.get('http://localhost:8000/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

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

        const response = await axios.patch('http://localhost:8000/api/v1/users/profile', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        setUser(response.data);
        setSelectedFile(null);
        alert('Photo updated successfully!');
      } catch (err) {
        console.error('Failed to upload photo:', err);
        setError(err.response?.data?.message || 'Failed to upload photo.');
      } finally {
        setLoading(false);
      }
    } else if (!selectedFile) {
      alert('Please select a file first.');
    }
  };

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-container error-message">{error}</div>;
  }

  if (!user) {
    return <div className="profile-container">No user data available.</div>;
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">User Profile</h2>
      <div className="profile-card">
        <div className="profile-photo-section">
          <img src={user.photo} alt="Profile" className="profile-photo" />
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="photo-upload" className="change-photo-btn">
            Change Photo
          </label>
          {selectedFile && (
            <button onClick={handlePhotoUpload} className="upload-photo-btn" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Selected Photo'}
            </button>
          )}
        </div>
        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{user.email}</span>
          </div>
          {/* Add more user details here if needed */}
        </div>
        <div className="profile-actions">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;
