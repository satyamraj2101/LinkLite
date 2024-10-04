// routes/link.js

const express = require('express');
const { createShortLink, getUserLinks, redirectToLongUrl, getLinkAnalytics } = require('../controllers/linkController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');
const analyticsLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /links/create
 * @desc    Create a new short link
 * @access  Protected
 */
router.post(
    '/create',
    authMiddleware,
    [
        body('longUrl')
            .isURL()
            .withMessage('Please provide a valid URL'),
        body('name')
            .optional()
            .isString()
            .withMessage('Name must be a string'),
        body('expiry')
            .optional()
            .isISO8601()
            .toDate()
            .withMessage('Expiry must be a valid ISO 8601 date'),
        body('imageUrl') // Added imageUrl validation
            .optional()
            .isURL()
            .withMessage('Please provide a valid image URL'),
    ],
    createShortLink
);

/**
 * @route   GET /links/my-links
 * @desc    Retrieve all links created by the authenticated user
 * @access  Protected
 */
router.get('/my-links', authMiddleware, getUserLinks);

/**
 * @route   GET /links/:linkId/analytics
 * @desc    Retrieve analytics data for a specific link
 * @access  Protected
 */
router.get(
    '/:linkId/analytics',
    analyticsLimiter, // Apply rate limiter
    authMiddleware,
    [
        param('linkId')
            .isInt()
            .withMessage('Link ID must be an integer'),
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid ISO 8601 date'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid ISO 8601 date'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Limit must be an integer between 1 and 1000'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a non-negative integer'),
    ],
    getLinkAnalytics
);

/**
 * @route   GET /:shortCode
 * @desc    Redirect to the original long URL based on the short code
 * @access  Public
 */
router.get('/:shortCode', redirectToLongUrl);

module.exports = router;
