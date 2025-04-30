/**
 * PrivAI Network - Configuration Module
 * 
 * This module provides centralized configuration for the entire PrivAI Network,
 * including network settings, protocol parameters, security settings, and more.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    apiPrefix: '/api/v1',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    jwtSecret: process.env.JWT_SECRET || 'privai-network-dev-secret',
    jwtExpiresIn: '24h'
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/privai-network',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Blockchain configuration
  blockchain: {
    defaultNetwork: process.env.DEFAULT_NETWORK || 'polygon_mumbai',
    networks: {
      ethereum_mainnet: {
        rpcUrl: process.env.ETH_MAINNET_RPC || 'https://mainnet.infura.io/v3/your-infura-key',
        chainId: 1,
        contracts: {
          praiToken: process.env.ETH_MAINNET_PRAI_TOKEN,
          dataRegistry: process.env.ETH_MAINNET_DATA_REGISTRY
        }
      },
      polygon_mainnet: {
        rpcUrl: process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com',
        chainId: 137,
        contracts: {
          praiToken: process.env.POLYGON_MAINNET_PRAI_TOKEN,
          dataRegistry: process.env.POLYGON_MAINNET_DATA_REGISTRY
        }
      },
      polygon_mumbai: {
        rpcUrl: process.env.POLYGON_MUMBAI_RPC || 'https://rpc-mumbai.maticvigil.com',
        chainId: 80001,
        contracts: {
          praiToken: process.env.POLYGON_MUMBAI_PRAI_TOKEN,
          dataRegistry: process.env.POLYGON_MUMBAI_DATA_REGISTRY
        }
      }
    },
    gasLimit: 3000000,
    didPrefix: 'did:prai:'
  },
  
  // IPFS configuration
  ipfs: {
    apiUrl: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001',
    gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    projectId: process.env.IPFS_PROJECT_ID,
    projectSecret: process.env.IPFS_PROJECT_SECRET
  },
  
  // Privacy computing configuration
  privacy: {
    smpc: {
      protocol: 'SPDZ',
      parties: 3,
      thresholdParties: 2,
      fieldSize: 2**32,
      useFHE: false
    },
    tee: {
      defaultEnclaveType: 'SGX',
      simulationMode: process.env.NODE_ENV !== 'production', // Use simulation in non-prod
      attestationService: 'https://api.trustedservices.intel.com/sgx/attestation/v4/'
    },
    federated: {
      roundsPerAggregation: 5,
      minClientsPerRound: 3,
      dpEnabled: true,
      dpEpsilon: 1.2,
      dpDelta: 1e-5
    }
  },
  
  // MCP (Model Context Protocol) configuration
  mcp: {
    contextWindowSize: 8192,
    maxToolCalls: 50,
    batchSize: 16,
    defaultTimeout: 30000, // 30 seconds
    defaultLLM: 'gpt-4',
    toolRegistry: {
      baseUrl: process.env.TOOL_REGISTRY_URL || 'http://localhost:3001/tools'
    }
  },
  
  // Logger configuration
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
    destination: process.env.LOG_FILE || 'stdout'
  },
  
  // Security configuration
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://ipfs.infura.io', 'https://polygon-rpc.com']
        }
      }
    }
  },
  
  // DAO configuration
  dao: {
    proposalThreshold: 1000000, // 1M tokens to create a proposal
    votingPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
    executionDelay: 2 * 24 * 60 * 60, // 2 days in seconds
    requiredQuorum: 10, // 10% participation required
    majorityPercentage: 51 // 51% approval required
  }
};

module.exports = config; 