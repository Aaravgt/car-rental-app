import { useEffect, useState } from 'react';

interface CarFilterProps {
  onFilterChange?: (filters: {
    type: string;
    minPrice: string;
    maxPrice: string;
  }) => void;
}

const carTypes = [
  'All Types',
  'Sedan',
  'SUV',
  'Truck',
  'Luxury',
  'Economy',
  'Luxury SUV',
  'Compact',
  'Sports'

];

export default function CarFilter({
  onFilterChange
}: CarFilterProps) {
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All Types');

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        type: selectedType,
        minPrice,
        maxPrice
      });
    }
  }, [minPrice, maxPrice, selectedType, onFilterChange]);

  return (
    <div className="filters mb-6">
      <div className="filter-group">
        <label className="filter-label" htmlFor="car-type">
          Car Type
        </label>
        <select
          id="car-type"
          className="filter-input"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {carTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="min-price">
          Minimum Price ($)
        </label>
        <input
          id="min-price"
          type="number"
          className="filter-input"
          placeholder="Enter min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="max-price">
          Maximum Price ($)
        </label>
        <input
          id="max-price"
          type="number"
          className="filter-input"
          placeholder="Enter max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
    </div>
  );
}
