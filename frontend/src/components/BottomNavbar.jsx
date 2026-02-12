import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, User as UserIcon, Clock, Mail, Bell } from 'lucide-react';
import '../styles/BottomNavbar.css';
import { useToast } from '../context/ToastContext';

const BottomNavbar = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingNotifications(true);
      const res = await fetch('http://localhost:8000/api/v1/users/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('http://localhost:8000/api/v1/users/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
      showToast('Failed to update notifications', 'error');
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Open sidebar when mouse is within 80px of right edge
      if (e.clientX >= window.innerWidth - 80) {
        setSidebarOpen(true);
      } else {
        // Close sidebar when mouse moves away from right edge
        setSidebarOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleNotificationToggle = async () => {
    const nextState = !notificationOpen;
    setNotificationOpen(nextState);
    if (nextState) {
      await fetchNotifications();
      await markAllRead();
    }
  };

  return (
    <>
    <nav className={`side-nav ${sidebarOpen ? 'open' : ''}`}>
      <button className="nav-item-notification" onClick={handleNotificationToggle}>
        <Bell size={24} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        <Compass size={24} />
        <span>Explore</span>
      </Link>
      <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
        <Clock size={24} />
        <span>History</span>
      </Link>
      <Link to="/contact" className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
        <Mail size={24} />
        <span>Contact</span>
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <UserIcon size={24} />
        <span>Profile</span>
      </Link>
    </nav>

    {notificationOpen && (
      <>
        <div className="notification-panel-backdrop" onClick={() => setNotificationOpen(false)} />
        <aside className="notification-panel">
          <div className="notification-panel-header">
            <h4>Notifications</h4>
            <button onClick={() => setNotificationOpen(false)}>X</button>
          </div>
          <div className="notification-panel-body">
            {loadingNotifications ? (
              <p className="notification-empty">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <div key={item._id} className={`notification-item ${item.isRead ? 'read' : 'unread'}`}>
                  <div className="notification-item-title">{item.title}</div>
                  <div className="notification-item-message">{item.message}</div>
                  <div className="notification-item-time">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </>
    )}
    </>
  );
};

export default BottomNavbar;
