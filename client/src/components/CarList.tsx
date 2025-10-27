import { useEffect, useState, useCallback } from 'react';
import ReservationForm from './ReservationForm';
import CarFilter from './CarFilter';

interface BaseReservation {
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

interface CarListProps {
  baseUrl?: string;
  onFilterChange?: (cars: Car[]) => void;
}

// carTypes moved into CarFilter; no local declaration needed here

export default function CarList({
  baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000',
  onFilterChange
}: CarListProps) {
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const handleFilterChange = useCallback((newFilters: { type: string; minPrice: string; maxPrice: string }) => {
    // store the chosen filters in local state so fetchCars picks them up
    setSelectedType(newFilters.type);
    setMinPrice(newFilters.minPrice);
    setMaxPrice(newFilters.maxPrice);

    // apply client-side filtering immediately
    let filtered = [...cars];

    if (newFilters.type && newFilters.type !== 'All Types') {
      filtered = filtered.filter(car => car.type === newFilters.type);
    }

    if (newFilters.minPrice) {
      filtered = filtered.filter(car => car.price_per_day >= parseFloat(newFilters.minPrice));
    }

    if (newFilters.maxPrice) {
      filtered = filtered.filter(car => car.price_per_day <= parseFloat(newFilters.maxPrice));
    }

    setFilteredCars(filtered);
    if (onFilterChange) {
      onFilterChange(filtered);
    }
  }, [cars, onFilterChange]);

  const handleCreateReservation = async (reservationData: Omit<BaseReservation, 'status'>) => {
    try {
      console.log('Creating reservation:', reservationData);
      const response = await fetch(`${baseUrl}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reservationData,
          status: 'confirmed' // Set initial status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }

      // Refresh the car list to update availability
      await fetchCars();
      setSelectedCar(null);
    } catch (err) {
      console.error('Reservation error:', err);
      throw err;
    }
  };

  

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (selectedType !== 'All Types') params.append('type', selectedType);

      console.log('Fetching cars from:', `${baseUrl}/api/cars?${params}`);
      const response = await fetch(`${baseUrl}/api/cars?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cars: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received cars:', data);
      setCars(data);
  setFilteredCars(data);
      if (onFilterChange) onFilterChange(data);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Failed to load cars. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, minPrice, maxPrice, selectedType, onFilterChange]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  return (
    <div className="car-list">
      <h2 className="text-2xl font-bold mb-6">Available Cars</h2>
      <CarFilter onFilterChange={handleFilterChange} />
      <style>{`
        .car-list {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
        }
        
        .filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          background-color: #f3f4f6;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
          transition: border-color 0.15s ease;
          background-color: white;
        }

        .filter-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .cars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .car-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .car-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .car-model {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #111827;
        }

        .car-type {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .car-price {
          color: #059669;
          font-weight: 600;
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .availability-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .available {
          background-color: #dcfce7;
          color: #166534;
        }

        .unavailable {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .error-message {
          background-color: #fee2e2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        }

        .loading-message {
          text-align: center;
          color: #6b7280;
          padding: 3rem;
          font-size: 0.875rem;
        }

        @media (max-width: 640px) {
          .filters {
            grid-template-columns: 1fr;
          }
          
          .cars-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Filters are provided by the CarFilter component above. Removed inline duplicate controls. */}

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-message" role="status">
          Loading available vehicles...
        </div>
      ) : (
      <div className="cars-grid">
        {filteredCars.map(car => (
            <div key={car.id} className="car-card">
              <h3 className="car-model">{car.model}</h3>
              <p className="car-type">{car.type}</p>
              <p className="car-price">${car.price_per_day.toFixed(2)} / day</p>
              <div 
                className={`availability-badge ${car.available ? 'available' : 'unavailable'}`}
                role="status"
              >
                {car.available ? 'Available' : 'Not Available'}
              </div>

              {car.available && (
                <button
                  className="reserve-button"
                  onClick={() => setSelectedCar(car)}
                >
                  Reserve Now
                </button>
              )}
            </div>
          ))}
          {filteredCars.length === 0 && !loading && !error && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>
              No cars found matching your criteria.
            </p>
          )}
        </div>
      )}

      {selectedCar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ReservationForm
              carId={selectedCar.id}
              onSubmit={handleCreateReservation}
              onClose={() => setSelectedCar(null)}
            />
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 90%;
          max-height: 90%;
          overflow-y: auto;
        }

        .reserve-button {
          display: block;
          width: 100%;
          padding: 0.625rem;
          margin-top: 1rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reserve-button:hover {
          background-color: #2563eb;
        }
      `}</style>
    </div>
  );
}