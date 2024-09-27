// utils/generateShortCode.js

/**
 * Generates a random alphanumeric short code of specified length.
 * @param {number} length - The length of the short code. Default is 6.
 * @returns {string} The generated short code.
 */
const generateShortCode = (length = 6) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let shortCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        shortCode += characters[randomIndex];
    }
    return shortCode;
};

module.exports = generateShortCode;
