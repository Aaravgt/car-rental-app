const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// Add body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS headers for local dev (allow Vite dev server)
app.use((req, res, next) => {
    // Allow requests from the Vite dev server
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// SQLite setup - use a persistent database file
let db;
const setupDb = async () => {
	const dbPath = path.join(__dirname, 'data', 'locations.db');
	// Ensure data directory exists
	await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
	
	db = await open({
		filename: dbPath,
		driver: sqlite3.Database
	});

  // Create and seed the locations, cars, reservations, and users tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        carId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        totalPrice DECIMAL(10,2) NOT NULL,
        status TEXT CHECK(status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (carId) REFERENCES cars(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservationId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method TEXT NOT NULL, -- e.g. 'card'
        cardLast4 TEXT,
        status TEXT CHECK(status IN ('pending','authorized','captured','failed')) DEFAULT 'captured',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservationId) REFERENCES reservations(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        type TEXT NOT NULL,
        price_per_day DECIMAL(10,2) NOT NULL,
        available BOOLEAN DEFAULT 1,
        image_url TEXT
      );

      INSERT OR IGNORE INTO locations (id, name) VALUES
        (1, 'San Francisco, CA'),
        (2, 'San Jose, CA'),
        (3, 'Los Angeles, CA'),
        (4, 'New York, NY'),
        (5, 'Austin, TX'),
        (6, 'Dallas, TX'),
        (7, 'Seattle, WA'),
        (8, 'Portland, OR'),
        (9, 'Toronto, ON'),
        (10, 'Waterloo, ON'),
        (11, 'Brampton, ON'),
        (12, 'Greater Toronto Area (GTA), ON');
			
      INSERT OR IGNORE INTO users (id, username, password) VALUES
        (1, 'aarav', 'shah'),
        (2, 'demo', 'password');
			
      INSERT OR IGNORE INTO cars (id, model, type, price_per_day, available) VALUES
        -- Economy Cars
        (1, 'Toyota Corolla', 'Economy', 45.00, 1),
        (2, 'Honda Civic', 'Economy', 48.00, 1),
        (3, 'Hyundai Elantra', 'Economy', 47.00, 1),
        (4, 'Nissan Versa', 'Economy', 42.00, 1),
			
        -- Sedans
        (5, 'Toyota Camry', 'Sedan', 65.00, 1),
        (6, 'Honda Accord', 'Sedan', 68.00, 1),
        (7, 'Mazda 6', 'Sedan', 70.00, 1),
        (8, 'Volkswagen Passat', 'Sedan', 72.00, 1),
			
        -- Compact Cars
        (9, 'Volkswagen Golf', 'Compact', 55.00, 1),
        (10, 'Mini Cooper', 'Compact', 60.00, 1),
        (11, 'Ford Focus', 'Compact', 52.00, 1),
        (12, 'Mazda 3', 'Compact', 54.00, 1),
			
        -- SUVs
        (13, 'Honda CR-V', 'SUV', 85.00, 1),
        (14, 'Toyota RAV4', 'SUV', 88.00, 1),
        (15, 'Mazda CX-5', 'SUV', 90.00, 1),
        (16, 'Chevrolet Suburban', 'SUV', 120.00, 1),
			
        -- Luxury Cars
        (17, 'BMW 5 Series', 'Luxury', 180.00, 1),
        (18, 'Mercedes E-Class', 'Luxury', 185.00, 1),
        (19, 'Audi A6', 'Luxury', 175.00, 1),
        (20, 'Tesla Model 3', 'Luxury', 150.00, 1),
			
        -- Luxury SUVs
        (21, 'BMW X5', 'Luxury SUV', 200.00, 1),
        (22, 'Mercedes GLE', 'Luxury SUV', 210.00, 1),
        (23, 'Porsche Cayenne', 'Luxury SUV', 250.00, 1),
        (24, 'Range Rover Sport', 'Luxury SUV', 245.00, 1),
			
        -- Trucks
        (25, 'Ford F-150', 'Truck', 100.00, 1),
        (26, 'Toyota Tundra', 'Truck', 105.00, 1),
        (27, 'Chevrolet Silverado', 'Truck', 98.00, 1),
        (28, 'RAM 1500', 'Truck', 95.00, 1),
			
        -- Sports Cars
        (29, 'Porsche 911', 'Sports', 300.00, 1),
        (30, 'Chevrolet Corvette', 'Sports', 275.00, 1),
        (31, 'Ford Mustang GT', 'Sports', 150.00, 1),
        (32, 'BMW M4', 'Sports', 225.00, 1);
    `);
};

// GET /api/locations?query=...  — searches locations by name (case-insensitive, substring)
app.get('/api/locations', async (req, res) => {
	try {
		const q = (req.query.query || '').toString().trim();
		let results;
		
		if (!q) {
			results = await db.all('SELECT * FROM locations ORDER BY name');
		} else {
			results = await db.all(
				'SELECT * FROM locations WHERE name LIKE ? COLLATE NOCASE ORDER BY name',
				[`%${q}%`]
			);
		}
		
		return res.json(results);
	} catch (err) {
		console.error('Database error:', err);
		return res.status(500).json({ error: 'Internal server error' });
	}
});

// Debug middleware with detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

// Reservation endpoints
app.post('/api/reservations', async (req, res) => {
  try {
    console.log('Received reservation request:', req.body);
    const { carId, userId, startDate, endDate, totalPrice } = req.body;
    
    // Validate required fields
    if (!carId || !userId || !startDate || !endDate || !totalPrice) {
      console.log('Missing fields:', { carId, userId, startDate, endDate, totalPrice });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date format and logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check if car exists
    const car = await db.get('SELECT * FROM cars WHERE id = ?', [carId]);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if car is available for the selected dates
    const conflictingReservation = await db.get(
      `SELECT id FROM reservations 
       WHERE carId = ? 
       AND status = 'confirmed'
       AND (
         (startDate <= ? AND endDate >= ?) OR
         (startDate <= ? AND endDate >= ?) OR
         (startDate >= ? AND endDate <= ?)
       )`,
      [carId, startDate, startDate, endDate, endDate, startDate, endDate]
    );

    if (conflictingReservation) {
      return res.status(409).json({ error: 'Car is not available for selected dates' });
    }

    console.log('Creating reservation with:', {
      carId, userId, startDate, endDate, totalPrice,
      status: 'confirmed'
    });

    const result = await db.run(
      `INSERT INTO reservations (carId, userId, startDate, endDate, totalPrice, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`,
      [carId, userId, startDate, endDate, totalPrice]);

    res.json({ id: result.lastID });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

app.put('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, totalPrice } = req.body;
    
    // Validate required fields
    if (!startDate || !endDate || !totalPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if reservation exists
    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check for date conflicts (excluding this reservation)
    const conflictingReservation = await db.get(
      `SELECT id FROM reservations 
       WHERE carId = ? 
       AND id != ?
       AND status = 'confirmed'
       AND (
         (startDate <= ? AND endDate >= ?) OR
         (startDate <= ? AND endDate >= ?) OR
         (startDate >= ? AND endDate <= ?)
       )`,
      [reservation.carId, id, startDate, startDate, endDate, endDate, startDate, endDate]
    );

    if (conflictingReservation) {
      return res.status(409).json({ error: 'Car is not available for selected dates' });
    }

    await db.run(
      `UPDATE reservations 
       SET startDate = ?, endDate = ?, totalPrice = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [startDate, endDate, totalPrice, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update status to cancelled instead of deleting
    const result = await db.run(
      `UPDATE reservations 
       SET status = 'cancelled', updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

app.get('/api/reservations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [id]);
    
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Daily Rentals Report endpoint
app.get('/api/reports/daily-rentals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const report = await db.all(`
      SELECT 
        DATE(r.startDate) as date,
        COUNT(*) as total_rentals,
        SUM(r.totalPrice) as total_revenue,
        GROUP_CONCAT(DISTINCT c.type) as car_types,
        AVG(r.totalPrice) as average_price,
        COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as cancellations
      FROM reservations r
      JOIN cars c ON r.carId = c.id
      WHERE DATE(r.startDate) BETWEEN DATE(?) AND DATE(?)
      AND r.status != 'pending'
      GROUP BY DATE(r.startDate)
      ORDER BY date ASC
    `, [startDate, endDate]);

    res.json(report);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const { userId, status } = req.query;
    let query = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';
    const reservations = await db.all(query, params);
    res.json(reservations);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Cars API endpoint
app.get('/api/cars', async (req, res) => {
  console.log('[Cars API] Request received');
  console.log('[Cars API] Query params:', req.query);
  try {
    if (!db) {
      console.error('[Cars API] Database not initialized');
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    const { minPrice, maxPrice, type } = req.query;
    let query = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (minPrice) {
      query += ' AND price_per_day >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price_per_day <= ?';
      params.push(parseFloat(maxPrice));
    }
    if (type && type !== 'All Types') {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY price_per_day ASC';
    console.log('Executing query:', query, 'with params:', params);
    const results = await db.all(query, params);
    console.log('Query results:', results);
    return res.json(results);
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    console.log('[LOGIN] incoming body:', req.body);
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await db.get('SELECT id, username FROM users WHERE username = ? AND password = ?', [username, password]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple token (for demo only; not secure)
    const token = Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64');
    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      return res.status(400).json({ error: 'Username must include at least one non-space character' });
    }

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [normalizedUsername]);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [normalizedUsername, password]);
    const user = { id: result.lastID, username: normalizedUsername };
    const token = Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64');
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

// Simple Luhn algorithm for card validation (demo only; do NOT use raw card numbers in production)
function luhnValid(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '').split('').reverse().map(d => parseInt(d, 10));
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let v = digits[i];
    if (i % 2 === 1) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
  }
  return sum % 10 === 0;
}

// Create payment for a reservation
app.post('/api/payments', async (req, res) => {
  try {
    const { reservationId, cardNumber, cardName, expiry, cvc, method } = req.body || {};
    if (!reservationId || !cardNumber || !cardName || !expiry || !cvc) {
      return res.status(400).json({ error: 'Missing payment fields' });
    }
    if (!method) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    // Basic card validations (demo)
    const cleaned = cardNumber.replace(/\s+/g, '');
    if (cleaned.length < 12 || cleaned.length > 19 || !luhnValid(cleaned)) {
      return res.status(422).json({ error: 'Invalid card number' });
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return res.status(422).json({ error: 'Invalid expiry format (MM/YY)' });
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      return res.status(422).json({ error: 'Invalid CVC' });
    }

    const reservation = await db.get('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if already paid
    const existing = await db.get('SELECT id FROM payments WHERE reservationId = ?', [reservationId]);
    if (existing) {
      return res.status(409).json({ error: 'Reservation already has a payment' });
    }

    const last4 = cleaned.slice(-4);
    const amount = reservation.totalPrice;
    const result = await db.run(
      `INSERT INTO payments (reservationId, userId, amount, method, cardLast4, status) VALUES (?,?,?,?,?, 'captured')`,
      [reservation.id, reservation.userId, amount, method, last4]
    );

    return res.status(201).json({
      id: result.lastID,
      reservationId: reservation.id,
      userId: reservation.userId,
      amount,
      method,
      cardLast4: last4,
      status: 'captured'
    });
  } catch (err) {
    console.error('Payment error:', err);
    return res.status(500).json({ error: 'Payment failed' });
  }
});

// Get payments (optionally filter by userId or reservationId)
app.get('/api/payments', async (req, res) => {
  try {
    const { userId, reservationId } = req.query;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    if (userId) { query += ' AND userId = ?'; params.push(userId); }
    if (reservationId) { query += ' AND reservationId = ?'; params.push(reservationId); }
    query += ' ORDER BY createdAt DESC';
    const rows = await db.all(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('Fetch payments error:', err);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Initialize DB then export app
let initPromise = setupDb();
app.locals.ready = () => initPromise;

module.exports = app;

// Start server only when run directly
if (require.main === module) {
	const PORT = process.env.PORT || 3000;
	initPromise.then(() => {
		app.listen(PORT, () => {
			console.log(`Server listening on http://localhost:${PORT}`);
			// Test database connection
			db.all('SELECT * FROM cars').then(cars => {
				console.log('Cars in database:', cars);
			}).catch(err => {
				console.error('Error querying cars:', err);
			});
		});
	}).catch(err => {
		console.error('Failed to initialize database:', err);
		process.exit(1);
	});
}