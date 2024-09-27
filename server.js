// server.js

const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
require('dotenv').config();

// Initialize Express App
const app = express();

// Configure Express to Trust Proxies
app.set('trust proxy', 1); // Trust the first proxy (adjust if multiple proxies)

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Import Routes
const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/link');

// Apply Routes
app.use('/auth', authRoutes);
app.use('/links', linkRoutes);

// Catch-all Route for Redirection (Should be after other routes)
app.get('/:shortCode', require('./controllers/linkController').redirectToLongUrl);

// Start the Server
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

app.listen(PORT, () => {
    console.log(`Server is running on ${DOMAIN}`);
});
