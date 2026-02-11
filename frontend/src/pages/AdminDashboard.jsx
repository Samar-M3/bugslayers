import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  FileText, 
  Settings, 
  Bell, 
  TrendingUp, 
  Car, 
  Bike, 
  Truck, 
  DollarSign, 
  CreditCard, 
  Plus,
  Trash2,
  Pencil,
  X,
  LogOut,
  ChevronRight,
  Users
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
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/AdminDashboard.css';

// Fix for default marker icon in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

const MapSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const map = useMap();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const latlng = { lat, lng: lon };
    onLocationSelect(latlng);
    map.flyTo(latlng, 15);
    setResults([]);
    setQuery(result.display_name);
  };

  return (
    <div className="map-search-container" style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 1000, width: '250px' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e);
            }
          }}
          placeholder="Search location..."
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        />
        <button type="button" onClick={handleSearch} disabled={isSearching} style={{ padding: '8px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isSearching ? '...' : 'Go'}
        </button>
      </div>
      {results.length > 0 && (
        <ul style={{ background: 'white', listStyle: 'none', padding: '0', margin: '5px 0 0 0', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map((result) => (
            <li
              key={result.place_id}
              onClick={() => selectLocation(result)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '12px' }}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const [stats, setStats] = useState({
    revenue: 0,
    activeSessions: 0,
    totalLots: 0,
    totalUsers: 0,
    occupancyRate: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [allLots, setAllLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [isEditingLot, setIsEditingLot] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [newLot, setNewLot] = useState({
    name: '',
    lat: '',
    lon: '',
    pricePerHour: '',
    totalSpots: '',
    type: 'both'
  });
  const [markerPosition, setMarkerPosition] = useState(null);

  useEffect(() => {
    if (markerPosition) {
      setNewLot(prev => ({ ...prev, lat: markerPosition.lat.toString(), lon: markerPosition.lng.toString() }));
    }
  }, [markerPosition]);

  useEffect(() => {
    if (editingLot && !markerPosition) {
      setMarkerPosition({ lat: parseFloat(editingLot.lat), lng: parseFloat(editingLot.lon) });
    }
  }, [editingLot]);

  const fetchLots = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch('http://localhost:8000/api/v1/admin/lots', {
        headers
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
    
    const lat = parseFloat(newLot.lat);
    const lon = parseFloat(newLot.lon);
    const pricePerHour = parseFloat(newLot.pricePerHour);
    const totalSpots = parseInt(newLot.totalSpots);

    if (isNaN(lat) || isNaN(lon) || isNaN(pricePerHour) || isNaN(totalSpots)) {
      alert('Please enter valid numbers for coordinates, price, and spots.');
      return;
    }

    // Convert string inputs to numbers for the backend
    const lotData = {
      ...newLot,
      lat,
      lon,
      pricePerHour,
      totalSpots
    };

    console.log('Sending lot data:', lotData);

    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/lots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lotData)
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text || res.statusText };
      }
      
      if (res.ok) {
        setIsAddingLot(false);
        setNewLot({ name: '', lat: '', lon: '', pricePerHour: '', totalSpots: '', type: 'both' });
        fetchLots();
        alert('Parking lot added successfully!');
      } else {
        alert(`Error: ${data.message || 'Failed to add parking lot'}`);
      }
    } catch (err) {
      console.error('Error adding lot:', err);
      alert(`Network error while adding parking lot: ${err.message}`);
    }
  };

  const handleUpdateLot = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const lat = parseFloat(editingLot.lat);
    const lon = parseFloat(editingLot.lon);
    const pricePerHour = parseFloat(editingLot.pricePerHour);
    const totalSpots = parseInt(editingLot.totalSpots);

    if (isNaN(lat) || isNaN(lon) || isNaN(pricePerHour) || isNaN(totalSpots)) {
      alert('Please enter valid numbers for coordinates, price, and spots.');
      return;
    }

    const lotData = {
      ...editingLot,
      lat,
      lon,
      pricePerHour,
      totalSpots
    };

    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/lots/${editingLot._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lotData)
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text || res.statusText };
      }
      
      if (res.ok) {
        setIsEditingLot(false);
        setEditingLot(null);
        fetchLots();
      } else {
        alert(`Error: ${data.message || 'Failed to update parking lot'}`);
      }
    } catch (err) {
      console.error('Error updating lot:', err);
      alert(`Network error while updating parking lot: ${err.message}`);
    }
  };

  const handleDeleteLot = async (e, id) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm('Are you sure you want to delete this parking lot?');
    if (!confirmed) return;
    
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

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [statsRes, trendsRes, activityRes, lotsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/admin/stats', { headers }),
          fetch('http://localhost:8000/api/v1/admin/revenue-trends', { headers }),
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

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
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
            <FileText size={20} />
            <span>Revenue Reports</span>
          </button>
          <button className={activeTab === 'manage-lots' ? 'active' : ''} onClick={() => setActiveTab('manage-lots')}>
            <Plus size={20} />
            <span>Manage Lots</span>
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
            <h1>{activeTab === 'dashboard' ? 'Revenue Hub' : activeTab === 'manage-lots' ? 'Parking Management' : 'Admin Hub'}</h1>
            <p>{activeTab === 'dashboard' ? 'PARKING MANAGEMENT' : activeTab === 'manage-lots' ? 'CRUD OPERATIONS' : 'SYSTEM SETTINGS'}</p>
          </div>
          <div className="header-actions">
            {activeTab === 'manage-lots' && (
              <button className="add-lot-btn" onClick={() => setIsAddingLot(true)} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Add New Lot
              </button>
            )}
            <button className="notif-btn">
              <Bell size={24} />
              <span className="notif-badge"></span>
            </button>
            <div className="admin-profile-pic"></div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* KPI Grid */}
            <section className="kpi-grid">
              <div className="kpi-card main-revenue">
                <div className="kpi-content">
                  <span className="kpi-label">TOTAL REVENUE</span>
                  <h2 className="kpi-value">NPR {stats.revenue.toLocaleString()}</h2>
                  <div className="kpi-trend positive">
                    <TrendingUp size={16} />
                    <span>+12.5% vs last month</span>
                  </div>
                </div>
                <div className="kpi-icon-box">
                  <DollarSign size={28} color="#6366f1" />
                </div>
              </div>

              <div className="kpi-row">
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
              <div className="chart-container">
                <div className="chart-header">
                  <h3>Revenue Trends</h3>
                  <span className="chart-subtitle">LAST 24 HOURS</span>
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {revenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.amount === Math.max(...revenueData.map(d => d.amount)) ? '#6366f1' : '#e2e8f0'} />
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
        ) : activeTab === 'manage-lots' ? (
          <section className="manage-lots-section" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>Manage Parking Lots</h2>
                <p style={{ color: '#64748b' }}>Create, update or remove parking locations</p>
              </div>
              <button 
                onClick={() => setIsAddingLot(true)}
                style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
              >
                <Plus size={20} /> Add New Lot
              </button>
            </div>
            {isAddingLot && (
              <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '600px', maxWidth: '95vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ marginBottom: '20px' }}>Add New Parking Lot</h3>
                  <form onSubmit={handleAddLot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Lot Name" required value={newLot.name} onChange={e => setNewLot({...newLot, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    
                    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                      <MapContainer center={[27.7172, 85.3240]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapSearch onLocationSelect={setMarkerPosition} />
                        <LocationMarker position={markerPosition} setPosition={setMarkerPosition} />
                      </MapContainer>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Click on the map or search to set location</p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" step="any" placeholder="Latitude" required value={newLot.lat} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, background: '#f8fafc' }} />
                      <input type="number" step="any" placeholder="Longitude" required value={newLot.lon} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, background: '#f8fafc' }} />
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
                      <button type="button" onClick={() => { setIsAddingLot(false); setMarkerPosition(null); }} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditingLot && editingLot && (
              <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '600px', maxWidth: '95vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3 style={{ marginBottom: '20px' }}>Edit Parking Lot</h3>
                  <form onSubmit={handleUpdateLot} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Lot Name" required value={editingLot.name} onChange={e => setEditingLot({...editingLot, name: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    
                    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                      <MapContainer center={[parseFloat(editingLot.lat) || 27.7172, parseFloat(editingLot.lon) || 85.3240]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapSearch onLocationSelect={(pos) => {
                          setMarkerPosition(pos);
                          setEditingLot(prev => ({ ...prev, lat: pos.lat.toString(), lon: pos.lng.toString() }));
                        }} />
                        <LocationMarker position={markerPosition} setPosition={(pos) => {
                          setMarkerPosition(pos);
                          setEditingLot(prev => ({ ...prev, lat: pos.lat.toString(), lon: pos.lng.toString() }));
                        }} />
                      </MapContainer>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Click on the map or search to set location</p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" step="any" placeholder="Latitude" required value={editingLot.lat} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, background: '#f8fafc' }} />
                      <input type="number" step="any" placeholder="Longitude" required value={editingLot.lon} readOnly style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 1, background: '#f8fafc' }} />
                    </div>
                    <input type="number" placeholder="Price Per Hour (NPR)" required value={editingLot.pricePerHour} onChange={e => setEditingLot({...editingLot, pricePerHour: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <input type="number" placeholder="Total Spots" required value={editingLot.totalSpots} onChange={e => setEditingLot({...editingLot, totalSpots: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <select value={editingLot.type} onChange={e => setEditingLot({...editingLot, type: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <option value="car">Car Only</option>
                      <option value="bike">Bike Only</option>
                      <option value="both">Both</option>
                    </select>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button type="submit" style={{ flex: 1, background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Update Lot</button>
                      <button type="button" onClick={() => { setIsEditingLot(false); setEditingLot(null); setMarkerPosition(null); }} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingLot(lot); setIsEditingLot(true); }} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <Pencil size={18} />
                      </button>
                      <button onClick={(e) => handleDeleteLot(e, lot._id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>
                        <Trash2 size={20} />
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
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <h3>Other sections coming soon...</h3>
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
