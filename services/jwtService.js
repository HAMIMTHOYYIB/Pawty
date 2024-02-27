// services/jwtService.js
const jwt = require('jsonwebtoken');

function generateToken(payload) {
    return jwt.sign(payload, 'your_secret_key', { expiresIn: '24h' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, 'your_secret_key');
    } catch (error) {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
