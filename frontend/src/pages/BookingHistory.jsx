import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await axios.get('https://parkfasto-backend-2.onrender.com/api/v1/parking/bookings', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        setBookings(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
        setError(err.response?.data?.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return <div className="booking-history" style={{padding:16}}>Loading booking history...</div>;
  if (error) return <div className="booking-history" style={{padding:16,color:'var(--text-secondary)'}}>Error: {error}</div>;

  return (
    <div className="dashboard-container booking-history">
      <div className="history-header">
        <div>
          <h2>Booking History</h2>
          <div className="history-sub">All reservations and past parking sessions</div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="history-empty">You have no bookings yet — Book a spot from Explore.</div>
      ) : (
        <div className="history-list">
          {bookings.map((b) => (
            <div key={b._id} className="history-card">
              <div className="history-top">
                <div className="history-title">{b.parkingLot?.name || 'Parking Lot'}</div>
                <div className={`history-status ${b.status}`}>{b.status}</div>
              </div>

              <div className="history-meta">
                <div className="meta-item">
                  <div className="meta-label">Booked At</div>
                  <div className="meta-value">{new Date(b.createdAt).toLocaleString()}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Start</div>
                  <div className="meta-value">{b.startTime ? new Date(b.startTime).toLocaleString() : '-'}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">End</div>
                  <div className="meta-value">{b.endTime ? new Date(b.endTime).toLocaleString() : '-'}</div>
                </div>
              </div>

              <div className="history-footer">
                <div className="slots-pill">Slots: {b.slots || 1}</div>
                <div style={{color:'var(--text-secondary)', fontSize:13}}>{b.parkingLot?.pricePerHour ? `NPR ${b.parkingLot.pricePerHour}/hr` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

