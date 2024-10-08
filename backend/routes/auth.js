// routes/auth.js

const express = require('express');
const { signup, login, logout } = require('../controllers/authController');
const { body } = require('express-validator');

const router = express.Router();

// Signup Route with Validation
router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/\d/)
            .withMessage('Password must contain at least one number')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter'),
    ],
    signup
);

// Login Route with Validation
router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],
    login
);

// Logout Route (No validation needed)
router.post('/logout', logout);

module.exports = router;
