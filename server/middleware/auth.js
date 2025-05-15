const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// JWT secret from Supabase project settings
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to verify JWT token from Supabase
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    // Verify the token using the JWT secret from Supabase
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add the user data to the request object
    req.user = {
      id: decoded.sub, // Supabase stores user ID in the 'sub' claim
      email: decoded.email,
      role: decoded.role,
      aud: decoded.aud
    };
    
    // Verify that token is for authenticated users
    if (decoded.aud !== 'authenticated') {
      return res.status(401).json({ error: 'Invalid token audience.' });
    }
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      aud: decoded.aud
    };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { verifyToken, optionalAuth };