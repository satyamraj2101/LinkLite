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
     * Creates a new short link with optional custom short code and device-specific URLs.
     * @param {Object} params - Parameters for link creation.
     * @param {string} params.longUrlDesktop - Desktop long URL.
     * @param {string} [params.longUrlMobile] - Mobile long URL (optional).
     * @param {string} params.shortCode - Short code (custom or generated).
     * @param {string} [params.name] - Optional name for the link.
     * @param {Date} [params.expiry] - Optional expiry date.
     * @param {string} [params.imageUrl] - Optional image URL.
     * @param {number} params.userId - ID of the user creating the link.
     * @returns {Promise<Object>} The created link.
     */
    async createLink({
                         longUrlDesktop,
                         longUrlMobile = null,
                         shortCode,
                         name = null,
                         expiry = null,
                         imageUrl = null,
                         userId
                     }) {
        const query = `
            INSERT INTO links (
                long_url_desktop,
                long_url_mobile,
                short_code,
                name,
                expiry,
                image_url,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
        `;
        const values = [
            longUrlDesktop,
            longUrlMobile,
            shortCode,
            name,
            expiry,
            imageUrl,
            userId
        ];
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

        const deviceType = uaResult.device.type || 'desktop'; // 'mobile', 'tablet', etc.

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
            deviceType,
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
 * Creates a new short link with optional custom short code and device-specific URLs.
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

    const {
        longUrlDesktop,
        longUrlMobile,
        shortCode, // Optional custom short code
        name,
        expiry,
        imageUrl
    } = req.body;
    const userId = req.user.id;

    try {
        let finalShortCode = shortCode;

        if (shortCode) {
            // Validate custom short code uniqueness
            const existingLink = await linkRepository.getLinkByShortCode(shortCode);
            if (existingLink) {
                return res.status(400).json({ message: 'Short code already in use' });
            }
        } else {
            // Generate a unique short code
            let isUnique = false;
            while (!isUnique) {
                finalShortCode = generateShortCode(6);
                const existingLink = await linkRepository.getLinkByShortCode(finalShortCode);
                if (!existingLink) {
                    isUnique = true;
                }
            }
        }

        // Ensure at least longUrlDesktop is provided
        if (!longUrlDesktop) {
            return res.status(400).json({ message: 'Desktop URL is required' });
        }

        // Create the link with device-specific URLs
        const newLink = await linkRepository.createLink({
            longUrlDesktop,
            longUrlMobile,
            shortCode: finalShortCode,
            name,
            expiry,
            imageUrl,
            userId
        });

        res.status(201).json({
            message: 'Short link created successfully',
            link: {
                id: newLink.id,
                longUrlDesktop: newLink.long_url_desktop,
                longUrlMobile: newLink.long_url_mobile,
                shortCode: newLink.short_code,
                name: newLink.name,
                expiry: newLink.expiry,
                imageUrl: newLink.image_url,
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
                longUrlDesktop: link.long_url_desktop,
                longUrlMobile: link.long_url_mobile,
                shortCode: link.short_code,
                name: link.name,
                expiry: link.expiry,
                imageUrl: link.image_url,
                createdAt: link.created_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching user links:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Redirects to the appropriate long URL based on device type.
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

        // Ensure at least one URL is present
        if (!link.long_url_desktop && !link.long_url_mobile) {
            return res.status(500).json({ message: 'No target URL configured for this link' });
        }

        // Detect device type
        const userAgent = req.headers['user-agent'] || '';
        const parser = new UAParser(userAgent);
        const deviceType = parser.getDevice().type || 'desktop'; // Default to desktop

        // Determine the appropriate long URL
        let targetUrl;
        if (deviceType === 'mobile' && link.long_url_mobile) {
            targetUrl = link.long_url_mobile;
        } else {
            targetUrl = link.long_url_desktop;
        }

        // Fallback to desktop URL if mobile URL is not set
        if (!targetUrl) {
            targetUrl = link.long_url_desktop;
        }

        // Retrieve the real IP address using req.ip
        let ipAddress = req.ip;

        // Normalize IPv6 loopback to IPv4 loopback if necessary
        if (ipAddress === '::1') {
            ipAddress = '127.0.0.1';
        }

        const referrer = req.get('Referrer') || req.get('Referer') || null;

        // Asynchronously log the click without blocking the redirection
        linkAnalyticsRepository.logClick(link.id, ipAddress, userAgent, referrer).catch(error => {
            console.error('Error logging click:', error);
        });

        // Option 1: Redirect immediately
        res.redirect(targetUrl);

        // Option 2: Render a redirect page with OG tags (optional)
        /*
        const urlData = {
            longUrl: targetUrl,
            ogTitle: link.name || 'Redirecting...',
            ogDescription: 'This link redirects you to your destination.',
            ogImage: link.image_url
        };

        res.render('redirect', {
            longUrl: urlData.longUrl,
            ogTitle: urlData.ogTitle,
            ogDescription: urlData.ogDescription,
            ogImage: urlData.ogImage
        });
        */
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
