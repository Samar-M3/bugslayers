import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminDashboard.css';

const GuardDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="admin-container">
      <div className="admin-main" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b' }}>Guard Module</h1>
            <p style={{ margin: '6px 0 0 0', color: '#64748b' }}>
              Logged in as {user?.username || 'Guard'} ({user?.role || 'guard'})
            </p>
          </div>
          <button
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: '#ef4444', color: 'white', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' }}
          >
            <LogOut size={16} /> Logout
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <button
            onClick={() => navigate('/guard/entry')}
            style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', textAlign: 'left', background: 'white', cursor: 'pointer' }}
          >
            <ShieldCheck size={28} color="#16a34a" />
            <h3 style={{ margin: '12px 0 4px 0', color: '#1e293b' }}>Entry Scanner</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Scan vehicle/user QR to allow parking entry.</p>
          </button>

          <button
            onClick={() => navigate('/guard/exit')}
            style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', textAlign: 'left', background: 'white', cursor: 'pointer' }}
          >
            <ShieldAlert size={28} color="#dc2626" />
            <h3 style={{ margin: '12px 0 4px 0', color: '#1e293b' }}>Exit Scanner</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Scan QR to complete session and release slot.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuardDashboard;
