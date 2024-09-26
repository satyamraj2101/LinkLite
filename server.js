const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect((err) => {
    if (err) {
        console.error('Database connection error', err.stack);
    } else {
        console.log('Database connected');
    }
});

// Get the domain from the .env file
const DOMAIN = process.env.DOMAIN;

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log(`Server is running on ${DOMAIN}`);
});