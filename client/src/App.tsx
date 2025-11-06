import { useState } from 'react';
import SearchBar from './components/SearchBar';
import CarList from './components/CarList';
import ReservationList from './components/ReservationList';
import DailyRentalsReport from './components/DailyRentalsReport';
import LocationsList from './components/LocationsList';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import { useAuth } from './AuthContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'reservations' | 'report' | 'locations'>('search');
  const { user, logout } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  // We keep ReservationList and DailyRentalsReport imports for future tabs

  return (
    <div>
      <style>{`
        .tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-button.active {
          background-color: #3b82f6;
          color: white;
        }

        .tab-button:not(.active) {
          background-color: #e5e7eb;
          color: #4b5563;
        }

        .tab-button:not(.active):hover {
          background-color: #d1d5db;
        }
      `}</style>

      <div className="app-header">
        <style>{`
          .app-header {
            background: linear-gradient(to right, #1a1a1a, #2d3748);
            padding: 2rem 0;
            margin-bottom: 2rem;
          }
          
          .app-title {
            text-align: center;
            color: #ffffff;
            font-size: 3.5rem;
            font-weight: 700;
            font-family: var(--font-heading);
            margin: 0;
            letter-spacing: 1px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .app-subtitle {
            text-align: center;
            color: #e2e8f0;
            font-size: 1.25rem;
            font-family: var(--font-body);
            margin-top: 0.5rem;
            font-weight: 300;
          }
        `}</style>
        <h1 className="app-title">Luxury Car Rentals</h1>
        <p className="app-subtitle">Experience Excellence in Every Journey</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Search Cars
        </button>
        <button
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          My Reservations
        </button>
        <button
          className={`tab-button ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Rental Reports
        </button>
        <button
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          Locations
        </button>
        </div>

        <div style={{ position: 'absolute', right: 24, top: 24 }}>
            {user ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>Hi, {user.username}</span>
                  <button onClick={logout} className="tab-button" style={{ padding: '0.4rem 0.6rem' }}>Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setAuthMode('login')} className="tab-button">Sign in</button>
                  <button onClick={() => setAuthMode('signup')} className="tab-button">Sign up</button>
                </div>
              )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
        {activeTab === 'search' && (
          <>
            <Home />
            <SearchBar />
            <CarList />
          </>
        )}
        {activeTab === 'reservations' && user && <ReservationList />}
        {activeTab === 'report' && user && <DailyRentalsReport />}
        {activeTab === 'locations' && <LocationsList />}
        {(activeTab === 'reservations' || activeTab === 'report') && !user && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            marginTop: '2rem'
          }}>
            <h3 style={{ color: '#4B5563', marginBottom: '1rem' }}>Please sign in to access this feature</h3>
            <button 
              onClick={() => setAuthMode('login')}
              className="button-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              Sign in
            </button>
          </div>
        )}
      </div>

      {authMode === 'login' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={() => setAuthMode(null)}>
          <div onClick={e => e.stopPropagation()}>
            <Login />
          </div>
        </div>
      )}

      {authMode === 'signup' && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }} onClick={() => setAuthMode(null)}>
          <div onClick={e => e.stopPropagation()}>
            <Signup />
          </div>
        </div>
      )}
    </div>
  )
}