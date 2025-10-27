import { useState } from 'react';
import SearchBar from './components/SearchBar';
import CarList from './components/CarList';
import ReservationList from './components/ReservationList';
import DailyRentalsReport from './components/DailyRentalsReport';

export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'reservations' | 'report'>('search');

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

      <h1 style={{ 
        textAlign: 'center',
        color: '#1f2937',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '2rem 0'
      }}>
        Car Rental System
      </h1>

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
      </div>

      {activeTab === 'search' ? (
        <>
          <SearchBar />
          <CarList />
        </>
      ) : activeTab === 'reservations' ? (
        <ReservationList />
      ) : (
        <DailyRentalsReport />
      )}
    </div>
  )
}