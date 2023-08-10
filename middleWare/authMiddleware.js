// authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../dbConfig');

// Middleware function to check token and set req.user if valid
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }
  secretKey = process.env.SECRET_KEY;
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // If the token is valid, set the user object in the request for future use
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
