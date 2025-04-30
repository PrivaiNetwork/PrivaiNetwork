/**
 * PrivAI Network - API Routes Index
 * 
 * This module combines all API routes for the PrivAI Network server.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./user');
const dataRoutes = require('./data');
const computationRoutes = require('./computation');
const privacyRoutes = require('./privacy');
const web3Routes = require('./web3');
const mcpRoutes = require('./mcp');

// Welcome route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the PrivAI Network API',
    version: '1.0.0',
    documentation: '/api/v1/docs'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/data', dataRoutes);
router.use('/computations', computationRoutes);
router.use('/privacy', privacyRoutes);
router.use('/web3', web3Routes);
router.use('/mcp', mcpRoutes);

// API documentation route
router.get('/docs', (req, res) => {
  res.json({
    message: 'API documentation',
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        refreshToken: 'POST /auth/refresh-token',
        logout: 'POST /auth/logout'
      },
      users: {
        getProfile: 'GET /users/profile',
        updateProfile: 'PUT /users/profile',
        listUsers: 'GET /users',
        getUserById: 'GET /users/:id',
        generateApiKey: 'POST /users/api-keys',
        revokeApiKey: 'DELETE /users/api-keys/:keyId'
      },
      data: {
        listData: 'GET /data',
        getDataById: 'GET /data/:id',
        createData: 'POST /data',
        updateData: 'PUT /data/:id',
        deleteData: 'DELETE /data/:id',
        grantAccess: 'POST /data/:id/access',
        revokeAccess: 'DELETE /data/:id/access/:userId'
      },
      computations: {
        listComputations: 'GET /computations',
        getComputationById: 'GET /computations/:id',
        createComputation: 'POST /computations',
        cancelComputation: 'POST /computations/:id/cancel',
        getResults: 'GET /computations/:id/results'
      },
      privacy: {
        smpc: {
          createSession: 'POST /privacy/smpc/sessions',
          joinSession: 'POST /privacy/smpc/sessions/:id/join',
          getStatus: 'GET /privacy/smpc/sessions/:id'
        },
        tee: {
          createEnclave: 'POST /privacy/tee/enclaves',
          getAttestation: 'GET /privacy/tee/enclaves/:id/attestation',
          executeTEE: 'POST /privacy/tee/enclaves/:id/execute'
        }
      },
      web3: {
        blockchain: {
          getStatus: 'GET /web3/blockchain/status',
          registerDID: 'POST /web3/blockchain/did',
          verifyDID: 'GET /web3/blockchain/did/:did/verify'
        },
        dao: {
          createProposal: 'POST /web3/dao/proposals',
          castVote: 'POST /web3/dao/proposals/:id/vote',
          delegateVote: 'POST /web3/dao/delegate'
        }
      },
      mcp: {
        executeTool: 'POST /mcp/tools/:toolId',
        listTools: 'GET /mcp/tools',
        registerTool: 'POST /mcp/tools'
      }
    }
  });
});

module.exports = router; 