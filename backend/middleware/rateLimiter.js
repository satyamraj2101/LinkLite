// middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

const analyticsLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = analyticsLimiter;
