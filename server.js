// server.js

const express = require('express');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
require('dotenv').config();


const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.set('trust proxy', 1);


app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Import Routes
const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/link');


app.use('/auth', authRoutes);
app.use('/links', linkRoutes);


app.get('/:shortCode', require('./controllers/linkController').redirectToLongUrl);

// Start the Server
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on ${DOMAIN}`);
});

