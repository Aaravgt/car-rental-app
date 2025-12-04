import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

interface UserRentalStats {
  date: string;
  rentals: number;
  total_spent: number;
  cars_rented: string;
}

export default function UserRentalReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [stats, setStats] = useState<UserRentalStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserStats();
  }, [startDate, endDate, user]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user's reservations
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reservations?userId=${user.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }

      const reservations = await response.json();

      // Filter reservations by date range and status (only confirmed)
      const filtered = reservations.filter((r: any) => {
        const startReservation = new Date(r.startDate);
        return r.status === 'confirmed' && startReservation >= new Date(startDate) && startReservation <= new Date(endDate);
      });

      // Fetch cars to get car models
      const carsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/cars`);
      const cars = await carsRes.json();
      const carMap = new Map(cars.map((c: any) => [c.id, c.model]));

      // Group by date and calculate stats
      const dailyStats: Record<string, UserRentalStats> = {};

      filtered.forEach((reservation: any) => {
        const date = reservation.startDate.split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            rentals: 0,
            total_spent: 0,
            cars_rented: ''
          };
        }

        dailyStats[date].rentals += 1;
        dailyStats[date].total_spent += reservation.totalPrice;
        const carModel = carMap.get(reservation.carId) || 'Unknown';
        if (!dailyStats[date].cars_rented.includes(carModel as string)) {
          dailyStats[date].cars_rented += (dailyStats[date].cars_rented ? ', ' : '') + carModel;
        }
      });

      setStats(Object.values(dailyStats).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      setError('Failed to load your rental stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return stats.reduce(
      (acc, day) => ({
        rentals: acc.rentals + day.rentals,
        spent: acc.spent + day.total_spent,
      }),
      { rentals: 0, spent: 0 }
    );
  };

  const totals = calculateTotals();
  const averageDailySpend = stats.length > 0 ? totals.spent / stats.length : 0;

  return (
    <div className="user-rental-report">
      <style>{`
        .user-rental-report {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .report-header {
          background-color: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .date-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .filter-input {
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .summary-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .report-table th,
        .report-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .report-table th {
          background-color: #f8fafc;
          font-weight: 600;
          color: #374151;
        }

        .report-table tr:last-child td {
          border-bottom: none;
        }

        .report-table tbody tr:hover {
          background-color: #f8fafc;
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

        .empty-message {
          text-align: center;
          color: #6b7280;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="report-header">
        <h2 className="text-2xl font-bold mb-4">My Rental Activity</h2>

        <div className="date-filters">
          <div className="filter-group">
            <label htmlFor="start-date" className="filter-label">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              className="filter-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="end-date" className="filter-label">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              className="filter-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Rentals</div>
            <div className="summary-value">{totals.rentals}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Spent</div>
            <div className="summary-value">${totals.spent.toFixed(2)}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Average Daily Spend</div>
            <div className="summary-value">${averageDailySpend.toFixed(2)}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Days with Rentals</div>
            <div className="summary-value">{stats.length}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message" role="status">
          Loading your rental activity...
        </div>
      ) : stats.length === 0 ? (
        <div className="empty-message">
          No rental activity for the selected date range.
        </div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Rentals</th>
              <th>Amount Spent</th>
              <th>Cars Rented</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((day) => (
              <tr key={day.date}>
                <td>{new Date(day.date).toLocaleDateString()}</td>
                <td>{day.rentals}</td>
                <td>${day.total_spent.toFixed(2)}</td>
                <td>{day.cars_rented || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
