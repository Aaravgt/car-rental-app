import { 
  useEffect, 
  useState, 
  useRef, 
  useCallback,
  type KeyboardEvent,
  type ReactElement
} from 'react';

interface Location {
  id: number;
  name: string;
}

interface HighlightedTextProps {
  text: string;
  query: string;
}

interface SearchBarProps {
  baseUrl?: string;
  onSelect?: (location: Location) => void;
}

// Component to highlight matching text parts
function HighlightedText({ text, query }: HighlightedTextProps): ReactElement {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part: string, i: number) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark 
            key={i}
            style={{ 
              backgroundColor: '#ffd700',
              padding: 0,
              fontWeight: 'bold'
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface SearchBarProps {
  baseUrl?: string;
  onSelect?: (location: Location) => void;
}

// Highlight matching parts of the text
export default function SearchBar({ 
  baseUrl = 'http://localhost:3000',
  onSelect
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Fetch results with debounce
  useEffect(() => {
    setError(null);
    const handle = setTimeout(() => {
      const q = query.trim();
      if (q.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('Fetching from:', `${baseUrl}/api/locations${q ? `?query=${encodeURIComponent(q)}` : ''}`);
      fetch(`${baseUrl}/api/locations${q ? `?query=${encodeURIComponent(q)}` : ''}`)
        .then(res => {
          console.log('Response status:', res.status);
          if (!res.ok) throw new Error(`Failed to fetch results: ${res.status}`);
          return res.json();
        })
        .then((data: Location[]) => {
          console.log('Received data:', data);
          setResults(data);
          setError(null);
        })
        .catch((err) => {
          setResults([]);
          setError('Failed to load locations. Please try again. ' + err.message);
          console.error('Search error:', err);
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [query, baseUrl]);

  const handleSelect = useCallback((location: Location) => {
    if (onSelect) {
      onSelect(location);
    }
    setQuery(location.name);
    setResults([]);
    inputRef.current?.blur();
  }, [onSelect]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => 
          i < results.length - 1 ? i + 1 : i
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => i > 0 ? i - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div style={{ 
      maxWidth: 600,
      margin: '1rem auto',
      position: 'relative'
    }}>
      <label 
        htmlFor="location-search"
        style={{ 
          display: 'block',
          marginBottom: 8,
          fontWeight: 500
        }}
      >
        Search locations
      </label>
      
      <input
        id="location-search"
        ref={inputRef}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="location-list"
        aria-activedescendant={selectedIndex >= 0 ? `location-${results[selectedIndex]?.id}` : undefined}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a city or airport"
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 16,
          borderRadius: 4,
          border: '2px solid #ccc',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />

      {error && (
        <div style={{
          color: '#dc2626',
          fontSize: 14,
          marginTop: 8
        }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <ul
          id="location-list"
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 300,
            overflowY: 'auto',
            margin: '4px 0',
            padding: 0,
            listStyle: 'none',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: 4,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          {results.map((r, index) => (
            <li
              key={r.id}
              id={`location-${r.id}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#e5e7eb' : 'transparent'
              }}
            >
              <HighlightedText text={r.name} query={query} />
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div style={{
          marginTop: 8,
          color: '#4b5563',
          fontSize: 14
        }}>
          Searching...
        </div>
      )}
    </div>
  );
}
