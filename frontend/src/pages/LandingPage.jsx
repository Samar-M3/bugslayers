import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  MapPin, 
  ShieldCheck, 
  Wallet, 
  ChevronRight, 
  Menu, 
  CheckCircle2,
  Smartphone,
  Navigation
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Glassmorphic Header */}
      <nav className="glass-nav">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-icon">P</div>
            <span>ParkME</span>
          </div>
          
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#pricing">Pricing</a>
          </div>

          <button className="glass-btn sign-in" onClick={() => navigate('/login')}>
            Sign In
          </button>
          
          <button className="mobile-menu-btn">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-headline">
              Stop Circling. <br />
              <span className="accent-text">Start Parking.</span>
            </h1>
            <p className="hero-subheadline">
              Nepal's first real-time parking ecosystem. Find a spot in seconds or manage your lot with 100% transparency.
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
                  {/* Visual representation of a map */}
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
                      <div className="lot-status">Available • 45 spots</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-glow"></div>
          </div>
        </div>
      </section>

      {/* Why Us? Section */}
      <section id="features" className="features-section">
        <div className="section-header-centered">
          <h2>End the Parking Crisis in Kathmandu</h2>
          <p>Modern solutions built for Nepal's urban spaces</p>
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
            <p>Integrated with eSewa, Khalti, and Fonepay—no "khuchra" (change) needed. Pay with a single scan.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">P</div>
            <span>ParkME</span>
          </div>
          <p>© 2024 ParkME. Built for a Smarter Kathmandu.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
