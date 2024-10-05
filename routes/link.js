// routes/link.js

const express = require('express');
const {
        createShortLink,
        getUserLinks,
        redirectToLongUrl,
        getLinkAnalytics
} = require('../controllers/linkController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');
const analyticsLimiter = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /links/create
 * @desc    Create a new short link with optional custom short code and device-specific URLs
 * @access  Protected
 */
router.post(
    '/create',
    authMiddleware,
    [
            body('longUrlDesktop')
                .isURL()
                .withMessage('Please provide a valid desktop URL'),
            body('longUrlMobile')
                .optional()
                .isURL()
                .withMessage('Please provide a valid mobile URL'),
            body('shortCode')
                .optional()
                .isAlphanumeric()
                .withMessage('Short code must be alphanumeric')
                .isLength({ min: 4, max: 20 })
                .withMessage('Short code must be between 4 and 20 characters'),
            body('name')
                .optional()
                .isString()
                .withMessage('Name must be a string'),
            body('expiry')
                .optional()
                .isISO8601()
                .withMessage('Expiry must be a valid ISO 8601 date'),
            body('imageUrl')
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
 * @route   GET /links/:shortCode
 * @desc    Redirect to the original long URL based on the short code
 * @access  Public
 */
router.get('/:shortCode', redirectToLongUrl);

module.exports = router;
