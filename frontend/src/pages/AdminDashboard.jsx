import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Settings, 
  TrendingUp, 
  Car, 
  Bike, 
  Truck, 
  DollarSign, 
  Plus,
  LogOut,
  Users,
  FileText,
  Scan,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet marker icon issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Dashboard State Management
  const [activeTab, setActiveTab] = useState('dashboard'); // Tracks which sidebar tab is active

  // Authentication logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Main KPI Statistics State
  const [stats, setStats] = useState({
    revenue: 0,
    activeSessions: 0,
    totalLots: 0,
    totalUsers: 0,
    occupancyRate: 0
  });

  // Revenue & Activity Data State
  const [revenueData, setRevenueData] = useState([]); // Stores data for the Revenue Trends chart
  const [revenuePeriod, setRevenuePeriod] = useState('7days'); // Controls the time range for revenue (7 or 30 days)
  const [recentActivity, setRecentActivity] = useState([]); // List of latest system actions
  
  // Management State (Lots, Users, System Config)
  const [allLots, setAllLots] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [isEditingLot, setIsEditingLot] = useState(false);
  const [editingLotId, setEditingLotId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [newLot, setNewLot] = useState({
    name: '',
    lat: '',
    lon: '',
    pricePerHour: '',
    totalSpots: '',
    type: 'both'
  });
  const [editLot, setEditLot] = useState({
    name: '',
    lat: '',
    lon: '',
    pricePerHour: '',
    totalSpots: '',
    type: 'both'
  });
  const [systemConfig, setSystemConfig] = useState({
    currency: 'NPR',
    gracePeriod: 15,
    taxRate: 13,
    language: 'English',
    twoFactorAuth: false
  });

  const fetchLots = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/lots', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAllLots(data);
    } catch (err) {
      console.error('Error fetching lots:', err);
    }
  };

  const handleAddLot = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/lots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLot)
      });
      if (res.ok) {
        setIsAddingLot(false);
        setNewLot({ name: '', lat: '', lon: '', pricePerHour: '', totalSpots: '', type: 'both' });
        fetchLots();
      }
    } catch (err) {
      console.error('Error adding lot:', err);
    }
  };

  const handleDeleteLot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parking lot?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/lots/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchLots();
    } catch (err) {
      console.error('Error deleting lot:', err);
    }
  };

  const handleUpdateLot = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/lots/${editingLotId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editLot)
      });
      if (res.ok) {
        setIsEditingLot(false);
        setEditingLotId(null);
        fetchLots();
      }
    } catch (err) {
      console.error('Error updating lot:', err);
    }
  };

  const openEditModal = (lot) => {
    setEditingLotId(lot._id);
    setEditLot({
      name: lot.name,
      lat: lot.lat,
      lon: lot.lon,
      pricePerHour: lot.pricePerHour,
      totalSpots: lot.totalSpots,
      type: lot.type
    });
    setIsEditingLot(true);
  };

  const handleAIScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/ai-detect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setScanResult({ success: true, message: data.message });
        fetchLots(); // Refresh the list
      } else {
        setScanResult({ success: false, message: data.message || 'Scan failed' });
      }
    } catch (err) {
      setScanResult({ success: false, message: 'Connection error during scan' });
    } finally {
      setIsScanning(false);
    }
  };

  // Main Data Fetching Effect
  // Runs on component mount and whenever the revenue period changes
  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token');
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch multiple data sources in parallel for better performance
        const [statsRes, trendsRes, activityRes, lotsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/admin/stats', { headers }),
          fetch(`http://localhost:8000/api/v1/admin/revenue-trends?period=${revenuePeriod}`, { headers }),
          fetch('http://localhost:8000/api/v1/admin/recent-activity', { headers }),
          fetch('http://localhost:8000/api/v1/admin/lots', { headers })
        ]);

        if (!statsRes.ok || !trendsRes.ok || !activityRes.ok || !lotsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, trendsData, activityData, lotsData] = await Promise.all([
          statsRes.json(),
          trendsRes.json(),
          activityRes.json(),
          lotsRes.json()
        ]);

        // Update state with fetched data
        setStats(statsData);
        setRevenueData(trendsData);
        setRecentActivity(activityData);
        setAllLots(lotsData);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
    fetchUsers();
    fetchConfig();

    // Setup auto-refresh to keep dashboard data up-to-date
    const interval = setInterval(() => {
      fetchAdminData();
      fetchUsers();
      fetchConfig();
    }, 30000);
    return () => clearInterval(interval);
  }, [navigate, revenuePeriod]);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateGuard = async () => {
    const firstName = window.prompt('Guard first name:');
    if (!firstName) return;

    const lastName = window.prompt('Guard last name:');
    if (!lastName) return;

    const email = window.prompt('Guard email:');
    if (!email) return;

    const username = window.prompt('Guard username (optional):') || '';
    const password = window.prompt('Set temporary password (min 6 chars):');
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/guards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, username, email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Guard account created. Username: ${data.data.username}`);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to create guard account');
      }
    } catch (err) {
      console.error('Error creating guard:', err);
      alert('Failed to create guard account');
    }
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const fetchConfig = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) setSystemConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemConfig)
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      alert('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', gap: '20px' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#6366f1' }}>Loading Admin Dashboard...</p>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', gap: '20px' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ef4444' }}>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar for Desktop */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">
            <div className="logo-square">P</div>
            <span>ParkAdmin</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button className={activeTab === 'map' ? 'active' : ''} onClick={() => setActiveTab('map')}>
            <MapIcon size={20} />
            <span>Live Map</span>
          </button>
          <button className={activeTab === 'manage-lots' ? 'active' : ''} onClick={() => setActiveTab('manage-lots')}>
            <Plus size={20} />
            <span>Manage Lots</span>
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            <Users size={20} />
            <span>Manage Users</span>
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            <span>Setup</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-title">
            <h1>{activeTab === 'dashboard' ? 'Revenue Hub' : activeTab === 'manage-lots' ? 'Parking Management' : activeTab === 'users' ? 'User Management' : 'Admin Hub'}</h1>
            <p>{activeTab === 'dashboard' ? 'PARKING MANAGEMENT' : activeTab === 'manage-lots' ? 'CRUD OPERATIONS' : activeTab === 'users' ? 'ACCESS CONTROL' : 'SYSTEM SETTINGS'}</p>
          </div>
          <div className="header-actions">
            {activeTab === 'manage-lots' && (
              <button className="add-lot-btn" onClick={() => setIsAddingLot(true)} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Add New Lot
              </button>
            )}
            <div className="admin-profile-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="admin-user-info" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span className="admin-user-name" style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{user?.username || 'Admin'}</span>
                <span className="admin-user-role" style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{user?.role || 'Super Admin'}</span>
              </div>
              <div className="admin-profile-pic" style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #6366f1' }}>
                <img src={user?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Admin'}`} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* KPI Grid */}
            <section className="kpi-grid">
              <div className="kpi-row">
                <div className="kpi-card main-revenue">
                  <div className="kpi-info">
                    <span className="kpi-label">TOTAL REVENUE</span>
                    <h2 className="kpi-value">NPR {stats.revenue.toLocaleString()}</h2>
                    <div className="kpi-trend positive">
                      <TrendingUp size={16} />
                      <span>+12.5% from last month</span>
                    </div>
                  </div>
                  <div className="kpi-icon-box">
                    <DollarSign size={32} />
                  </div>
                </div>

                <div className="kpi-card secondary">
                  <div className="kpi-sub-row">
                    <span className="kpi-label">ACTIVE SESSIONS</span>
                    <span className="kpi-value-small">{stats.activeSessions}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${stats.occupancyRate}%` }}></div>
                  </div>
                  <span className="kpi-percentage">{stats.occupancyRate}% Occupancy Rate</span>
                </div>

                <div className="kpi-card secondary">
                  <div className="kpi-sub-row">
                    <span className="kpi-label">TOTAL USERS</span>
                    <span className="kpi-value-small">{stats.totalUsers}</span>
                  </div>
                  <div className="digital-cash-stats">
                    <div className="stat-item">
                      <div className="stat-bar digital" style={{ width: '70%' }}></div>
                      <div className="stat-info">
                        <span className="stat-percent">70% DIGITAL</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-bar cash" style={{ width: '30%' }}></div>
                      <div className="stat-info">
                        <span className="stat-percent">30% CASH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="admin-charts">
              <div className="chart-card revenue-trends">
                <div className="chart-header">
                  <h3>Revenue Trends</h3>
                  <div className="chart-actions">
                    <select 
                      className="chart-select"
                      value={revenuePeriod}
                      onChange={(e) => setRevenuePeriod(e.target.value)}
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                    </select>
                  </div>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 12}}
                        tickFormatter={(value) => `Rs.${value}`}
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{
                          borderRadius: '12px',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === revenueData.length - 1 ? '#6366f1' : '#e2e8f0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>



            {/* Activity Section */}
            <section className="recent-activity">
              <div className="section-header">
                <h3>Live Activity</h3>
                <button className="view-all">VIEW ALL</button>
              </div>
              <div className="activity-list">
                {recentActivity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-icon-box">
                      {item.type === 'CAR' ? <Car size={24} /> : 
                       item.type === 'BIKE' ? <Bike size={24} /> : <Truck size={24} />}
                    </div>
                    <div className="activity-info">
                      <h4>{item.plate}</h4>
                      <p>Entry: {item.time} • {item.type} • {item.parkingLot}</p>
                    </div>
                    <div className="activity-status">
                      {item.status === 'ACTIVE' ? (
                        <span className="status-badge active">ACTIVE</span>
                      ) : (
                        <div className="paid-info">
                          <span className="paid-amount">{item.amount}</span>
                          <span className="status-badge paid">PAID</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : activeTab === 'map' ? (
          <section className="admin-map-section" style={{ height: 'calc(100vh - 150px)', padding: '20px' }}>
            <div className="map-card" style={{ height: '100%', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
              <MapContainer center={[27.7172, 85.3240]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {allLots.map(lot => (
                  <Marker key={lot._id} position={[lot.lat, lot.lon]}>
                    <Popup>
                      <div style={{ padding: '5px' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{lot.name}</h4>
                        <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>
                          Type: {lot.type.toUpperCase()}<br />
                          Price: NPR {lot.pricePerHour}/hr<br />
                          Occupancy: {lot.occupiedSpots}/{lot.totalSpots}
                        </p>
                        <div style={{ 
                          width: '100%', 
                          height: '6px', 
                          background: '#f1f5f9', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${(lot.occupiedSpots / lot.totalSpots) * 100}%`, 
                            height: '100%', 
                            background: (lot.occupiedSpots / lot.totalSpots) > 0.8 ? '#ef4444' : '#6366f1'
                          }}></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        ) : activeTab === 'manage-lots' ? (
          <section className="manage-lots-section" style={{ padding: '20px' }}>
            {isAddingLot && (
              <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginBottom: '20px' }}>Add New Parking Lot</h3>
                  <form onSubmit={handleAddLot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Lot Name" required value={newLot.name} onChange={e => setNewLot({...newLot, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" step="any" placeholder="Latitude" required value={newLot.lat} onChange={e => setNewLot({...newLot, lat: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1 }} />
                      <input type="number" step="any" placeholder="Longitude" required value={newLot.lon} onChange={e => setNewLot({...newLot, lon: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1 }} />
                    </div>
                    <input type="number" placeholder="Price Per Hour (NPR)" required value={newLot.pricePerHour} onChange={e => setNewLot({...newLot, pricePerHour: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <input type="number" placeholder="Total Spots" required value={newLot.totalSpots} onChange={e => setNewLot({...newLot, totalSpots: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <select value={newLot.type} onChange={e => setNewLot({...newLot, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <option value="car">Car Only</option>
                      <option value="bike">Bike Only</option>
                      <option value="both">Both</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" style={{ flex: 1, background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Save Lot</button>
                      <button type="button" onClick={() => setIsAddingLot(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditingLot && (
              <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ marginBottom: '20px' }}>Edit Parking Lot</h3>
                  <form onSubmit={handleUpdateLot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Lot Name" required value={editLot.name} onChange={e => setEditLot({...editLot, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" step="any" placeholder="Latitude" required value={editLot.lat} onChange={e => setEditLot({...editLot, lat: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1 }} />
                      <input type="number" step="any" placeholder="Longitude" required value={editLot.lon} onChange={e => setEditLot({...editLot, lon: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1 }} />
                    </div>
                    <input type="number" placeholder="Price Per Hour (NPR)" required value={editLot.pricePerHour} onChange={e => setEditLot({...editLot, pricePerHour: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <input type="number" placeholder="Total Spots" required value={editLot.totalSpots} onChange={e => setEditLot({...editLot, totalSpots: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <select value={editLot.type} onChange={e => setEditLot({...editLot, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <option value="car">Car Only</option>
                      <option value="bike">Bike Only</option>
                      <option value="both">Both</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" style={{ flex: 1, background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Update Lot</button>
                      <button type="button" onClick={() => setIsEditingLot(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="lots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {allLots.map(lot => (
                <div key={lot._id} className="lot-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>{lot.name}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{lot.type.toUpperCase()} • {lot.totalSpots} Spots</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal(lot)} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <Settings size={20} />
                      </button>
                      <button onClick={() => handleDeleteLot(lot._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#6366f1' }}>NPR {lot.pricePerHour}/hr</span>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: lot.status === 'available' ? '#f0fdf4' : '#fef2f2', color: lot.status === 'available' ? '#16a34a' : '#dc2626' }}>
                      {lot.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === 'users' ? (
          <section className="users-section" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>Platform Users</h3><button onClick={handleCreateGuard} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontWeight: '600' }}>Create Guard Login</button>
              <div style={{ position: 'relative', width: '300px' }}>
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#64748b' }}>User</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#64748b' }}>Email</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#64748b' }}>Role</th>
                    <th style={{ padding: '15px 20px', fontWeight: '600', color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers
                    .filter(u => 
                      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={u.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{u.username}</span>
                          </div>
                        </td>
                        <td style={{ padding: '15px 20px', color: '#64748b' }}>{u.email}</td>
                        <td style={{ padding: '15px 20px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: u.role === 'guard' ? '#ecfeff' : '#f8fafc', color: u.role === 'guard' ? '#0e7490' : '#64748b' }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <button onClick={() => handleDeleteUser(u._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : activeTab === 'settings' ? (
          <section className="settings-section" style={{ padding: '20px' }}>
            <div style={{ maxWidth: '600px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '25px', fontSize: '1.25rem', fontWeight: '700' }}>System Configuration</h3>
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Currency</label>
                  <select value={systemConfig.currency} onChange={e => setSystemConfig({...systemConfig, currency: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <option value="NPR">Nepalese Rupee (NPR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="INR">Indian Rupee (INR)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Grace Period (Minutes)</label>
                  <input type="number" value={systemConfig.gracePeriod} onChange={e => setSystemConfig({...systemConfig, gracePeriod: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Tax Rate (%)</label>
                  <input type="number" value={systemConfig.taxRate} onChange={e => setSystemConfig({...systemConfig, taxRate: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                </div>
                <button type="submit" style={{ marginTop: '10px', background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Save Changes</button>
              </form>
            </div>
          </section>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <h3>Section coming soon...</h3>
          </div>
        )}

        {/* Floating Add Button for Mobile */}
        <button className="floating-add-btn">
          <Plus size={32} color="white" />
        </button>

        {/* Bottom Navigation for Mobile */}
        <nav className="admin-bottom-nav">
          <button className="nav-item active">
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </button>
          <button className="nav-item">
            <MapIcon size={24} />
            <span>Map</span>
          </button>
          <div className="nav-placeholder"></div>
          <button className="nav-item">
            <FileText size={24} />
            <span>Logs</span>
          </button>
          <button className="nav-item">
            <Settings size={24} />
            <span>Setup</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default AdminDashboard;
