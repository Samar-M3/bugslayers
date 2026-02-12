import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Correct import for jwt-decode

/**
 * AuthContext
 * Manages global authentication state, user session, and login/logout logic.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores decoded JWT payload (id, role, etc.)
  const [loading, setLoading] = useState(true); // Prevents flash of unauthenticated state
  const navigate = useNavigate();

  // Check for existing session on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        
        // Token expiration check (exp is in seconds, Date.now() in ms)
        if (decodedToken.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decodedToken); // Valid token found, restore session
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  /**
   * Login handler
   * Saves JWT to local storage and redirects based on user role.
   */
  const login = (token) => {
    localStorage.setItem('token', token);
    const decodedToken = jwtDecode(token);
    setUser(decodedToken);
    
    // Role-based redirection logic
    if (decodedToken.role === 'superadmin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  /**
   * Logout handler
   * Clears session and redirects to landing page.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access Auth state
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
