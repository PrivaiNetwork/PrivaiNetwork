/**
 * PrivAI Network - Computation Model
 * 
 * This module defines the MongoDB schema for computation jobs in the PrivAI Network.
 * It tracks privacy-preserving computations, their participants, inputs, and results.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ComputationSchema = new Schema({
  // Basic metadata
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Computation type and protocol
  type: {
    type: String,
    required: true,
    enum: [
      'matrix_multiplication', 
      'linear_regression', 
      'logistic_regression',
      'credit_assessment',
      'medical_analysis',
      'neural_network',
      'federated_learning',
      'custom'
    ],
    index: true
  },
  protocol: {
    type: String,
    required: true,
    enum: ['SPDZ', 'ABY', 'Shamir', 'TEE-SGX', 'FedAvg', 'Custom'],
    index: true
  },
  
  // Ownership and creation
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ownerDid: {
    type: String,
    index: true
  },
  
  // Participants
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    did: String,
    role: {
      type: String,
      enum: ['data_provider', 'compute_provider', 'result_receiver', 'validator'],
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'joined', 'active', 'completed', 'rejected', 'removed'],
      default: 'invited'
    },
    dataContributions: [{
      dataId: {
        type: Schema.Types.ObjectId,
        ref: 'Data'
      },
      dataRole: {
        type: String,
        enum: ['training', 'validation', 'testing', 'input', 'reference']
      }
    }],
    joinedAt: Date,
    lastActive: Date
  }],
  
  // Computation details
  parameters: {
    type: Schema.Types.Mixed, // Computation-specific parameters
    default: {}
  },
  privacySettings: {
    dpEnabled: {
      type: Boolean,
      default: false
    },
    dpEpsilon: {
      type: Number,
      default: 1.0
    },
    dpDelta: {
      type: Number,
      default: 1e-5
    },
    smpcParties: {
      type: Number,
      min: 2
    },
    smpcThreshold: {
      type: Number,
      min: 2
    }
  },
  inputData: [{
    dataId: {
      type: Schema.Types.ObjectId,
      ref: 'Data'
    },
    role: {
      type: String,
      enum: ['feature', 'target', 'model', 'parameter', 'reference']
    },
    metadata: Schema.Types.Mixed
  }],
  
  // Blockchain and verification
  onChain: {
    type: Boolean,
    default: false
  },
  blockchainMetadata: {
    network: String,
    contractAddress: String,
    computationId: String,
    registrationTxHash: String,
    resultTxHash: String
  },
  
  // Execution state
  status: {
    type: String,
    enum: [
      'created',
      'initializing',
      'waiting_participants',
      'preprocessing',
      'processing',
      'aggregating',
      'verifying',
      'completed',
      'failed',
      'cancelled'
    ],
    default: 'created',
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  currentStage: {
    type: String,
    default: 'setup'
  },
  startTime: Date,
  endTime: Date,
  
  // Execution details
  executionNodes: [{
    nodeId: String,
    nodeType: {
      type: String,
      enum: ['SMPC', 'TEE', 'FL-Aggregator', 'Worker']
    },
    status: String,
    ip: String, // May be masked or anonymized
    resources: {
      cpu: Number,
      memory: Number,
      gpu: Boolean
    },
    attestation: {
      // For TEE nodes
      mrenclave: String,
      timestamp: Date,
      verificationStatus: String
    }
  }],
  
  // Execution logs
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String, 
      enum: ['info', 'warning', 'error', 'debug']
    },
    message: String,
    component: String, // e.g., 'SMPC', 'TEE', 'Aggregator'
    metadata: Schema.Types.Mixed
  }],
  
  // Computation result
  result: {
    status: {
      type: String,
      enum: ['pending', 'success', 'partial', 'failed'],
      default: 'pending'
    },
    data: Schema.Types.Mixed,
    storageType: {
      type: String,
      enum: ['embedded', 'ipfs', 'encrypted-ipfs', 'reference', 'blockchain']
    },
    storageLocation: String,
    encryptionType: {
      type: String,
      enum: ['none', 'aes', 'hybrid', 'shamir']
    },
    accessList: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      did: String
    }],
    metrics: {
      accuracy: Number,
      runtime: Number, // in milliseconds
      convergence: Number,
      privacyLoss: Number // estimated privacy budget spent
    },
    verificationStatus: {
      type: String,
      enum: ['not_verified', 'verified', 'rejected', 'in_progress'],
      default: 'not_verified'
    },
    verificationDetails: Schema.Types.Mixed
  },
  
  // Error tracking
  error: {
    code: String,
    message: String,
    component: String,
    timestamp: Date,
    details: Schema.Types.Mixed
  },
  
  // Token rewards
  rewards: {
    total: {
      type: Number,
      default: 0
    },
    distributions: [{
      recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      recipientDid: String,
      amount: Number,
      reason: String,
      timestamp: Date,
      txHash: String
    }]
  },
  
  // MCP integration
  mcpMetadata: {
    contextWindowSize: Number,
    toolCalls: [{
      tool: String,
      params: Schema.Types.Mixed,
      timestamp: Date,
      result: Schema.Types.Mixed
    }],
    modelVersion: String
  }
}, {
  timestamps: true
});

// Indexes for performance
ComputationSchema.index({ 'status': 1, 'type': 1 });
ComputationSchema.index({ 'owner': 1, 'status': 1 });
ComputationSchema.index({ 'participants.did': 1 });
ComputationSchema.index({ 'participants.user': 1 });
ComputationSchema.index({ 'createdAt': -1 });

/**
 * Find active computations for a user
 */
ComputationSchema.statics.findActiveComputationsForUser = function(userId, did) {
  return this.find({
    $or: [
      { owner: userId },
      { ownerDid: did },
      { 'participants.user': userId },
      { 'participants.did': did }
    ],
    status: { 
      $nin: ['completed', 'failed', 'cancelled'] 
    }
  })
  .sort({ createdAt: -1 })
  .populate('owner', 'username profile.firstName profile.lastName')
  .populate('participants.user', 'username profile.firstName profile.lastName');
};

/**
 * Add a participant to the computation
 */
ComputationSchema.methods.addParticipant = function(userId, did, role) {
  // Check if participant already exists
  const existingParticipant = this.participants.find(p => 
    (p.user && p.user.toString() === userId) || (p.did && p.did === did)
  );
  
  if (existingParticipant) {
    existingParticipant.status = 'joined';
    existingParticipant.joinedAt = new Date();
    existingParticipant.lastActive = new Date();
    return this.save();
  }
  
  // Add new participant
  this.participants.push({
    user: userId,
    did,
    role,
    status: 'joined',
    joinedAt: new Date(),
    lastActive: new Date(),
    dataContributions: []
  });
  
  return this.save();
};

/**
 * Add log entry to computation
 */
ComputationSchema.methods.addLog = function(level, message, component, metadata = {}) {
  this.logs.push({
    timestamp: new Date(),
    level,
    message,
    component,
    metadata
  });
  
  // Limit log size to prevent unbounded growth
  if (this.logs.length > 1000) {
    this.logs = this.logs.slice(-1000);
  }
  
  return this.save();
};

/**
 * Update computation status
 */
ComputationSchema.methods.updateStatus = function(status, progress = null, currentStage = null) {
  this.status = status;
  
  if (progress !== null) {
    this.progress = progress;
  }
  
  if (currentStage) {
    this.currentStage = currentStage;
  }
  
  // Set start and end times based on status
  if (status === 'processing' && !this.startTime) {
    this.startTime = new Date();
  } else if (['completed', 'failed', 'cancelled'].includes(status) && !this.endTime) {
    this.endTime = new Date();
  }
  
  // Record error if status is failed
  if (status === 'failed' && !this.error) {
    this.error = {
      code: 'UNKNOWN_ERROR',
      message: 'Computation failed with unknown error',
      timestamp: new Date()
    };
  }
  
  return this.save();
};

/**
 * Record computation error
 */
ComputationSchema.methods.recordError = function(code, message, component, details = {}) {
  this.error = {
    code,
    message,
    component,
    timestamp: new Date(),
    details
  };
  
  this.status = 'failed';
  this.endTime = new Date();
  
  return this.save();
};

/**
 * Set computation result
 */
ComputationSchema.methods.setResult = function(resultData, resultStatus = 'success', metrics = {}) {
  this.result = {
    status: resultStatus,
    data: resultData,
    storageType: 'embedded',
    encryptionType: 'none',
    metrics,
    verificationStatus: 'not_verified'
  };
  
  if (resultStatus === 'success') {
    this.status = 'completed';
    this.progress = 100;
    this.endTime = new Date();
  }
  
  return this.save();
};

// Create and export the model
const Computation = mongoose.model('Computation', ComputationSchema);
module.exports = Computation; 