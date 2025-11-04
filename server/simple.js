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

app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

app.get('/api/cars', (req, res) => {
    res.json([
        { id: 1, model: 'Test Car', type: 'Sedan', price_per_day: 50, available: true }
    ]);
});

const port = 3001;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});