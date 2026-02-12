import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, User as UserIcon, Clock, Mail, Bell } from 'lucide-react';
import '../styles/BottomNavbar.css';

const BottomNavbar = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <nav className={`side-nav ${sidebarOpen ? 'open' : ''}`}>
      <button className="nav-item-notification">
        <Bell size={24} />
        <span className="notification-badge"></span>
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
  );
};

export default BottomNavbar;
