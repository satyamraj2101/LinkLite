// controllers/linkController.js

const pool = require('../config/db'); // Import the centralized pool
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const generateShortCode = require('../utils/generateShortCode');
const { validationResult } = require('express-validator');
require('dotenv').config();



// Link Repository
const linkRepository = {
    /**
     * Creates a new short link.
     * @param {string} longUrl - The original long URL.
     * @param {string} shortCode - The unique short code.
     * @param {string} name - Optional name for the link.
     * @param {Date} expiry - Optional expiry date.
     * @param {number} userId - ID of the user creating the link.
     * @returns {Promise<Object>} The created link.
     */
    async createLink(longUrl, shortCode, name, expiry, userId) {
        const query = `
            INSERT INTO links (long_url, short_code, name, expiry, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [longUrl, shortCode, name, expiry, userId];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    /**
     * Retrieves a link by its short code.
     * @param {string} shortCode - The short code of the link.
     * @returns {Promise<Object>} The link object.
     */
    async getLinkByShortCode(shortCode) {
        const query = `
            SELECT * FROM links WHERE short_code = $1
        `;
        const result = await pool.query(query, [shortCode]);
        return result.rows[0];
    },

    /**
     * Retrieves a link by its ID.
     * @param {number} id - The ID of the link.
     * @returns {Promise<Object>} The link object.
     */
    async getLinkById(id) {
        const query = `SELECT * FROM links WHERE id = $1`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    /**
     * Retrieves all links created by a specific user.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array>} Array of link objects.
     */
    async getLinksByUser(userId) {
        const query = `
            SELECT * FROM links WHERE created_by = $1 ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },
};

// Link Analytics Repository
const linkAnalyticsRepository = {
    /**
     * Logs a click event for a given link.
     * @param {number} linkId - The ID of the link.
     * @param {string} ipAddress - The IP address of the visitor.
     * @param {string} userAgent - The user agent string.
     * @param {string|null} referrer - The referrer URL.
     * @returns {Promise<void>}
     */
    async logClick(linkId, ipAddress, userAgent, referrer) {
        const geo = geoip.lookup(ipAddress) || {};
        const parser = new UAParser(userAgent);
        const uaResult = parser.getResult();

        const browserName = uaResult.browser.name || 'Unknown';
        const browserVersion = uaResult.browser.version || '';
        const osName = uaResult.os.name || 'Unknown';
        const osVersion = uaResult.os.version || '';

        const browser = `${browserName} ${browserVersion}`.trim() || 'Unknown';
        const os = `${osName} ${osVersion}`.trim() || 'Unknown';

        const query = `
            INSERT INTO link_analytics (
                link_id, ip_address, user_agent, referrer, country, region, city, latitude, longitude, device_type, browser, os
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        const values = [
            linkId,
            ipAddress,
            userAgent,
            referrer || null,
            geo.country || null,
            geo.region || null,
            geo.city || null,
            geo.ll ? geo.ll[0] : null, // Latitude
            geo.ll ? geo.ll[1] : null, // Longitude
            uaResult.device.type || 'desktop',
            browser,
            os,
        ];

        await pool.query(query, values);
    },

    /**
     * Retrieves analytics data for a specific link with optional filters.
     * @param {number} linkId - The ID of the link.
     * @param {Object} options - Optional filters and pagination.
     * @returns {Promise<Object>} Analytics data including total clicks and detailed records.
     */
    async getAnalytics(linkId, options = {}) {
        const { startDate, endDate, limit = 100, offset = 0 } = options;

        const baseQuery = `
            SELECT 
                id, clicked_at, ip_address, user_agent, referrer, country, region, city, latitude, longitude, device_type, browser, os
            FROM 
                link_analytics
            WHERE 
                link_id = $1
        `;
        const countQuery = `
            SELECT COUNT(*) FROM link_analytics WHERE link_id = $1
        `;
        const params = [linkId];

        let whereClauses = '';
        if (startDate) {
            params.push(startDate);
            whereClauses += ` AND clicked_at >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            whereClauses += ` AND clicked_at <= $${params.length}`;
        }

        const finalQuery = baseQuery + whereClauses + ` ORDER BY clicked_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const finalParams = [...params, limit, offset];

        const data = await pool.query(finalQuery, finalParams);
        const countResult = await pool.query(countQuery + whereClauses, params);

        return {
            total: parseInt(countResult.rows[0].count, 10),
            clicks: data.rows,
        };
    },
};

/**
 * Creates a new short link.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.createShortLink = async (req, res) => {
    // Validate Request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { longUrl, name, expiry } = req.body;
    const userId = req.user.id;

    try {
        // Generate a unique short code
        let shortCode;
        let isUnique = false;
        while (!isUnique) {
            shortCode = generateShortCode(6);
            const existingLink = await linkRepository.getLinkByShortCode(shortCode);
            if (!existingLink) {
                isUnique = true;
            }
        }

        // Create the link
        const newLink = await linkRepository.createLink(longUrl, shortCode, name, expiry, userId);

        res.status(201).json({
            message: 'Short link created successfully',
            link: {
                id: newLink.id,
                longUrl: newLink.long_url,
                shortCode: newLink.short_code,
                name: newLink.name,
                expiry: newLink.expiry,
                createdAt: newLink.created_at,
            },
        });
    } catch (error) {
        console.error('Error creating short link:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Retrieves all links created by the authenticated user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getUserLinks = async (req, res) => {
    const userId = req.user.id;

    try {
        const links = await linkRepository.getLinksByUser(userId);

        res.status(200).json({
            totalLinks: links.length,
            links: links.map(link => ({
                id: link.id,
                longUrl: link.long_url,
                shortCode: link.short_code,
                name: link.name,
                expiry: link.expiry,
                createdAt: link.created_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching user links:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Redirects to the original long URL based on the provided short code.
 * Logs analytics data.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.redirectToLongUrl = async (req, res) => {
    const { shortCode } = req.params;

    try {
        const link = await linkRepository.getLinkByShortCode(shortCode);

        if (!link) {
            return res.status(404).json({ message: 'Link not found' });
        }

        if (link.expiry && new Date() > new Date(link.expiry)) {
            return res.status(410).json({ message: 'Link has expired' });
        }

        // Retrieve the real IP address using req.ip
        let ipAddress = req.ip;

        // Normalize IPv6 loopback to IPv4 loopback if necessary
        if (ipAddress === '::1') {
            ipAddress = '127.0.0.1';
        }

        // Check if the IP is IPv4 or IPv6
        const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
        const isIPv4 = ipv4Regex.test(ipAddress);
        // If not IPv4, assume IPv6 and keep as is

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const referrer = req.get('Referrer') || req.get('Referer') || null;

        // Asynchronously log the click without blocking the redirection
        linkAnalyticsRepository.logClick(link.id, ipAddress, userAgent, referrer).catch(error => {
            console.error('Error logging click:', error);
        });

        res.redirect(link.long_url);
    } catch (error) {
        console.error('Error during redirection:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Retrieves analytics data for a specific short link.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
exports.getLinkAnalytics = async (req, res) => {
    const userId = req.user.id;
    const { linkId } = req.params;
    const { startDate, endDate, limit, offset } = req.query;

    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Verify that the link belongs to the authenticated user
        const link = await linkRepository.getLinkById(linkId);
        if (!link || link.created_by !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const analytics = await linkAnalyticsRepository.getAnalytics(linkId, {
            startDate,
            endDate,
            limit: parseInt(limit, 10) || 100,
            offset: parseInt(offset, 10) || 0,
        });

        res.json({
            totalClicks: analytics.total,
            clicks: analytics.clicks,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
