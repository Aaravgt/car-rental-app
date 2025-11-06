import { useState, useEffect } from 'react';

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function LocationsList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/locations`);
        if (!response.ok) throw new Error('Failed to fetch locations');
        const data = await response.json();
        setLocations(data);
        setFilteredLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Filter locations based on search term
  useEffect(() => {
    const filtered = locations.filter(location =>
      location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  return (
    <div className="locations-list">
      <style>{`
        .locations-list {
          padding: 2rem 0;
          background-color: var(--color-background-alt);
        }

        .search-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        .location-search {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          border: 2px solid var(--color-border);
          border-radius: 12px;
          background-color: white;
          transition: all 0.2s ease;
        }

        .location-search:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .results-count {
          text-align: center;
          color: var(--color-text-light);
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .locations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
          padding: 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .location-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .location-card:hover {
          transform: translateY(-4px);
        }

        .location-name {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          color: var(--color-secondary);
          margin-bottom: 0.75rem;
        }

        .location-address {
          color: var(--color-text-light);
          margin-bottom: 0.5rem;
        }

        .location-contact {
          color: var(--color-primary);
          text-decoration: none;
          display: block;
          margin-top: 1rem;
          font-weight: 500;
        }

        .location-contact:hover {
          text-decoration: underline;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-light);
        }
      `}</style>

      <div className="container">
        <h2 className="text-center fancy-heading">Our Locations</h2>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search locations by city, name, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="location-search"
          />
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading locations...</div>
        ) : (
          <>
            <p className="results-count">
              Found {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
            </p>
            <div className="locations-grid">
              {filteredLocations.map((location) => (
                <div key={location.id} className="location-card">
                  <h3 className="location-name">{location.name}</h3>
                  <div className="location-address">
                    <p>{location.address}</p>
                    <p>{location.city}, {location.province} {location.postalCode}</p>
                  </div>
                  <a href={`tel:${location.phone}`} className="location-contact">
                    {location.phone}
                  </a>
                </div>
              ))}
              {filteredLocations.length === 0 && !loading && (
                <div className="no-results">
                  No locations found matching your search criteria
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}