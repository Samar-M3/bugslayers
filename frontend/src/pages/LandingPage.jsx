import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Wallet,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <nav className="glass-nav">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-icon">P</div>
            <span>ParkFasto</span>
          </div>

          <button className="glass-btn sign-in" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-headline">
              Stop Circling. <br />
              <span className="accent-text">Start Parking.</span>
            </h1>
            <p className="hero-subheadline">
              The future of parking in Nepal.
              <br />
              Book instantly, arrive confidently, and manage every space with full transparency.
            </p>

            <div className="hero-ctas">
              <button className="primary-cta" onClick={() => navigate('/dashboard')}>
                Find a Spot <ChevronRight size={20} />
              </button>
              <button className="secondary-cta" onClick={() => navigate('/register')}>
                Register Your Lot
              </button>
            </div>

            <div className="trust-badges">
              <span>Trusted By:</span>
              <div className="badge-grid">
                <div className="trust-badge">Fonepay</div>
                <div className="trust-badge">eSewa</div>
                <div className="trust-badge">KMC</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="mobile-mockup">
              <div className="mockup-screen">
                <div className="mockup-header">
                  <div className="mockup-search">
                    <MapPin size={14} /> Kathmandu, Nepal
                  </div>
                </div>
                <div className="mockup-map">
                  <div className="map-marker available" style={{ top: '30%', left: '40%' }}></div>
                  <div className="map-marker full" style={{ top: '50%', left: '60%' }}></div>
                  <div className="map-marker available" style={{ top: '70%', left: '30%' }}></div>
                </div>
                <div className="mockup-bottom-sheet">
                  <div className="sheet-handle"></div>
                  <div className="mockup-lot-card">
                    <div className="lot-img"></div>
                    <div className="lot-info">
                      <div className="lot-name">Civil Mall Parking</div>
                      <div className="lot-status">Available - 45 spots</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      <section id="about" className="features-section">
        <div className="section-header-centered">
          <h2>About ParkFasto</h2>
          <p>Built to make parking faster, fairer, and fully transparent in Nepal.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Navigation className="feature-icon" size={32} />
            </div>
            <h3>Real-Time Data</h3>
            <p>No more guessing; see exactly how many spots are left in Thamel, New Road, or Lalitpur in real-time.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck className="feature-icon" size={32} />
            </div>
            <h3>Zero Revenue Leakage</h3>
            <p>Our digital tokens ensure every rupee goes to the lot owner, not into pockets. 100% transparency.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Wallet className="feature-icon" size={32} />
            </div>
            <h3>Digital Payments</h3>
            <p>Integrated with eSewa, Khalti, and Fonepay; no exact change needed. Pay with a single scan.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">P</div>
            <span>ParkFasto</span>
          </div>
          <p>© 2024 ParkFasto. Built for a Smarter Kathmandu.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
