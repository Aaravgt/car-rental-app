import { useState, useEffect } from 'react';
import ReservationForm from './ReservationForm';

interface BaseReservation {
  carId: number;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  totalPrice: number;
  userId: number;
}

interface Reservation extends BaseReservation {
  id: number;
  createdAt: string;
  updatedAt: string;
}

type NewReservation = Omit<BaseReservation, 'status'>;

interface Car {
  id: number;
  model: string;
  type: string;
  price_per_day: number;
  available: boolean;
}

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cars, setCars] = useState<Record<number, Car>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Fetch all reservations and their corresponding cars
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const [reservationsRes, carsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/reservations`),
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

  const handleUpdateReservation = async (updatedReservation: NewReservation) => {
    if (!editingReservation) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${editingReservation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...updatedReservation, status: 'confirmed' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }

      await fetchReservations();
      setEditingReservation(null);
    } catch (err) {
      throw new Error('Failed to update reservation');
    }
  };

  const handleCancelReservation = async (id: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations/${id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }

      await fetchReservations();
    } catch (err) {
      throw new Error('Failed to cancel reservation');
    }
  };

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

        .edit-button,
        .cancel-button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-button {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .edit-button:hover {
          background-color: #2563eb;
        }

        .cancel-button {
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
        <div className="reservations-grid">
          {reservations.map(reservation => {
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

                <div className="reservation-price">
                  Total: ${reservation.totalPrice.toFixed(2)}
                </div>

                {reservation.status === 'confirmed' && (
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() => setEditingReservation(reservation)}
                    >
                      Edit
                    </button>
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
          })}

          {reservations.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>
              No reservations found.
            </p>
          )}
        </div>
      )}

      {editingReservation && (
        <ReservationForm
          reservation={editingReservation}
          onSubmit={handleUpdateReservation}
          onCancel={handleCancelReservation}
          onClose={() => setEditingReservation(null)}
        />
      )}
    </div>
  );
}