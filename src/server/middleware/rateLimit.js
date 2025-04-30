/**
 * PrivAI Network - Rate Limiting Middleware
 * 
 * This module provides rate limiting functionality to protect API endpoints
 * from abuse and ensure fair usage.
 */

const config = require('../../config');
const logger = require('../../utils/logger');

// Simple in-memory store for rate limiting
// In production, consider using Redis or similar for distributed systems
class RateLimitStore {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }
  
  // Record a request for an IP address
  record(key) {
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + config.security.rateLimit.windowMs
      });
      return 1;
    }
    
    const data = this.requests.get(key);
    
    // If window has expired, reset counter
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + config.security.rateLimit.windowMs;
      this.requests.set(key, data);
      return 1;
    }
    
    // Increment counter
    data.count += 1;
    this.requests.set(key, data);
    return data.count;
  }
  
  // Get request count for an IP address
  getCount(key) {
    const now = Date.now();
    const data = this.requests.get(key);
    
    if (!data || now > data.resetTime) {
      return 0;
    }
    
    return data.count;
  }
  
  // Get time until reset for an IP address
  getResetTime(key) {
    const data = this.requests.get(key);
    
    if (!data) {
      return 0;
    }
    
    const now = Date.now();
    return Math.max(0, data.resetTime - now);
  }
  
  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
  
  // Destroy the store (for tests/cleanup)
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Create rate limit store instance
const store = new RateLimitStore();

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = (req, res, next) => {
  try {
    // Get client IP address
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     'unknown';
    
    // Skip rate limiting for whitelisted IPs (e.g., internal services)
    const whitelist = process.env.RATE_LIMIT_WHITELIST 
      ? process.env.RATE_LIMIT_WHITELIST.split(',') 
      : [];
      
    if (whitelist.includes(clientIp)) {
      return next();
    }
    
    // Skip rate limiting for health check and static routes
    if (req.path === '/health' || req.path.startsWith('/static/')) {
      return next();
    }
    
    // Calculate rate limit key (IP by default, can be customized per route)
    const routeKey = req.rateLimitRouteKey || req.path;
    const key = `${clientIp}:${routeKey}`;
    
    // Record request
    const requestCount = store.record(key);
    const maxRequests = req.rateLimitMax || config.security.rateLimit.max;
    
    // Set rate limit headers
    const resetTime = store.getResetTime(key);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000)); // in seconds
    
    // Check if rate limit exceeded
    if (requestCount > maxRequests) {
      logger.warn('Rate limit exceeded', { 
        ip: clientIp, 
        path: req.path, 
        count: requestCount,
        limit: maxRequests
      });
      
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(resetTime / 1000) // in seconds
      });
    }
    
    next();
  } catch (error) {
    logger.error('Rate limit middleware error', { error: error.message });
    next(); // Continue in case of error to prevent blocking valid requests
  }
};

/**
 * Apply specific rate limit to a route
 * @param {Object} options - Custom rate limit options
 */
const customRateLimit = (options = {}) => {
  return (req, res, next) => {
    if (options.routeKey) {
      req.rateLimitRouteKey = options.routeKey;
    }
    
    if (options.max) {
      req.rateLimitMax = options.max;
    }
    
    next();
  };
};

module.exports = {
  rateLimitMiddleware,
  customRateLimit,
  store // Exported for testing purposes
}; 