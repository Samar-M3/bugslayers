import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

const HomeRedirect = () => {
  const { user, loading, getDefaultRouteForRole } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <LandingPage />;
};

export default HomeRedirect;
