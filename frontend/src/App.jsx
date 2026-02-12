import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword'; // Ensure ForgotPassword is imported
import './styles/global.css';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import PublicLayout from './components/PublicLayout';
import BottomNavbar from './components/BottomNavbar';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <div className="app">
      <main>
        {children}
      </main>
      {user && !isAdminRoute && <BottomNavbar />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap the entire application with AuthProvider */}
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Add forgot password route */}

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
