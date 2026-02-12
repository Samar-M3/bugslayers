import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, User as UserIcon } from 'lucide-react';
import '../styles/BottomNavbar.css'; // We'll create this CSS file

const BottomNavbar = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        <Compass size={24} />
        <span>Explore</span>
      </Link>
      <Link to="/contact" className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}>
        <UserIcon size={24} />
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
