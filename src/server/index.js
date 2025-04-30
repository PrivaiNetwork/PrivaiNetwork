/**
 * PrivAI Network - Server Entry Point
 * 
 * This module initializes and configures the Express server for the PrivAI Network,
 * setting up middleware, API routes, and database connections.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Internal modules
const config = require('../config');
const logger = require('../utils/logger');
const { connectDatabase } = require('../models');
const apiRoutes = require('./api');
const errorMiddleware = require('./middleware/error');
const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.server.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Apply middleware
app.use(helmet(config.security.helmet));
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true
}));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(rateLimitMiddleware);

// Static files
app.use(express.static(path.join(__dirname, '../../public')));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// API routes with prefix
app.use(config.server.apiPrefix, apiRoutes);

// Error handling middleware (should be last)
app.use(errorMiddleware);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`
  });
});

// Set up Socket.IO for real-time communication
io.on('connection', (socket) => {
  logger.info('New socket connection established', { socketId: socket.id });
  
  // Authenticate socket connections
  socket.use(([event, data], next) => {
    if (event === 'authenticate') {
      return next();
    }
    
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const decoded = authMiddleware.verifyToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });
  
  // Socket authentication
  socket.on('authenticate', (data) => {
    try {
      const decoded = authMiddleware.verifyToken(data.token);
      socket.user = decoded;
      socket.join(`user:${decoded.id}`);
      socket.emit('authenticated', { userId: decoded.id });
      logger.debug('Socket authenticated', { userId: decoded.id, socketId: socket.id });
    } catch (err) {
      socket.emit('authentication_error', { message: 'Invalid token' });
    }
  });
  
  // Socket events for real-time updates
  socket.on('subscribe:computation', (computationId) => {
    if (!socket.user) return;
    socket.join(`computation:${computationId}`);
    logger.debug('User subscribed to computation updates', { 
      userId: socket.user.id, 
      computationId 
    });
  });
  
  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
  });
});

// Initialize the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Start the server
    const port = config.server.port;
    server.listen(port, () => {
      logger.info(`PrivAI Network server running on port ${port}`);
      logger.info(`API available at http://${config.server.host}:${port}${config.server.apiPrefix}`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', { error: err.message, stack: err.stack });
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
      
      // Gracefully shutdown in case of uncaught exception
      server.close(() => {
        logger.info('Server closed due to uncaught exception');
        process.exit(1);
      });
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Export for testing/importing
module.exports = {
  app,
  server,
  io,
  startServer
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
} 