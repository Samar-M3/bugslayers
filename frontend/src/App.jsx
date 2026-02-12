import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuardEntryScanner from './pages/GuardEntryScanner';
import GuardExitScanner from './pages/GuardExitScanner';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword'; // Ensure ForgotPassword is imported
import './styles/global.css';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import BookingHistory from './pages/BookingHistory';
import PublicLayout from './components/PublicLayout';
import BottomNavbar from './components/BottomNavbar';

/**
 * Layout Component
 * Wraps the main content and adds a BottomNavbar for authenticated users
 * who are not on admin pages.
 */
const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Display a loading state while checking authentication
  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <div className="app">
      <main>
        {children}
      </main>
      {/* Show Bottom Navigation Bar for normal users (not admins) */}
      {user && !isAdminRoute && <BottomNavbar />}
    </div>
  );
};

/**
 * Main App Component
 * Configures Routing, Auth Context, and Global Providers.
 */
function App() {
  return (
    <Router>
      <AuthProvider> {/* Global Authentication State Provider */}
        <LocationProvider> {/* User Location Data Provider */}
          <Layout>
          <Routes>
            {/* --- Public Routes (No Login Required) --- */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* --- Protected Routes (Login Required) --- */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            {/* Admin only routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/entry" element={<ProtectedRoute roles={['superadmin']}><GuardEntryScanner /></ProtectedRoute>} />
            <Route path="/admin/exit" element={<ProtectedRoute roles={['superadmin']}><GuardExitScanner /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
            
            {/* 404 Not Found Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Layout>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
