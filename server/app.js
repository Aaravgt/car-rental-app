const express = require('express');
const app = express();

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Body parser middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Load data from database files
const fs = require('fs');
const path = require('path');

// Load cars data
let cars = [];
try {
    const carsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cars.db'), 'utf8'));
    cars = carsData.cars.map(car => ({
        id: parseInt(car.id, 10),
        make: car.make,
        model: car.model,
        type: car.type,
        price_per_day: car.price,
        available: car.available,
        year: car.year,
        color: car.color,
        location: car.location,
        transmission: car.transmission,
        fuelType: car.fuelType,
        seats: car.seats,
        imageUrl: car.imageUrl || car.image_url || null
    }));
    console.log(`Loaded ${cars.length} cars from database`);
} catch (error) {
    console.error('Error loading cars data:', error);
}

// Load locations data
let locations = [];
try {
    const locationsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'locations.json'), 'utf8'));
    locations = locationsData.locations;
    console.log(`Loaded ${locations.length} locations from database`);
} catch (error) {
    console.error('Error loading locations data:', error);
}

// Home endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// Cars endpoints
app.get('/api/cars', (req, res) => {
    try {
        console.log('Cars endpoint hit', req.query);
        const { minPrice, maxPrice, type } = req.query;
        
        if (!cars || !Array.isArray(cars)) {
            console.error('Cars data is not properly loaded:', cars);
            return res.status(500).json({ error: 'Cars data is not properly loaded' });
        }
        
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
        
        console.log('Sending cars:', filteredCars);
        res.json(filteredCars);
    } catch (error) {
        console.error('Error in /api/cars endpoint:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get single car endpoint
app.get('/api/cars/:id', (req, res) => {
    try {
        const carId = req.params.id;
        console.log('Getting car details for ID:', carId);
        
        const car = cars.find(c => c.id.toString() === carId);
        if (!car) {
            console.log('Car not found with ID:', carId);
            return res.status(404).json({ error: 'Car not found' });
        }
        
        console.log('Sending car details:', car);
        res.json(car);
    } catch (error) {
        console.error('Error getting car details:', error);
        res.status(500).json({ error: 'Failed to get car details' });
    }
});

// Locations endpoint
app.get('/api/locations', (req, res) => {
    try {
        console.log('Locations endpoint hit');
        if (!locations || !Array.isArray(locations)) {
            console.error('Locations data is not properly loaded:', locations);
            return res.status(500).json({ error: 'Locations data is not properly loaded' });
        }
        console.log('Sending locations:', locations);
        res.json(locations);
    } catch (error) {
        console.error('Error in /api/locations endpoint:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Simple in-memory users for demo login
const users = [
    { id: 1, username: 'user', password: 'password123' },
    { id: 2, username: 'admin', password: 'admin123' },
    { id: 3, username: 'test', password: 'test123' }
];

// token -> userId
const tokens = new Map();

// Login endpoint (mock)
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        console.log('Login attempt for', username);
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = (Date.now()).toString(36) + Math.random().toString(36).slice(2);
        tokens.set(token, user.id);

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Initialize reservations storage
const reservations = [];

// Reservations endpoints
app.get('/api/reservations', (req, res) => {
    try {
        console.log('Getting all reservations');
        res.json(reservations);
    } catch (error) {
        console.error('Error getting reservations:', error);
        res.status(500).json({ error: 'Failed to get reservations' });
    }
});

app.post('/api/reservations', (req, res) => {
    try {
        console.log('Creating reservation with data:', JSON.stringify(req.body, null, 2));
        const { carId, startDate, endDate, userId, totalPrice, gps, tollPass } = req.body;
        
        console.log('Validating fields:', JSON.stringify({ carId, startDate, endDate, totalPrice }, null, 2));
        // Validate required fields
        if (!carId || !startDate || !endDate || !totalPrice) {
            const missingFields = [];
            if (!carId) missingFields.push('carId');
            if (!startDate) missingFields.push('startDate');
            if (!endDate) missingFields.push('endDate');
            if (!totalPrice) missingFields.push('totalPrice');
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
        }

        // Find the car
        console.log('Looking for car with ID:', carId);
        const searchId = parseInt(carId, 10);
        console.log('All car IDs:', cars.map(c => c.id));
        const car = cars.find(c => c.id === searchId);
        if (!car) {
            console.error('Car not found with ID:', searchId);
            return res.status(404).json({ error: `Car not found with ID: ${searchId}` });
        }

        // Check if car is available
        console.log('Checking car availability:', { carId, available: car.available });
        if (!car.available) {
            return res.status(400).json({ error: 'Car is not available' });
        }

        // Compute total price (recalculate server-side to be safe)
        const start = new Date(startDate);
        const end = new Date(endDate);
        let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) days = 1;
        const gpsPerDay = gps ? 5 : 0;
        const tollPerDay = tollPass ? 3 : 0;
        const addonsPerDay = gpsPerDay + tollPerDay;
        const computedTotal = days * (car.price_per_day + addonsPerDay);

        // Create new reservation
        const reservation = {
            id: reservations.length + 1,
            carId: parseInt(carId),
            startDate,
            endDate,
            userId: userId || 1, // Default user ID if not provided
            totalPrice: Number.isFinite(parseFloat(totalPrice)) ? parseFloat(totalPrice) : computedTotal,
            gps: !!gps,
            tollPass: !!tollPass,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Add to reservations array
        reservations.push(reservation);

        // Update car availability
        car.available = false;

        console.log('Reservation created successfully:', reservation);
        res.status(201).json(reservation);
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// Daily rentals report endpoint
app.get('/api/reports/daily-rentals', (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Getting daily rentals report:', { startDate, endDate });

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        // Filter reservations within the date range
        const filteredReservations = reservations.filter(reservation => {
            const reservationDate = new Date(reservation.startDate);
            return reservationDate >= new Date(startDate) && reservationDate <= new Date(endDate);
        });

        // Group reservations by date
        const dailyRentals = filteredReservations.reduce((acc, reservation) => {
            const date = reservation.startDate.split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    total_rentals: 0,
                    total_revenue: 0,
                    cancellations: 0,
                    car_types: new Set(),
                    prices: []
                };
            }
            acc[date].total_rentals++;
            acc[date].total_revenue += reservation.totalPrice;
            if (reservation.status === 'cancelled') {
                acc[date].cancellations++;
            }
            const car = cars.find(c => c.id === reservation.carId);
            if (car) {
                acc[date].car_types.add(car.type);
            }
            acc[date].prices.push(reservation.totalPrice);
            return acc;
        }, {});

        // Calculate averages and format data
        const report = Object.entries(dailyRentals).map(([date, data]) => ({
            date,
            total_rentals: data.total_rentals,
            total_revenue: data.total_revenue,
            car_types: Array.from(data.car_types).join(','),
            average_price: data.prices.reduce((a, b) => a + b, 0) / data.prices.length || 0,
            cancellations: data.cancellations
        }));

        res.json(Object.values(dailyRentals));
    } catch (error) {
        console.error('Error generating daily rentals report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Cancel/delete reservation endpoint
app.put('/api/reservations/:id/cancel', (req, res) => {
    try {
        const reservationId = parseInt(req.params.id);
        console.log('Cancelling reservation:', reservationId);

        const reservationIndex = reservations.findIndex(r => r.id === reservationId);
        if (reservationIndex === -1) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Update reservation status
        reservations[reservationIndex].status = 'cancelled';
        
        // Make the car available again
        const car = cars.find(c => c.id === reservations[reservationIndex].carId);
        if (car) {
            car.available = true;
        }

        res.json(reservations[reservationIndex]);
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({ error: 'Failed to cancel reservation' });
    }
});

// Update reservation endpoint
app.put('/api/reservations/:id', (req, res) => {
    try {
        const reservationId = parseInt(req.params.id);
        const updates = req.body;
        console.log('Updating reservation:', reservationId, updates);

        const reservationIndex = reservations.findIndex(r => r.id === reservationId);
        if (reservationIndex === -1) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Update allowed fields
        const allowedUpdates = ['startDate', 'endDate', 'gps', 'tollPass'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                reservations[reservationIndex][field] = updates[field];
            }
        });

        // Recalculate total price if dates or add-ons changed
        if (updates.startDate || updates.endDate || updates.gps !== undefined || updates.tollPass !== undefined) {
            const car = cars.find(c => c.id === reservations[reservationIndex].carId);
            if (car) {
                const start = new Date(reservations[reservationIndex].startDate);
                const end = new Date(reservations[reservationIndex].endDate);
                let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                if (days <= 0) days = 1;
                const gpsPerDay = reservations[reservationIndex].gps ? 5 : 0;
                const tollPerDay = reservations[reservationIndex].tollPass ? 3 : 0;
                const addonsPerDay = gpsPerDay + tollPerDay;
                reservations[reservationIndex].totalPrice = days * (car.price_per_day + addonsPerDay);
            }
        }

        res.json(reservations[reservationIndex]);
    } catch (error) {
        console.error('Error updating reservation:', error);
        res.status(500).json({ error: 'Failed to update reservation' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Signup endpoint (simple demo)
app.post('/api/signup', (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        if (users.find(u => u.username === username)) return res.status(409).json({ error: 'User already exists' });

        const newUser = { id: users.length + 1, username, password };
        users.push(newUser);
        const token = (Date.now()).toString(36) + Math.random().toString(36).slice(2);
        tokens.set(token, newUser.id);
        res.status(201).json({ token, user: { id: newUser.id, username: newUser.username } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});