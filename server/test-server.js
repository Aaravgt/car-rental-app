const express = require('express');
const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Sample data
const cars = [
    { id: 1, model: 'Toyota Camry', type: 'Sedan', price_per_day: 50.00, available: true },
    { id: 2, model: 'Honda CR-V', type: 'SUV', price_per_day: 75.00, available: true },
    { id: 3, model: 'Tesla Model 3', type: 'Luxury', price_per_day: 150.00, available: true }
];

// Cars endpoint with filtering
app.get('/api/cars', (req, res) => {
    console.log('Received request for /api/cars');
    console.log('Query params:', req.query);
    
    let filtered = [...cars];
    
    const { minPrice, maxPrice, type } = req.query;
    
    if (minPrice) {
        filtered = filtered.filter(car => car.price_per_day >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
        filtered = filtered.filter(car => car.price_per_day <= parseFloat(maxPrice));
    }
    
    if (type && type !== 'All Types') {
        filtered = filtered.filter(car => car.type === type);
    }
    
    console.log('Sending response:', filtered);
    res.json(filtered);
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Test server is working!' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});