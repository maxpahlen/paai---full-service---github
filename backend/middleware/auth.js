const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get token from the "Authorization" header

    if (token == null) return res.status(401).json({ message: 'Token required' }); // No token provided

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // Store user info in the request
        next(); // Proceed to the next middleware or route handler
    });
}

module.exports = authenticateToken;

