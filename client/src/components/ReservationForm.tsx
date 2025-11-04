import { useState, useEffect } from 'react';

interface Reservation {
  id: number;
  carId: number;
  startDate: string;
  endDate: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  totalPrice: number;
  userId: number;
}

interface Car {
  id: number;
  model: string;
  type: string;
  price_per_day: number;
  available: boolean;
}

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

interface ReservationFormProps {
  reservation?: Reservation;
  carId?: number;
  onSubmit: (reservation: NewReservation) => Promise<void>;
  onCancel?: (reservationId: number) => Promise<void>;
  onClose: () => void;
}

export default function ReservationForm({
  reservation,
  carId,
  onSubmit,
  onCancel,
  onClose
}: ReservationFormProps) {
  const [startDate, setStartDate] = useState(reservation?.startDate || '');
  const [endDate, setEndDate] = useState(reservation?.endDate || '');
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(reservation?.totalPrice || 0);

  // Fetch car details if not editing existing reservation
  useEffect(() => {
    if (carId) {
      fetchCarDetails(carId);
    }
  }, [carId]);

  const fetchCarDetails = async (id: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cars/${id}`);
      if (!response.ok) throw new Error('Failed to fetch car details');
      const data = await response.json();
      setCar(data);
    } catch (err) {
      setError('Failed to load car details');
    }
  };

  // Calculate total price when dates change
  useEffect(() => {
    if (car && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      setTotalPrice(days * car.price_per_day);
    }
  }, [car, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    if (!carId && !reservation) {
      setError('No car selected');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        carId: carId || reservation!.carId,
        startDate,
        endDate,
        totalPrice,
        userId: 1, // TODO: Replace with actual user ID from auth system
      });
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation || !onCancel) return;
    
    setLoading(true);
    setError(null);

    try {
      await onCancel(reservation.id);
      onClose();
    } catch (err) {
      setError('Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservation-form">
      <style>{`
        .reservation-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .price-display {
          font-size: 1.25rem;
          font-weight: 600;
          color: #059669;
          margin: 1rem 0;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .submit-button,
        .cancel-button,
        .close-button {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .submit-button:hover {
          background-color: #2563eb;
        }

        .submit-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .cancel-button {
          background-color: #ef4444;
          color: white;
          border: none;
        }

        .cancel-button:hover {
          background-color: #dc2626;
        }

        .close-button {
          background-color: #e5e7eb;
          color: #374151;
          border: none;
        }

        .close-button:hover {
          background-color: #d1d5db;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }
      `}</style>

      <h2 className="text-2xl font-bold mb-4">
        {reservation ? 'Edit Reservation' : 'New Reservation'}
      </h2>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="start-date" className="form-label">
            Start Date
          </label>
          <input
            id="start-date"
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-date" className="form-label">
            End Date
          </label>
          <input
            id="end-date"
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {totalPrice > 0 && (
          <div className="price-display">
            Total Price: ${totalPrice.toFixed(2)}
          </div>
        )}

        <div className="button-group">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : reservation ? 'Update' : 'Create'} Reservation
          </button>

          {reservation && onCancel && (
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel Reservation
            </button>
          )}

          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
}