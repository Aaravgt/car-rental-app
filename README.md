# 🚗 Car Rental System

A full-stack web application that connects customers with car rental companies.

Customers can browse available cars, make and manage bookings, and handle payments securely.  
Rental companies can update vehicle inventory, track reservations, and view reports on fleet status and customer feedback.

## Search Locations (UI-4)

The app now includes a locations search feature with SQLite database storage and a React search component.

### What was added
- `server/index.js` — Express endpoint `GET /api/locations?query=...` that searches an SQLite database
- `client/src/components/SearchBar.tsx` — React search component with debounced input
- Server-side features:
  - Case-insensitive substring search
  - SQLite database with auto-seeding
  - Proper error handling
  - API test suite
- Client-side features:
  - TypeScript support
  - Loading states
  - Error handling
  - Mobile-friendly UI

### Setup & Run Locally

1. Install Node.js
   - Visit https://nodejs.org/
   - Download and run the LTS installer for Windows
   - Reopen PowerShell after installing
   - Verify with: `node -v` and `npm -v`

2. Install Dependencies
   ```powershell
   # Install server deps (Express + SQLite)
   npm install --prefix .\server
   
   # Install client deps (React + Vite)
   npm install --prefix .\client
   ```

3. Start the Services
   ```powershell
   # Terminal 1: Start API server
   npm start --prefix .\server
   
   # Terminal 2: Start dev UI
   npm run dev --prefix .\client
   ```

4. Open the App
   - Client: Visit the URL shown by Vite (usually http://localhost:5173)
   - API: Server runs on http://localhost:3000

### Development

Running Tests
```powershell
# Run API tests (locations endpoint)
npm test --prefix .\server

# Watch mode during development
npm run dev --prefix .\server
```

Quick API Test
```powershell
# PowerShell
Invoke-RestMethod "http://localhost:3000/api/locations?query=San"

# curl
curl "http://localhost:3000/api/locations?query=San"
```

### Technical Notes

Database
- Uses SQLite (in-memory for dev/test, can switch to file-based)
- Auto-creates and seeds the locations table
- Case-insensitive search via SQLite's LIKE and COLLATE NOCASE

API Endpoints
- GET `/api/locations` - List all locations
- GET `/api/locations?query=...` - Search locations
  - Returns: `[{ id: number, name: string }]`
  - 200: Success (empty array if no matches)
  - 500: Server error

React Component
```typescript
import { SearchBar } from './components/SearchBar';

// Usage with custom API URL:
<SearchBar baseUrl="http://localhost:3000" />

// Default localhost:3000:
<SearchBar />
```
