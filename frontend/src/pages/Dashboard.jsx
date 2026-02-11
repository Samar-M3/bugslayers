import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  MapPin, 
  Navigation, 
  Clock, 
  Wallet, 
  User as UserIcon, 
  History, 
  Compass,
  Car,
  Bike,
  Zap,
  ChevronRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
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

// Custom User Location Icon
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom Parking Icon
const parkingIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map recentering
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
};

const Dashboard = () => {
  // --- State Management ---
  const [isParked, setIsParked] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [timer, setTimer] = useState('00:00:00');
  const [currentBill, setCurrentBill] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]); // Default to Kathmandu
  const [activeCategory, setActiveCategory] = useState('car');
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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
      if (lotsData.success) setParkingLots(lotsData.data);

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
          setTrackingEnabled(true); // Show the map if a location is found
          
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

  // --- Logic: Live Geolocation Tracking ---
  useEffect(() => {
    let watchId = null;

    if (trackingEnabled && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          console.log("Updated location:", latitude, longitude);
          
          // Only fetch nearby lots based on real location if map center hasn't been moved manually
          // Or just update nearby lots whenever location changes significantly
          fetchData(latitude, longitude);
        },
        (error) => {
          console.error("Error tracking location:", error);
          alert("Please enable location services to use the live map.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingEnabled]);

  const handleRequestLocation = () => {
    setTrackingEnabled(true);
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

              {userLocation && (
                <Marker position={userLocation} icon={userIcon}>
                  <Popup>You are here (Live)</Popup>
                </Marker>
              )}

              {parkingLots.map(lot => (
                <Marker key={lot._id} position={[lot.lat, lot.lon]} icon={parkingIcon}>
                  <Popup>
                    <strong>{lot.name}</strong><br />
                    Price: NPR {lot.pricePerHour}/hr<br />
                    Status: {lot.status}
                  </Popup>
                </Marker>
              ))}
              
              <button 
                className="recenter-btn-floating" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (userLocation) setMapCenter([...userLocation]);
                }}
                title="Go to my location"
              >
                <Navigation size={22} />
              </button>
            </MapContainer>
          </div>
        )}
      </div>

      {/* Overlaid Header */}
      <header className="dashboard-header">
        <div className="profile-pic">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search location in Nepal..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <button className="notification-btn">
          <Bell size={22} />
          <span className="notification-badge"></span>
        </button>
      </header>

      {/* Overlaid Category Tabs */}
      <div className="category-tabs">
        <button 
          className={`tab ${activeCategory === 'car' ? 'active' : ''}`} 
          onClick={() => setActiveCategory('car')}
        >
          <Car size={16} /> Car
        </button>
        <button 
          className={`tab ${activeCategory === 'bike' ? 'active' : ''}`} 
          onClick={() => setActiveCategory('bike')}
        >
          <Bike size={16} /> Bike
        </button>
      </div>

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

      {/* Slidable Bottom Sheet (Discovery Section) */}
      <section className={`discovery-section ${isSheetExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sheet-handle-container" onClick={() => setIsSheetExpanded(!isSheetExpanded)}>
          <div className="sheet-handle"></div>
          <div className="section-header">
            <h3>Nearby Parking</h3>
            <button className="view-all">View All</button>
          </div>
        </div>

        <div className="horizontal-scroll">
          {parkingLots.map(lot => (
            <div key={lot._id} className="parking-lot-card">
              <div className="lot-image">
                <img src={`https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=200`} alt={lot.name} />
                <span className={`status-badge ${lot.status}`}>{lot.status.toUpperCase()}</span>
              </div>
              <div className="lot-content">
                <h4>{lot.name}</h4>
                <div className="lot-meta">
                  <span><Navigation size={12} /> {lot.distance ? `${lot.distance.toFixed(2)} km` : 'Nearby'}</span>
                  <span>• NPR {lot.pricePerHour}/hr</span>
                </div>
                <div className="occupancy-container">
                  <div className="occupancy-bar">
                    <div 
                      className="occupancy-fill"
                      style={{ width: `${(lot.occupiedSpots / lot.totalSpots) * 100}%` }}
                    ></div>
                  </div>
                  <span className="occupancy-text">{lot.occupiedSpots}/{lot.totalSpots} slots</span>
                </div>
                <button className={`book-btn ${lot.status}`} disabled={lot.status === 'full'}>
                  {lot.status === 'full' ? 'Sold Out' : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <Compass size={24} />
          <span>Explore</span>
        </button>
        <button className="nav-item">
          <History size={24} />
          <span>History</span>
        </button>
        <button className="nav-item">
          <Wallet size={24} />
          <span>Payments</span>
        </button>
        <button className="nav-item">
          <UserIcon size={24} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default Dashboard;
