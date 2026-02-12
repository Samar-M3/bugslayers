import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useToast } from './ToastContext';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const { showToast } = useToast();
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const watchIdRef = useRef(null);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not available in your browser.', 'error');
      return;
    }

    if (watchIdRef.current) {
      setTrackingEnabled(true);
      return;
    }

    // get a quick current position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
      },
      (err) => {
        console.error('Error getting location:', err);
        showToast('Please enable location services to use the live map.', 'warning');
      },
      { enableHighAccuracy: true }
    );

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.error('Error tracking location:', error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    watchIdRef.current = id;
    setTrackingEnabled(true);
    try {
      localStorage.setItem('trackingEnabled', '1');
    } catch (e) {}
  };

  const stopTracking = () => {
    if (watchIdRef.current && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingEnabled(false);
    try {
      localStorage.removeItem('trackingEnabled');
    } catch (e) {}
  };

  useEffect(() => {
    // Auto-start tracking if user previously enabled it
    try {
      const stored = localStorage.getItem('trackingEnabled');
      if (stored === '1') startTracking();
    } catch (e) {}
    // Do not stop tracking on unmount — we want it to persist across navigation.
    // If you want to stop tracking when the app closes, clear in a different flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LocationContext.Provider value={{ trackingEnabled, userLocation, startTracking, stopTracking }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
};

export default LocationContext;
