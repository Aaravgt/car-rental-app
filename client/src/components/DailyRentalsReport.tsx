import { useState, useEffect } from 'react';

interface RentalReport {
  date: string;
  total_rentals: number;
  total_revenue: number;
  car_types: string;
  average_price: number;
  cancellations: number;
}

export default function DailyRentalsReport() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [report, setReport] = useState<RentalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/reports/daily-rentals?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return report.reduce(
      (acc, day) => ({
        rentals: acc.rentals + day.total_rentals,
        revenue: acc.revenue + day.total_revenue,
        cancellations: acc.cancellations + day.cancellations,
      }),
      { rentals: 0, revenue: 0, cancellations: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="daily-rentals-report">
      <style>{`
        .daily-rentals-report {
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
      `}</style>

      <div className="report-header">
        <h2 className="text-2xl font-bold mb-4">Daily Rentals Report</h2>

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
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Rentals</div>
            <div className="summary-value">{totals.rentals}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value">${totals.revenue.toFixed(2)}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Cancellations</div>
            <div className="summary-value">{totals.cancellations}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Average Daily Revenue</div>
            <div className="summary-value">
              ${(totals.revenue / (report.length || 1)).toFixed(2)}
            </div>
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
          Loading report data...
        </div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Rentals</th>
              <th>Revenue</th>
              <th>Average Price</th>
              <th>Cancellations</th>
              <th>Car Types</th>
            </tr>
          </thead>
          <tbody>
            {report.map((day) => (
              <tr key={day.date}>
                <td>{new Date(day.date).toLocaleDateString()}</td>
                <td>{day.total_rentals}</td>
                <td>${day.total_revenue.toFixed(2)}</td>
                <td>${day.average_price.toFixed(2)}</td>
                <td>{day.cancellations}</td>
                <td>{day.car_types.split(',').join(', ')}</td>
              </tr>
            ))}
            {report.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                  No data available for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}