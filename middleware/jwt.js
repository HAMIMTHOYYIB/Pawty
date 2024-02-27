// middlewares/authMiddleware.js
const jwtService = require('../services/jwtService');

function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const decodedToken = jwtService.verifyToken(token);
    if (!decodedToken) {
        return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = decodedToken;
    next();
}

module.exports = { verifyToken };
