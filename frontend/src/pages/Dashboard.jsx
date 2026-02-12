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
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
};

/**
 * RoutingMachine Component
 * Uses Leaflet Routing Machine to draw the path from user to a parking lot.
 */
const RoutingMachine = ({ userLoc, destinationLoc }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !userLoc || !destinationLoc) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLoc[0], userLoc[1]),
        L.latLng(destinationLoc[0], destinationLoc[1])
      ],
      lineOptions: {
        styles: [{ color: '#6366f1', weight: 6 }]
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null // We already have our own markers
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, userLoc, destinationLoc]);

  return null;
};

const Dashboard = () => {
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

  // --- Logic: Fetch Data from Backend ---
  const fetchData = async (lat, lon) => {
    try {
      // Fetch Parking Lots with location if available
      let url = 'http://localhost:8000/api/v1/parking/lots';
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
        const sessionRes = await fetch('http://localhost:8000/api/v1/parking/active-session', {
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
          alert('Location not found in Nepal. Please try again.');
        }
      } catch (error) {
        console.error('Search error:', error);
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

  // Booking modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [slotsCount, setSlotsCount] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const openBooking = (lot) => {
    setSelectedLot(lot);
    setSlotsCount(1);
    setStartTime('');
    setEndTime('');
    setBookingOpen(true);
  };

  const submitBooking = async () => {
    if (!selectedLot) return;
    if (!startTime || !endTime) return alert('Please enter start and end time.');
    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        parkingLotId: selectedLot._id,
        slots: Number(slotsCount),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      };

      const res = await fetch('http://localhost:8000/api/v1/parking/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Booking successful!');
        setBookingOpen(false);
        // Refresh lots to update occupancy
        fetchData(userLocation?.[0], userLocation?.[1]);
      } else {
        alert(data.message || 'Booking failed.');
      }
    } catch (err) {
      console.error('Booking error', err);
      alert('Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

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
                        onClick={() => setDestination([lot.lat, lot.lon])}
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
          <h3>Nearby Parking</h3>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>×</button>
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
                <div className="lot-sub">{lot.distance ? `${lot.distance.toFixed(2)} km` : 'Nearby'} • NPR {lot.pricePerHour}/hr</div>
                <div style={{marginTop:8, display:'flex', gap:8}}>
                  <button className={`book-btn ${lot.status}`} disabled={lot.status === 'full'} onClick={() => openBooking(lot)}>{lot.status === 'full' ? 'Sold Out' : 'Book'}</button>
                  <button className="directions-btn-outline" onClick={() => { setSidebarOpen(false); setMapCenter([lot.lat, lot.lon]); setDestination([lot.lat, lot.lon]); startTracking(); }} title="Show Path"> <Navigation size={16} /> </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

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

      {/* Booking Modal */}
      {bookingOpen && selectedLot && (
        <div className="modal-backdrop" onClick={() => setBookingOpen(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Book: {selectedLot.name}</h3>
            <div className="booking-row">
              <label>Slots</label>
              <input type="number" min={1} max={Math.max(1, selectedLot.totalSpots - (selectedLot.occupiedSpots||0))} value={slotsCount} onChange={(e) => setSlotsCount(e.target.value)} />
            </div>
            <div className="booking-row">
              <label>Start</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="booking-row">
              <label>End</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="booking-actions">
              <button className="btn secondary" onClick={() => setBookingOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={submitBooking} disabled={bookingLoading}>{bookingLoading ? 'Booking...' : 'Confirm Booking'}</button>
            </div>
          </div>
        </div>
      )}

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