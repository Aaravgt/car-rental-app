# 🚗 Car Rental System

A full-stack web application that connects customers with car rental companies.

Customers can browse available cars, make and manage bookings, and handle payments securely.  
Rental companies can update vehicle inventory, track reservations, and view reports on fleet status and customer feedback.

## Current Features (UI-4)

| Area | Highlights |
| --- | --- |
| Search | `GET /api/locations?query=` with SQLite-backed search + debounced React search bar |
| Inventory | `GET /api/cars` filterable list sourced from the same SQLite database |
| Auth | `/api/login` + `/api/signup` issue demo tokens that the React `AuthContext` consumes |
| Reservations | Full CRUD endpoints with conflict detection, status updates, and a Daily Rentals report |
| Payments | `/api/payments` validates card data (Luhn) and stores captured payments linked to reservations |

The backend lives solely in `server/index.js`. Legacy mock servers, JSON data dumps, and ad-hoc scripts have been removed so there’s a single source of truth.

### Setup & Run Locally

1. Install Node.js
   - Visit https://nodejs.org/
   - Download and run the LTS installer for Windows
   - Reopen PowerShell after installing
   - Verify with: `node -v` and `npm -v`

2. Install Dependencies (one-time)
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
- SQLite database file is generated at runtime inside `server/data/` (git ignored). Running the server or tests will auto-create and seed tables for locations, users, cars, reservations, and payments.
- Case-insensitive search via SQLite's `LIKE ... COLLATE NOCASE`.

API Endpoints (partial)
- `GET /api/locations` – Search/filter pickup locations
- `POST /api/login` – Demo login that returns `{ token, user }`
- `POST /api/signup` – Creates a new demo user if the username is free
- `POST /api/reservations` – Creates a reservation after validating date conflicts
- `POST /api/payments` – Captures a payment for a reservation after Luhn validation
- `GET /api/reports/daily-rentals` – Aggregated revenue + utilization report

React Components
- `SearchBar` – debounced search UI for locations
- `ReservationForm` – drives reservation + payment creation flow
- `AuthContext` – persists tokens from login/signup endpoints across reloads
