import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuardDashboard from './pages/GuardDashboard';
import GuardEntryScanner from './pages/GuardEntryScanner';
import GuardExitScanner from './pages/GuardExitScanner';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './styles/global.css';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import BookingHistory from './pages/BookingHistory';
import PublicLayout from './components/PublicLayout';
import BottomNavbar from './components/BottomNavbar';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isGuardRoute = location.pathname.startsWith('/guard');

  if (loading) {
    return <div>Loading application...</div>;
  }

  const showBottomNavbar = user && user.role === 'driver' && !isAdminRoute && !isGuardRoute;

  return (
    <div className="app">
      <main>{children}</main>
      {showBottomNavbar && <BottomNavbar />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
              <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
              <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
              <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />

              <Route path="/dashboard" element={<ProtectedRoute roles={['driver']}><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminDashboard /></ProtectedRoute>} />

              <Route path="/guard" element={<ProtectedRoute roles={['guard']}><GuardDashboard /></ProtectedRoute>} />
              <Route path="/guard/entry" element={<ProtectedRoute roles={['guard']}><GuardEntryScanner /></ProtectedRoute>} />
              <Route path="/guard/exit" element={<ProtectedRoute roles={['guard']}><GuardExitScanner /></ProtectedRoute>} />

              <Route path="/profile" element={<ProtectedRoute roles={['driver']}><Profile /></ProtectedRoute>} />
              <Route path="/contact" element={<ProtectedRoute roles={['driver']}><Contact /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute roles={['driver']}><BookingHistory /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
