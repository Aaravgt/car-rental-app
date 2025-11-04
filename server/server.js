const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const app = express();

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Database setup
let db = null;

async function setupDb() {
    const dbPath = path.join(__dirname, 'data', 'rental.db');
    await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model TEXT NOT NULL,
            type TEXT NOT NULL,
            price_per_day DECIMAL(10,2) NOT NULL,
            available BOOLEAN DEFAULT 1
        );

        DELETE FROM cars;
        INSERT INTO cars (model, type, price_per_day, available) VALUES
            ('Toyota Camry', 'Sedan', 50.00, 1),
            ('Honda CR-V', 'SUV', 75.00, 1),
            ('Ford F-150', 'Truck', 100.00, 1),
            ('Tesla Model 3', 'Luxury', 150.00, 1),
            ('Toyota Corolla', 'Economy', 45.00, 1),
            ('BMW X5', 'Luxury SUV', 200.00, 1),
            ('Volkswagen Golf', 'Compact', 55.00, 1),
            ('Mercedes S-Class', 'Luxury', 250.00, 1),
            ('Honda Civic', 'Economy', 48.00, 1),
            ('Chevrolet Suburban', 'SUV', 120.00, 1);
    `);
    
    console.log('Database initialized successfully');
}

// Test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Cars endpoint
app.get('/api/cars', async (req, res) => {
    console.log('Cars endpoint hit');
    try {
        if (!db) {
            throw new Error('Database not initialized');
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
        const cars = await db.all(query, params);
        console.log('Query results:', cars);
        
        res.json(cars);
    } catch (error) {
        console.error('Error in /api/cars:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await setupDb();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();