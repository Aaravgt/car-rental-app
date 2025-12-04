import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';

interface BaseReservation {
  carId: number;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  totalPrice: number;
  userId: number;
  gps?: boolean;
  tollPass?: boolean;
}

interface Reservation extends BaseReservation {
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface Car {
  id: number;
  model: string;
  type: string;
  price_per_day: number;
  available: boolean;
}

export default function ReservationList() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cars, setCars] = useState<Record<number, Car>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch reservations for current user and cars
  useEffect(() => {
    fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const [reservationsRes, carsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/reservations?userId=${user?.id || ''}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/cars`)
      ]);

      if (!reservationsRes.ok || !carsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const reservationsData = await reservationsRes.json();
      const carsData = await carsRes.json();

      // Create a map of cars by ID for easy lookup
      const carsMap = carsData.reduce((acc: Record<number, Car>, car: Car) => {
        acc[car.id] = car;
        return acc;
      }, {});

      setReservations(reservationsData);
      setCars(carsMap);
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${id}`,
        { 
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel reservation');
      }

      await fetchReservations();
      setError(null); // Clear any previous errors on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel reservation');
      throw err;
    }
  };

  // Helper: normalize 'today' to start of day for comparisons
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeReservations = useMemo(() =>
    reservations.filter(r => r.status !== 'cancelled' && new Date(r.endDate) >= todayStart),
    [reservations, todayStart]
  );

  const pastReservations = useMemo(() =>
    reservations.filter(r => r.status !== 'cancelled' && new Date(r.endDate) < todayStart),
    [reservations, todayStart]
  );

  const cancelledReservations = useMemo(() =>
    reservations.filter(r => r.status === 'cancelled'),
    [reservations]
  );

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <section style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 8 }}>{title}</h3>
        {children}
      </section>
    );
  }

  function renderReservationCard(reservation: Reservation) {
    const car = cars[reservation.carId];
    return (
      <div key={reservation.id} className="reservation-card">
        <div className="reservation-header">
          <h3 className="car-model">{car?.model || 'Unknown Car'}</h3>
          <span className={`status-badge status-${reservation.status}`}>
            {reservation.status}
          </span>
        </div>

        <div className="reservation-dates">
          <div>From: {new Date(reservation.startDate).toLocaleDateString()}</div>
          <div>To: {new Date(reservation.endDate).toLocaleDateString()}</div>
        </div>
        <div style={{ marginTop: 8, color: '#4b5563', fontSize: '0.875rem' }}>
          Add-ons: {reservation.gps ? 'GPS' : ''}{reservation.gps && reservation.tollPass ? ', ' : ''}{reservation.tollPass ? 'Toll Pass' : (reservation.gps ? '' : 'None')}
        </div>

        <div className="reservation-price">
          Total: ${reservation.totalPrice.toFixed(2)}
        </div>

        {reservation.status === 'confirmed' && (
          <div className="action-buttons">
            <button
              className="cancel-button"
              onClick={() => handleCancelReservation(reservation.id)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }


  return (
    <div className="reservation-list">
      <style>{`
        .reservation-list {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .reservations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .reservation-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 1.5rem;
          position: relative;
        }

        .reservation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .car-model {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-confirmed {
          background-color: #dcfce7;
          color: #166534;
        }

        .status-cancelled {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .reservation-dates {
          margin: 1rem 0;
          color: #4b5563;
          font-size: 0.875rem;
        }

        .reservation-price {
          color: #059669;
          font-weight: 600;
          font-size: 1.25rem;
          margin: 1rem 0;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .cancel-button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .cancel-button:hover {
          background-color: #dc2626;
        }

        .error-message {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
        }

        .loading-message {
          text-align: center;
          color: #6b7280;
          padding: 3rem;
        }
      `}</style>

      <h2 className="text-2xl font-bold mb-4">Your Reservations</h2>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message" role="status">
          Loading reservations...
        </div>
      ) : (
        <div>
          {/* Group reservations into Active, Past and Cancelled */}
          <Section title="Active Reservations">
            {/** Active: not cancelled and endDate >= today */}
            <div className="reservations-grid">
              {activeReservations.length > 0 ? activeReservations.map(r => renderReservationCard(r)) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>No active reservations.</p>
              )}
            </div>
          </Section>

          <Section title="Past Reservations">
            <div className="reservations-grid">
              {pastReservations.length > 0 ? pastReservations.map(r => renderReservationCard(r)) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>No past reservations.</p>
              )}
            </div>
          </Section>

          <Section title="Cancelled Reservations">
            <div className="reservations-grid">
              {cancelledReservations.length > 0 ? cancelledReservations.map(r => renderReservationCard(r)) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>No cancelled reservations.</p>
              )}
            </div>
          </Section>
        </div>
      )}

    </div>
  );
}