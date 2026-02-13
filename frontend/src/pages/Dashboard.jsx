import React, { useState, useEffect, useRef } from 'react';
import {
  Search, 
  MapPin, 
  Navigation, 
  Clock, 
  Wallet, 
  User as UserIcon, 
  Compass,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet/dist/leaflet.css';
import '../styles/Dashboard.css';

// Fix for default Leaflet marker icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/**
 * Haversine Formula for Distance Calculation
 * Calculates the straight-line distance between two GPS coordinates in kilometers.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Result in km
  return d;
};

// Helper to convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// --- Map Customization Icons ---

// User's current position marker (Blue)
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Parking lot location marker (Green)
const parkingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

/**
 * RecenterMap Component
 * Automatically moves the map view to the user's current position.
 */
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !position) return;

    try {
      // Preserve the current zoom level when recentering so user zoom isn't forced.
      const currentZoom = map.getZoom ? map.getZoom() : 15;

      // Only recenter if the new position is meaningfully far from current center (avoid jitter)
      const currentCenter = map.getCenter();
      const newLatLng = L.latLng(position[0], position[1]);
      const distanceMeters = currentCenter ? currentCenter.distanceTo(newLatLng) : Infinity;

        // If the user recently interacted with the map, do not auto-recenter.
        if (map._userInteracted) return;

        if (distanceMeters > 50) { // only recenter if >50 meters away
          map.setView(newLatLng, currentZoom);
        }
    } catch (err) {
      console.error('RecenterMap error', err);
    }
  }, [position, map]);
  return null;
};

/**
 * MapInteractionHandler
 * Attaches DOM listeners to detect user gestures (mouse/touch/wheel/keyboard) and
 * sets a temporary flag on the map to prevent automatic recenters or fitBounds.
 */
const MapInteractionHandler = () => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    let timeoutId = null;

    const setUserInteracted = () => {
      try {
        map._userInteracted = true;
        if (timeoutId) clearTimeout(timeoutId);
        // After 30s of no interaction, allow auto actions again
        timeoutId = setTimeout(() => { map._userInteracted = false; timeoutId = null; }, 30000);
      } catch (e) {
        console.error('Interaction handler error', e);
      }
    };

    const container = map.getContainer();
    container.addEventListener('mousedown', setUserInteracted);
    container.addEventListener('touchstart', setUserInteracted);
    container.addEventListener('wheel', setUserInteracted);
    window.addEventListener('keydown', setUserInteracted);

    return () => {
      container.removeEventListener('mousedown', setUserInteracted);
      container.removeEventListener('touchstart', setUserInteracted);
      container.removeEventListener('wheel', setUserInteracted);
      window.removeEventListener('keydown', setUserInteracted);
      if (timeoutId) clearTimeout(timeoutId);
      map._userInteracted = false;
    };
  }, [map]);
  return null;
};

/**
 * RoutingMachine Component (fastest-route using Google Directions, fallback to OSRM)
 * Prefers the route with the lowest duration (fastest) as Google Maps chooses.
 */
const RoutingMachine = ({ userLoc, destinationLoc }) => {
  const map = useMap();

  // Decode an encoded polyline (Google polyline algorithm) to an array of [lat, lon]
  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    const points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLon = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLon;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  };

  useEffect(() => {
    if (!map || !userLoc || !destinationLoc) return;

    const [uLat, uLon] = userLoc;
    const [dLat, dLon] = destinationLoc;

    const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Clear any existing route layer before drawing a new one
    if (map._activeRouteLayer) {
      map.removeLayer(map._activeRouteLayer);
      map._activeRouteLayer = null;
    }

    const drawGeoPoints = (points) => {
      // Clear any existing route first
      if (map._activeRouteLayer) {
        map.removeLayer(map._activeRouteLayer);
        map._activeRouteLayer = null;
      }
      map._activeRouteLayer = L.polyline(points, { color: '#6366f1', weight: 6, opacity: 0.95 }).addTo(map);
      const bounds = map._activeRouteLayer.getBounds();
        if (bounds.isValid() && !map._userInteracted) map.fitBounds(bounds.pad(0.15));
    };

    const fetchGoogleAndDraw = async () => {
      try {
        if (!GOOGLE_KEY) return false;
        // Google Directions REST API expects origin and destination as lat,lng
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${uLat},${uLon}&destination=${dLat},${dLon}&alternatives=true&mode=driving&key=${GOOGLE_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data || data.status !== 'OK' || !data.routes || data.routes.length === 0) {
          console.warn('Google Directions unavailable or returned no routes', data?.status);
          return false;
        }

        // Choose route with smallest duration (fastest)
        let fastest = data.routes[0];
        for (const r of data.routes) {
          const rDur = r.legs.reduce((s, leg) => s + (leg.duration?.value || 0), 0);
          const fDur = fastest.legs.reduce((s, leg) => s + (leg.duration?.value || 0), 0);
          if (rDur < fDur) fastest = r;
        }

        // Decode polyline to lat,lng pairs
        const encoded = fastest.overview_polyline?.points;
        const latlngs = decodePolyline(encoded);
        drawGeoPoints(latlngs);
        return true;
      } catch (err) {
        console.error('Google routing error', err);
        return false;
      }
    };

    const fetchOSRMAndDraw = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${uLon},${uLat};${dLon},${dLat}?alternatives=true&overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();
        if (!data || !data.routes || data.routes.length === 0) return false;

        // Choose route with smallest duration (fastest) from OSRM
        let fastest = data.routes[0];
        for (const r of data.routes) {
          if (r.duration < fastest.duration) fastest = r;
        }

        const coords = fastest.geometry.coordinates.map(c => [c[1], c[0]]);
        drawGeoPoints(coords);
        return true;
      } catch (err) {
        console.error('OSRM routing error', err);
        return false;
      }
    };

    (async () => {
      const usedGoogle = await fetchGoogleAndDraw();
      if (!usedGoogle) await fetchOSRMAndDraw();
    })();

    return () => {
      if (map._activeRouteLayer) {
        map.removeLayer(map._activeRouteLayer);
        map._activeRouteLayer = null;
      }
    };
  }, [map, userLoc, destinationLoc]);

  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  // --- State Management ---
  const [isParked, setIsParked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [timer, setTimer] = useState('00:00:00');
  const [currentBill, setCurrentBill] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const { userLocation, trackingEnabled, startTracking } = useLocationContext();
  const handleRequestLocation = startTracking;

  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default to Kathmandu
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [destination, setDestination] = useState(null);
  const [selectedDirectionLot, setSelectedDirectionLot] = useState(null);
  const getAvailableSlots = (lot) => Math.max(0, (lot.totalSpots || 0) - (lot.occupiedSpots || 0));
  const getOccupancyPercent = (lot) => {
    if (!lot.totalSpots) return 0;
    return Math.min(100, Math.round(((lot.occupiedSpots || 0) / lot.totalSpots) * 100));
  };
  const getLotDistanceKm = (lot) => {
    if (!lot) return null;
    if (typeof lot.distance === 'number') return lot.distance;
    if (!userLocation) return null;
    return calculateDistance(userLocation[0], userLocation[1], lot.lat, lot.lon);
  };
  const getEstimatedDriveMinutes = (lot) => {
    const distanceKm = getLotDistanceKm(lot);
    if (!distanceKm) return null;
    const avgCitySpeedKmH = 22;
    return Math.max(2, Math.round((distanceKm / avgCitySpeedKmH) * 60));
  };

  // --- Logic: Fetch Data from Backend ---
  const fetchData = async (lat, lon) => {
    try {
      // Fetch Parking Lots with location if available
      let url = 'https://parkfasto-backend-2.onrender.com/api/v1/parking/lots';
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      
      const lotsRes = await fetch(url);
      const lotsData = await lotsRes.json();
      if (lotsData.success) {
        let processedLots = lotsData.data;
        
        // If userLocation is available, calculate and inject distance locally
        if (userLocation) {
          processedLots = processedLots.map(lot => ({
            ...lot,
            distance: calculateDistance(userLocation[0], userLocation[1], lot.lat, lot.lon)
          })).sort((a, b) => a.distance - b.distance); // Sort by closest
        }
        
        setParkingLots(processedLots);
      }

      // Fetch Active Session (Requires Auth Token)
      const token = localStorage.getItem('token');
      if (token) {
        const sessionRes = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/parking/active-session', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.data) {
          setActiveSession(sessionData.data);
          setIsParked(true);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
   }, []);

  // Live occupancy updates for nearby parking cards
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(userLocation?.[0], userLocation?.[1]);
    }, 12000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // --- Logic: Search Location (OpenStreetMap Nominatim API) ---
  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Nepal')}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLon = parseFloat(lon);
          setMapCenter([newLat, newLon]);
          startTracking(); // Show the map and start live tracking if a location is found
          
          // Fetch nearby lots for the searched location
          fetchData(newLat, newLon);
        } else {
          showToast('Location not found in Nepal. Please try again.', 'warning');
        }
      } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
      }
    }
  };

  // Debounced suggestions: combine known lots and Nominatim place suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const lower = searchQuery.toLowerCase();
        // Local matches from fetched parking lots
        const localMatches = parkingLots
          .filter(l => l.name && l.name.toLowerCase().includes(lower))
          .slice(0, 5)
          .map(l => ({ type: 'lot', id: l._id, label: l.name, lat: l.lat, lon: l.lon }));

        // Remote place suggestions (Nominatim)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Nepal')}&limit=5`);
        const places = await res.json();
        const placeSuggestions = (places || []).map(p => ({ type: 'place', label: p.display_name, lat: parseFloat(p.lat), lon: parseFloat(p.lon) }));

        // Merge and dedupe by label
        const merged = [...localMatches, ...placeSuggestions];
        const seen = new Set();
        const dedup = merged.filter(s => {
          if (seen.has(s.label)) return false; seen.add(s.label); return true;
        });

        setSearchSuggestions(dedup.slice(0, 6));
        setShowSuggestions(true);
      } catch (err) {
        console.error('Suggestion fetch error', err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, parkingLots]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // --- Logic: Live Geolocation Tracking ---
  // Use global location context for persistent tracking
 

  // When userLocation changes, refresh lots distances and fetch nearby lots
  useEffect(() => {
    if (!userLocation) return;
    const [lat, lon] = userLocation;
    // Re-calculate distances for existing lots without fetching again
    setParkingLots(prevLots => {
      const updated = prevLots.map(lot => ({
        ...lot,
        distance: calculateDistance(lat, lon, lot.lat, lot.lon)
      })).sort((a, b) => a.distance - b.distance);
      return updated;
    });

    // Fetch nearby lots based on real location
    fetchData(lat, lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // --- Logic: Live Parking Timer & Fee ---
  useEffect(() => {
    if (!isParked || !activeSession) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diffInMs = now - new Date(activeSession.startTime);
      
      const hours = Math.floor(diffInMs / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000).toString().padStart(2, '0');
      setTimer(`${hours}:${minutes}:${seconds}`);

      const diffInHours = diffInMs / (1000 * 60 * 60);
      setCurrentBill(Math.ceil(diffInHours * (activeSession.parkingLot?.pricePerHour || 25)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isParked, activeSession]);

  const { user } = useAuth();
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="dashboard-container">
      {/* Map Section - Background */}
      <div className="map-section">
        {!trackingEnabled ? (
          <div className="map-placeholder request-location">
            <div className="location-prompt">
              <MapPin size={48} color="#6366f1" />
              <h3>Live Map Tracking</h3>
              <p>Allow access to your location to find nearby parking and track your movement live.</p>
              <button className="enable-location-btn" onClick={handleRequestLocation}>
                Enable Live Tracking
              </button>
            </div>
          </div>
        ) : (
          <div className="map-wrapper">
            <MapContainer 
              className={selectedDirectionLot ? 'map-with-direction-panel' : ''}
              center={mapCenter} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              
              <RecenterMap position={mapCenter} />

              {userLocation && destination && (
                <RoutingMachine userLoc={userLocation} destinationLoc={destination} />
              )}

              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>You are here (Live)</Popup>
                </Marker>
              )}

              {parkingLots.map(lot => (
                <Marker key={lot._id} position={[lot.lat, lot.lon]} icon={parkingIcon}>
                  <Popup>
                    <div className="map-popup-content">
                      <strong className="popup-title">{lot.name}</strong>
                      <div className="popup-details">
                        <div className="popup-detail-item">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{(lot.type || 'BOTH').toUpperCase()}</span>
                        </div>
                        <div className="popup-detail-item">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value">NPR {lot.pricePerHour}/hr</span>
                        </div>
                        <div className="popup-detail-item">
                          <span className="detail-label">Occupancy:</span>
                          <span className="detail-value">{lot.occupiedSpots || 0}/{lot.totalSpots || 0}</span>
                        </div>
                      </div>
                      
                      <div className="popup-occupancy-bar">
                        <div 
                          className="popup-occupancy-fill" 
                          style={{ 
                            width: `${Math.min(100, ((lot.occupiedSpots || 0) / (lot.totalSpots || 1)) * 100)}%`,
                            backgroundColor: ((lot.occupiedSpots || 0) / (lot.totalSpots || 1)) > 0.9 ? '#ef4444' : '#6366f1'
                          }}
                        ></div>
                      </div>

                      <button 
                        className="get-directions-btn"
                        onClick={() => {
                          setDestination([lot.lat, lot.lon]);
                          setSelectedDirectionLot(lot);
                          setSidebarOpen(false);
                        }}
                      >
                        Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      {/* Overlaid Header */}
      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>

        <div className="search-bar-container" ref={suggestionsRef}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search location in Nepal..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => { if (searchSuggestions.length) setShowSuggestions(true); }}
          />

          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {searchSuggestions.map((s, idx) => (
                <div key={idx} className="suggestion-item" onClick={() => {
                  setSearchQuery(s.label);
                  setMapCenter([s.lat, s.lon]);
                  if (s.type === 'lot') setDestination([s.lat, s.lon]);
                  setShowSuggestions(false);
                }}>
                  <div className="suggestion-type">{s.type === 'lot' ? 'Lot' : 'Place'}</div>
                  <div className="suggestion-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Sidebar for Nearby Parking */}
      <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <h3>Nearby Parking</h3>
            <p className="sidebar-live-label">Live slots update every 12s</p>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>X</button>
        </div>
        <div className="sidebar-list">
          {parkingLots.filter(lot => (lot.distance || 999) <= 5).length === 0 && <div className="empty-note">No nearby lots found within 5 km.</div>}
          {parkingLots.filter(lot => (lot.distance || 999) <= 5).map(lot => (
            <div key={lot._id} className="sidebar-lot">
              <div className="sidebar-lot-left">
                <img src={`https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=200`} alt={lot.name} />
              </div>
              <div className="sidebar-lot-right">
                <div className="lot-title">{lot.name}</div>
                <div className="lot-sub">{lot.distance ? `${lot.distance.toFixed(2)} km` : 'Nearby'} - NPR {lot.pricePerHour}/hr</div>
                <div className="lot-live-meta">
                  <span className={`slots-pill ${lot.status === 'full' ? 'full' : 'available'}`}>
                    {getAvailableSlots(lot)} slots live
                  </span>
                  <span className="occupancy-mini">{getOccupancyPercent(lot)}% occupied</span>
                </div>
                <div className="lot-actions">
                  <button
                    className="lot-detail-btn"
                    onClick={() => navigate(`/parking/lot/${lot._id}`, { state: { lot, distance: lot.distance } })}
                  >
                    View Details
                  </button>
                  <button
                    className={`book-btn ${lot.status}`}
                    disabled={lot.status === 'full'}
                    onClick={() => navigate(`/parking/lot/${lot._id}`, { state: { lot, distance: lot.distance } })}
                  >
                    {lot.status === 'full' ? 'Sold Out' : 'Book Now'}
                  </button>
                  <button className="directions-btn-outline" onClick={() => { setSidebarOpen(false); setMapCenter([lot.lat, lot.lon]); setDestination([lot.lat, lot.lon]); setSelectedDirectionLot(lot); startTracking(); }} title="Show Path"> <Navigation size={16} /> </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {selectedDirectionLot && (
        <aside className="direction-details-panel">
          <div className="direction-panel-head">
            <h3>Direction Details</h3>
            <button className="close-sidebar" onClick={() => setSelectedDirectionLot(null)}>X</button>
          </div>

          <div className="direction-panel-card">
            <h4>{selectedDirectionLot.name}</h4>
            <p>{getLotDistanceKm(selectedDirectionLot) ? `${getLotDistanceKm(selectedDirectionLot).toFixed(2)} km away` : 'Distance unavailable'}</p>

            <div className="direction-panel-grid">
              <div>
                <span>Estimated Drive</span>
                <strong>{getEstimatedDriveMinutes(selectedDirectionLot) ? `${getEstimatedDriveMinutes(selectedDirectionLot)} min` : 'N/A'}</strong>
              </div>
              <div>
                <span>Live Slots</span>
                <strong>{getAvailableSlots(selectedDirectionLot)}</strong>
              </div>
              <div>
                <span>Occupancy</span>
                <strong>{getOccupancyPercent(selectedDirectionLot)}%</strong>
              </div>
              <div>
                <span>Rate</span>
                <strong>NPR {selectedDirectionLot.pricePerHour}/hr</strong>
              </div>
            </div>

            <div className="direction-panel-actions">
              <button
                className="lot-detail-btn"
                onClick={() => navigate(`/parking/lot/${selectedDirectionLot._id}`, { state: { lot: selectedDirectionLot, distance: getLotDistanceKm(selectedDirectionLot) } })}
              >
                View Details
              </button>
              <button
                className={`book-btn ${selectedDirectionLot.status}`}
                disabled={selectedDirectionLot.status === 'full'}
                onClick={() => navigate(`/parking/lot/${selectedDirectionLot._id}`, { state: { lot: selectedDirectionLot, distance: getLotDistanceKm(selectedDirectionLot) } })}
              >
                {selectedDirectionLot.status === 'full' ? 'Sold Out' : 'Book Now'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Overlaid Active Session Card */}
      {isParked && (
        <div className="active-session-card">
          <div className="session-info">
            <div className="session-header">
              <span className="live-dot"></span>
              <h3>Active Parking</h3>
            </div>
            <div className="session-details">
              <div className="detail-item">
                <Clock size={16} />
                <span>{timer}</span>
              </div>
              <div className="detail-item">
                <MapPin size={16} />
                <span>{activeSession.parkingLot?.name || 'Active Spot'}</span>
              </div>
              <div className="detail-item bill">
                <Wallet size={16} />
                <span>NPR {currentBill}</span>
              </div>
            </div>
          </div>
          <button className="checkout-btn" onClick={() => setIsParked(false)}>
            Check Out
          </button>
        </div>
      )}

      {/* Bottom discovery sheet removed — Nearby Parking is now in the sidebar */}

      {/* Bottom Middle Location Button */}
      <button 
        className="bottom-location-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (userLocation) {
            setMapCenter([...userLocation]);
          } else {
            handleRequestLocation();
          }
        }}
        title="Go to my location"
      >
        <MapPin size={24} fill="currentColor" />
      </button>
    </div>
  );
};

export default Dashboard;


