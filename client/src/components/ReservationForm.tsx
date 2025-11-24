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
  gps?: boolean;
  tollPass?: boolean;
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
  const [gps, setGps] = useState<boolean>(reservation?.gps || false);
  const [tollPass, setTollPass] = useState<boolean>(reservation?.tollPass || false);
  // Payment related state (demo only; not secure storage)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState(''); // MM/YY
  const [cvc, setCvc] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  
  // Fetch car details for both new and edit modes
  useEffect(() => {
    const id = carId ?? reservation?.carId;
    if (id) {
      fetchCarDetails(id);
    }
  }, [carId, reservation]);


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

  // Calculate total price when dates or add-ons change
  useEffect(() => {
    if (car && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 0) days = 1;
      const gpsPerDay = gps ? 5 : 0; // $5/day for GPS
      const tollPerDay = tollPass ? 3 : 0; // $3/day for toll pass
      const addonsPerDay = gpsPerDay + tollPerDay;
      setTotalPrice(days * (car.price_per_day + addonsPerDay));
    }
  }, [car, startDate, endDate, gps, tollPass]);

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
      // Basic client-side payment validation
      if (!cardNumber || !cardName || !expiry || !cvc) {
        setPaymentError('Please fill in all payment fields');
        setLoading(false);
        return;
      }
      if (!/^\d{12,19}$/.test(cardNumber.replace(/\s+/g, ''))) {
        setPaymentError('Invalid card number format');
        setLoading(false);
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        setPaymentError('Expiry must be MM/YY');
        setLoading(false);
        return;
      }
      if (!/^\d{3,4}$/.test(cvc)) {
        setPaymentError('CVC must be 3 or 4 digits');
        setLoading(false);
        return;
      }

      const reservationPayload = {
        carId: carId || reservation!.carId,
        startDate,
        endDate,
        totalPrice,
        userId: 1, // placeholder user
        gps,
        tollPass: tollPass
      };
      await onSubmit(reservationPayload);
      setError(null);

      // After reservation creation, call payment endpoint (we assume reservation saved and car availability updated)
      // We need reservation ID but the parent onSubmit does not currently return it.
      // For demo: fetch the latest reservation for user 1 matching car and dates.
      try {
        const q = new URLSearchParams({ userId: '1' }).toString();
        const resList = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/reservations?${q}`);
        const reservations = await resList.json();
        // naive match
        const created = reservations.find((r: any) => r.carId === reservationPayload.carId && r.startDate === reservationPayload.startDate && r.endDate === reservationPayload.endDate && r.totalPrice === reservationPayload.totalPrice);
        if (!created) {
          setPaymentError('Could not locate created reservation for payment.');
        } else {
          const payRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reservationId: created.id,
              cardNumber: cardNumber.replace(/\s+/g, ''),
              cardName,
              expiry,
              cvc,
              method: 'card'
            })
          });
          if (!payRes.ok) {
            const body = await payRes.json().catch(() => ({}));
            setPaymentError(body.error || 'Payment failed');
          } else {
            const paymentData = await payRes.json();
            setPaymentSuccess(`Payment successful • Charged $${paymentData.amount}`);
            setPaymentError(null);
            // close form shortly
            setTimeout(() => onClose(), 1500);
          }
        }
      } catch (payErr) {
        setPaymentError('Payment request failed');
      }
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

          {/* Payment Section */}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Payment Details</label>
            <input
              type="text"
              placeholder="Card Number"
              className="form-input"
              value={cardNumber}
              onChange={e => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={19}
              required
            />
            <input
              type="text"
              placeholder="Name on Card"
              className="form-input"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="MM/YY"
                className="form-input"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                maxLength={5}
                required
              />
              <input
                type="text"
                placeholder="CVC"
                className="form-input"
                value={cvc}
                onChange={e => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={4}
                required
              />
            </div>
            {paymentError && <div className="error-message" style={{ marginTop: 8 }}>{paymentError}</div>}
            {paymentSuccess && <div style={{ marginTop: 8, color: '#059669', fontSize: '0.875rem' }}>{paymentSuccess}</div>}
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 4 }}>Demo only: Do not enter real card details.</div>
          </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={gps} onChange={e => setGps(e.target.checked)} />
            <span>GPS ($5/day)</span>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={tollPass} onChange={e => setTollPass(e.target.checked)} />
            <span>Toll Pass ($3/day)</span>
          </label>
        </div>

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