import React, { useState } from 'react';
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
  LogOut,
  ChevronRight
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
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock Data for Revenue Trends Chart
  const revenueData = [
    { time: '00:00', amount: 400 },
    { time: '03:00', amount: 300 },
    { time: '06:00', amount: 500 },
    { time: '09:00', amount: 800 },
    { time: '12:00', amount: 1100 },
    { time: '15:00', amount: 900 },
    { time: '18:00', amount: 1200 },
    { time: '21:00', amount: 700 },
    { time: '23:59', amount: 500 },
  ];

  // Mock Data for Recent Activity
  const recentActivity = [
    { id: 1, plate: 'BA 2 CH 4521', time: '14:23', type: 'Sedan', status: 'ACTIVE', color: '#f59e0b' },
    { id: 2, plate: 'P-01-002 PA 98', time: '13:50', type: 'Bike', amount: 'NPR 150', status: 'PAID', color: '#10b981' },
    { id: 3, plate: 'BAG 5 KHA 8802', time: '12:15', type: 'SUV', amount: 'NPR 1200', status: 'PAID', color: '#10b981' },
    { id: 4, plate: 'LU 1 CHA 3310', time: '11:45', type: 'Hatchback', amount: 'NPR 500', status: 'PAID', color: '#10b981' },
  ];

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
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            <span>Setup</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn">
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
            <h1>Revenue Hub</h1>
            <p>PARKING MANAGEMENT</p>
          </div>
          <div className="header-actions">
            <button className="notif-btn">
              <Bell size={24} />
              <span className="notif-badge"></span>
            </button>
            <div className="admin-profile-pic"></div>
          </div>
        </header>

        {/* KPI Grid */}
        <section className="kpi-grid">
          <div className="kpi-card main-revenue">
            <div className="kpi-content">
              <span className="kpi-label">Total Revenue Today</span>
              <h2 className="kpi-value">NPR 1,28,450</h2>
              <div className="kpi-trend positive">
                <TrendingUp size={16} />
                <span>+12.5% from yesterday</span>
              </div>
            </div>
            <div className="kpi-icon-box">
              <DollarSign size={24} color="#6366f1" />
            </div>
          </div>

          <div className="kpi-row">
            <div className="kpi-card secondary">
              <span className="kpi-label">Active Slots</span>
              <div className="kpi-sub-row">
                <span className="kpi-value-small">45/50</span>
                <span className="kpi-percentage">90% Full</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div className="kpi-card secondary">
              <span className="kpi-label">Digital vs Cash</span>
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
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#6366f1' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="recent-activity">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <button className="view-all">VIEW ALL</button>
          </div>
          <div className="activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon-box">
                  {item.type === 'Sedan' || item.type === 'Hatchback' ? <Car size={20} /> : 
                   item.type === 'Bike' ? <Bike size={20} /> : <Truck size={20} />}
                </div>
                <div className="activity-info">
                  <h4>{item.plate}</h4>
                  <p>Entry: {item.time} • {item.type}</p>
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
