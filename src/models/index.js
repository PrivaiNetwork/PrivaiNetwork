/**
 * PrivAI Network - Models Index
 * 
 * This module exports all MongoDB models for the PrivAI Network.
 */

const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize models
const User = require('./user');
const Data = require('./data');
const Computation = require('./computation');

// Database connection function
const connectDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB database...');
    
    await mongoose.connect(config.database.uri, config.database.options);
    
    logger.info('Successfully connected to MongoDB database');
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected, attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
    
    // When Node process ends, close the MongoDB connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to application termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error.message });
    throw error;
  }
};

// Export models and connection function
module.exports = {
  User,
  Data,
  Computation,
  connectDatabase,
  mongoose
}; 