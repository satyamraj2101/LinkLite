// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to authenticate requests using JWT tokens stored in signed cookies.
 * Attaches the user ID to req.user if authentication is successful.
 * Responds with 401 Unauthorized if authentication fails.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authMiddleware = (req, res, next) => {
    const token = req.signedCookies.authToken;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        console.error('JWT verification failed:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
