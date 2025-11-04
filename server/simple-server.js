const express = require('express');
const app = express();

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Mock car data
const cars = [
    { id: 1, model: 'Toyota Camry', type: 'Sedan', price_per_day: 50.00, available: true },
    { id: 2, model: 'Honda CR-V', type: 'SUV', price_per_day: 75.00, available: true },
    { id: 3, model: 'Ford F-150', type: 'Truck', price_per_day: 100.00, available: true },
    { id: 4, model: 'Tesla Model 3', type: 'Luxury', price_per_day: 150.00, available: true },
    { id: 5, model: 'Toyota Corolla', type: 'Economy', price_per_day: 45.00, available: true }
];

// Test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Cars endpoint
app.get('*', (req, res, next) => {
    console.log('Request received:', req.method, req.url);
    next();
});

app.get('/api/cars', (req, res) => {
    console.log('Cars endpoint hit');
    const { minPrice, maxPrice, type } = req.query;
    
    let filteredCars = [...cars];
    
    if (minPrice) {
        filteredCars = filteredCars.filter(car => car.price_per_day >= parseFloat(minPrice));
    }
    if (maxPrice) {
        filteredCars = filteredCars.filter(car => car.price_per_day <= parseFloat(maxPrice));
    }
    if (type && type !== 'All Types') {
        filteredCars = filteredCars.filter(car => car.type === type);
    }
    
    res.json(filteredCars);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});