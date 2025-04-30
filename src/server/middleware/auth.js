/**
 * PrivAI Network - Authentication Middleware
 * 
 * This module provides authentication middleware for protecting API routes
 * and verifying user credentials.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../models');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.server.jwtSecret);
};

/**
 * Middleware to protect routes requiring authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }
    
    // Extract token from Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid authorization format, use: Bearer <token>'
      });
    }
    
    const token = parts[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User inactive or not found'
      });
    }
    
    // Attach user to request object for later use
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      did: user.did,
      ethAddress: user.ethAddress,
      permissions: user.permissions
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error.message
      });
    }
    
    logger.error('Authentication error:', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication process failed'
    });
  }
};

/**
 * Middleware to check for API key authentication
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    // Check for API key in header or query params
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No API key provided'
      });
    }
    
    // Find user by API key
    const user = await User.findByApiKey(apiKey);
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid API key or inactive user'
      });
    }
    
    // Get API key details
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyDetails = user.apiKeys.find(k => k.key === keyHash);
    
    // Attach user to request object for later use
    req.user = {
      id: user._id,
      username: user.username,
      roles: user.roles,
      did: user.did,
      permissions: keyDetails?.permissions || user.permissions,
      apiKey: true
    };
    
    next();
  } catch (error) {
    logger.error('API key authentication error:', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication process failed'
    });
  }
};

/**
 * Middleware to check for required roles
 * @param {string[]} roles - Array of required roles
 */
const requireRoles = (roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    // Check if user has at least one of the required roles
    const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware to check for specific permissions
 * @param {string[]} permissions - Array of required permissions
 */
const requirePermissions = (permissions) => {
  return (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    // Admin role bypasses permission checks
    if (req.user.roles.includes('admin')) {
      return next();
    }
    
    // Check if user has all required permissions
    const hasAllPermissions = permissions.every(
      permission => req.user.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required permissions: ${permissions.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Login the user and generate authentication token
 */
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if ((!username && !email) || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username/email and password are required'
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username/email or password'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User account is inactive'
      });
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    // Generate authentication token
    const token = user.generateAuthToken();
    
    // Return user info and token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        did: user.did,
        ethAddress: user.ethAddress,
        profile: user.profile
      }
    });
  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login process failed'
    });
  }
};

module.exports = {
  authenticate,
  authenticateApiKey,
  requireRoles,
  requirePermissions,
  verifyToken,
  login
}; 