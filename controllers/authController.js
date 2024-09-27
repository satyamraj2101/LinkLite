// controllers/authController.js

const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// User Repository (Database Queries)
const userRepository = {
    async getUserByEmail(email) {
        const result = await pool.query('SELECT id, email, password FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    async createUser(email, password) {
        const result = await pool.query(
            'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, password]
        );
        return result.rows[0];
    },
};

// Signup Function
exports.signup = async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await userRepository.getUserByEmail(email);
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password

        const newUser = await userRepository.createUser(email, hashedPassword);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login Function
exports.login = async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await userRepository.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        let options = {
            maxAge: 1000 * 60 * 15, // 15 minutes
            httpOnly: true,
            signed: true,
            // secure: process.env.NODE_ENV === 'production', // Uncomment in production
            sameSite: 'Strict',
        };

        res.cookie('authToken', token, options);
        res.setHeader('user-id', user.id);

        res.json({ message: 'Login successful', redirect: `${process.env.DOMAIN}/dashboard` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout Function
exports.logout = async (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: 'Logout successful' });
};
