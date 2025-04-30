/**
 * PrivAI Network - Logging Utility
 * 
 * This module provides standardized logging functionality across the PrivAI Network,
 * supporting multiple formats and destinations.
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');

// Define log levels and their numeric values
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

class Logger {
  constructor(options = {}) {
    this.options = {
      level: options.level || config.logger.level || 'info',
      format: options.format || config.logger.format || 'pretty',
      destination: options.destination || config.logger.destination || 'stdout',
      context: options.context || 'app',
      enableMetadata: options.enableMetadata !== undefined ? options.enableMetadata : true,
      ...options
    };
    
    // Set up log file stream if needed
    if (this.options.destination !== 'stdout' && this.options.destination !== 'stderr') {
      const logDir = path.dirname(this.options.destination);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.stream = fs.createWriteStream(this.options.destination, { flags: 'a' });
    }
  }
  
  /**
   * Log a message at the specified level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata to include
   */
  log(level, message, metadata = {}) {
    // Check if this log level should be logged
    if (LOG_LEVELS[level] > LOG_LEVELS[this.options.level]) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logContext = metadata.context || this.options.context;
    
    // Prepare the log entry
    const logEntry = {
      timestamp,
      level,
      context: logContext,
      message,
      ...(this.options.enableMetadata ? metadata : {})
    };
    
    // Format the log entry
    let formattedLog;
    if (this.options.format === 'json') {
      formattedLog = JSON.stringify(logEntry);
    } else { // 'pretty' format
      formattedLog = `[${timestamp}] ${level.toUpperCase().padEnd(5)} [${logContext}]: ${message}`;
      
      // Add metadata if present and enabled
      if (this.options.enableMetadata && Object.keys(metadata).length > 0) {
        const metadataString = Object.entries(metadata)
          .filter(([key]) => key !== 'context') // Skip 'context' as it's already included
          .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join(' ');
        
        if (metadataString) {
          formattedLog += ` (${metadataString})`;
        }
      }
    }
    
    // Write to the appropriate destination
    if (this.stream) {
      this.stream.write(formattedLog + '\n');
    } else if (this.options.destination === 'stderr' || level === 'error') {
      process.stderr.write(formattedLog + '\n');
    } else {
      process.stdout.write(formattedLog + '\n');
    }
  }
  
  // Convenience methods for each log level
  error(message, metadata = {}) {
    this.log('error', message, metadata);
  }
  
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }
  
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }
  
  debug(message, metadata = {}) {
    this.log('debug', message, metadata);
  }
  
  trace(message, metadata = {}) {
    this.log('trace', message, metadata);
  }
  
  /**
   * Create a child logger with a specific context
   * @param {string} context - Context for the child logger
   * @returns {Logger} Child logger instance
   */
  child(context) {
    return new Logger({
      ...this.options,
      context
    });
  }
  
  /**
   * Close the logger and any open streams
   */
  close() {
    if (this.stream) {
      this.stream.end();
    }
  }
}

// Create and export the default logger
const defaultLogger = new Logger();

module.exports = defaultLogger; 