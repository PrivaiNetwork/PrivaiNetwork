/**
 * PrivAI Network - Error Handling Middleware
 * 
 * This module provides centralized error handling for the Express server.
 */

const logger = require('../../utils/logger');

/**
 * Custom API error class
 */
class APIError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_SERVER_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // Set default status and error code
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  
  // Log the error
  if (status >= 500) {
    logger.error('Server error:', {
      url: req.originalUrl,
      method: req.method,
      error: err.message,
      stack: err.stack,
      code,
      status
    });
  } else {
    logger.warn('Client error:', {
      url: req.originalUrl,
      method: req.method,
      error: err.message,
      code,
      status
    });
  }
  
  // Prepare response object
  const errorResponse = {
    error: code,
    message: err.message
  };
  
  // Include error details if available
  if (err.details && Object.keys(err.details).length > 0) {
    errorResponse.details = err.details;
  }
  
  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development' && status >= 500) {
    errorResponse.stack = err.stack;
  }
  
  // Send error response
  res.status(status).json(errorResponse);
};

/**
 * Async error handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
const notFound = (message = 'Resource not found') => {
  return new APIError(message, 404, 'NOT_FOUND');
};

const badRequest = (message = 'Invalid request', details = {}) => {
  return new APIError(message, 400, 'BAD_REQUEST', details);
};

const unauthorized = (message = 'Authentication required') => {
  return new APIError(message, 401, 'UNAUTHORIZED');
};

const forbidden = (message = 'Access denied') => {
  return new APIError(message, 403, 'FORBIDDEN');
};

const conflict = (message = 'Resource conflict', details = {}) => {
  return new APIError(message, 409, 'CONFLICT', details);
};

const internalError = (message = 'Internal server error', details = {}) => {
  return new APIError(message, 500, 'INTERNAL_SERVER_ERROR', details);
};

module.exports = {
  APIError,
  errorMiddleware,
  asyncHandler,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  internalError
}; 