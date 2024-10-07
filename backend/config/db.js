// config/db.js

const { Pool } = require('pg');
require('dotenv').config();

const sslConfig = process.env.DB_SSL_CA
    ? {
        rejectUnauthorized: true,
        ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'), // Replace escaped \n with actual newlines
    }
    : false;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: sslConfig,
});

module.exports = pool;