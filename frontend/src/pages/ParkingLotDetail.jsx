import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, MapPin, CircleDollarSign, CarFront } from 'lucide-react';
import { useLocationContext } from '../context/LocationContext';
import '../styles/ParkingLotDetail.css';

const ParkingLotDetail = () => {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userLocation } = useLocationContext();

  const [lot, setLot] = useState(location.state?.lot || null);
  const [loading, setLoading] = useState(!location.state?.lot);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [slots, setSlots] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchLot = async () => {
    try {
      const response = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/parking/lots');
      const data = await response.json();
      if (data.success) {
        const foundLot = (data.data || []).find((item) => item._id === lotId);
        setLot(foundLot || null);
      }
    } catch (err) {
      console.error('Failed to fetch lot detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLot();
  }, [lotId]);

  useEffect(() => {
    const timer = setInterval(fetchLot, 12000);
    return () => clearInterval(timer);
  }, [lotId]);

  const availableSlots = useMemo(() => {
    if (!lot) return 0;
    return Math.max(0, (lot.totalSpots || 0) - (lot.occupiedSpots || 0));
  }, [lot]);

  const occupancyPercent = useMemo(() => {
    if (!lot?.totalSpots) return 0;
    return Math.min(100, Math.round(((lot.occupiedSpots || 0) / lot.totalSpots) * 100));
  }, [lot]);

  const distanceText = useMemo(() => {
    if (location.state?.distance) return `${location.state.distance.toFixed(2)} km away`;
    if (!lot || !userLocation) return 'Distance unavailable';

    const toRad = (value) => (value * Math.PI) / 180;
    const [userLat, userLon] = userLocation;
    const dLat = toRad(lot.lat - userLat);
    const dLon = toRad(lot.lon - userLon);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(userLat)) * Math.cos(toRad(lot.lat)) * Math.sin(dLon / 2) ** 2;
    const distance = 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

    return `${distance.toFixed(2)} km away`;
  }, [location.state, lot, userLocation]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!lot) return;
    if (!startTime || !endTime) {
      setError('Please provide both start and end times.');
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time.');
      return;
    }

    if (slots < 1 || slots > availableSlots) {
      setError('Requested slots are not available.');
      return;
    }

    try {
      setBookingLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('https://parkfasto-backend-2.onrender.com/api/v1/parking/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parkingLotId: lot._id,
          slots: Number(slots),
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Booking confirmed successfully.');
        setSlots(1);
        setStartTime('');
        setEndTime('');
        fetchLot();
      } else {
        setError(data.message || 'Booking failed.');
      }
    } catch (err) {
      console.error('Booking request failed:', err);
      setError('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="lot-detail-page"><p className="detail-loading">Loading lot details...</p></div>;
  }

  if (!lot) {
    return (
      <div className="lot-detail-page">
        <div className="detail-card">
          <h2>Parking lot not found</h2>
          <button className="detail-back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lot-detail-page">
      <div className="detail-topbar">
        <button className="detail-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back
        </button>
        <span className="live-chip">Live Slots</span>
      </div>

      <div className="detail-card">
        <h1>{lot.name}</h1>
        <div className="detail-meta-grid">
          <div className="meta-pill"><MapPin size={16} /> {distanceText}</div>
          <div className="meta-pill"><CircleDollarSign size={16} /> NPR {lot.pricePerHour}/hr</div>
          <div className="meta-pill"><CarFront size={16} /> {(lot.type || 'both').toUpperCase()}</div>
          <div className="meta-pill"><Clock3 size={16} /> Updated live</div>
        </div>

        <div className="availability-box">
          <div className="availability-head">
            <strong>{availableSlots} slots available now</strong>
            <span>{occupancyPercent}% occupied</span>
          </div>
          <div className="availability-bar">
            <div className="availability-fill" style={{ width: `${occupancyPercent}%` }} />
          </div>
        </div>
      </div>

      <form className="booking-form-card" onSubmit={handleBook}>
        <h2>Book This Parking</h2>

        <div className="booking-grid">
          <label>
            Slots
            <input
              type="number"
              min={1}
              max={Math.max(1, availableSlots)}
              value={slots}
              onChange={(e) => setSlots(Number(e.target.value))}
              disabled={availableSlots === 0 || bookingLoading}
              required
            />
          </label>

          <label>
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={availableSlots === 0 || bookingLoading}
              required
            />
          </label>

          <label>
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={availableSlots === 0 || bookingLoading}
              required
            />
          </label>
        </div>

        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}

        <button
          type="submit"
          className="confirm-book-btn"
          disabled={availableSlots === 0 || bookingLoading}
        >
          {bookingLoading ? 'Booking...' : availableSlots === 0 ? 'No Slots Available' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
};

export default ParkingLotDetail;

