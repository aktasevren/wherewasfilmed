'use client';

import NavbarComponent from './components/NavbarComponent';
import Searchbar from './components/Searchbar';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="App">
      <NavbarComponent />
      <main className="home-main">
        <section className="home-hero" aria-label="Discover filming locations">
          <div className="home-hero-content">
            <p className="home-hero-tagline">
              Discover where your favorite movies and series were filmed — explore every location on an interactive map.
            </p>
            <div className="home-hero-search">
              <Searchbar />
            </div>
            <div className="home-hero-hint">
              <span className="home-hero-hint-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              Search for a movie or series, then see all filming locations on the map
            </div>
          </div>
          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-hero-visual-map">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="100" height="60" rx="4" stroke="currentColor" strokeWidth="1.5" fill="rgba(159, 211, 199, 0.06)"/>
                <circle cx="35" cy="35" r="4" fill="currentColor" opacity="0.8"/>
                <circle cx="70" cy="45" r="4" fill="currentColor" opacity="0.8"/>
                <circle cx="85" cy="28" r="4" fill="currentColor" opacity="0.8"/>
                <path d="M35 35 L70 45 L85 28" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.5"/>
              </svg>
            </div>
            <div className="home-hero-visual-film">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
