/**
 * PrivAI Network - Data Model
 * 
 * This module defines the MongoDB schema for data records in the PrivAI Network.
 * These records represent datasets and their metadata, with privacy controls and
 * blockchain integration.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const DataSchema = new Schema({
  // Basic metadata
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  dataType: {
    type: String,
    required: true,
    enum: ['medical', 'financial', 'iot', 'personal', 'scientific', 'social', 'other'],
    index: true
  },
  tags: {
    type: [String],
    index: true
  },
  
  // Ownership and access control
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
  accessControl: {
    type: String,
    enum: ['private', 'restricted', 'public'],
    default: 'private'
  },
  accessList: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    did: String,
    accessType: {
      type: String,
      enum: ['read', 'compute', 'full'],
      default: 'read'
    },
    expiresAt: Date
  }],
  
  // Storage and blockchain references
  storageType: {
    type: String,
    enum: ['ipfs', 'encrypted-ipfs', 'secured-url', 'tee-storage', 'reference'],
    required: true
  },
  storageLocation: {
    type: String, // IPFS hash, URL, or reference ID
    required: true
  },
  encryptionType: {
    type: String,
    enum: ['none', 'aes', 'homomorphic', 'paillier', 'shamir'],
    default: 'none'
  },
  encryptionMetadata: {
    keyShards: Number,
    thresholdShards: Number,
    encryptedKeyLocations: [String],
    algorithm: String,
    keyLength: Number
  },
  
  // Blockchain integration
  onChain: {
    type: Boolean,
    default: false
  },
  blockchainMetadata: {
    network: {
      type: String,
      enum: ['ethereum', 'polygon', 'other']
    },
    contractAddress: String,
    dataId: String, // Hash/ID on the blockchain
    registrationTxHash: String,
    registrationTimestamp: Date,
    lastUpdateTxHash: String
  },
  
  // Data quality and analytics
  quality: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    verifiedBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number,
      timestamp: Date
    }]
  },
  statistics: {
    size: Number, // Size in bytes
    records: Number, // Number of records/rows
    fields: Number, // Number of fields/columns
    lastAnalysis: Date,
    schema: Schema.Types.Mixed // JSON schema representation
  },
  
  // Privacy metrics
  privacyMetrics: {
    dpEpsilon: Number, // Differential privacy epsilon value
    dpDelta: Number,   // Differential privacy delta value
    anonymizationLevel: {
      type: String,
      enum: ['raw', 'pseudonymized', 'anonymized', 'synthetic'],
      default: 'raw'
    },
    privacyTechniques: [String] // e.g., ['k-anonymity', 'differential-privacy']
  },
  
  // Versioning and provenance
  version: {
    type: String,
    default: '1.0.0'
  },
  versionHistory: [{
    version: String,
    changelog: String,
    timestamp: Date,
    storageLocation: String
  }],
  provenance: {
    source: String,
    parentDatasets: [{
      type: Schema.Types.ObjectId,
      ref: 'Data'
    }],
    creationMethod: String,
    transformations: [String]
  },
  
  // Usage tracking
  usage: {
    computeCount: {
      type: Number,
      default: 0
    },
    lastComputeTime: Date,
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessTime: Date,
    computeHistory: [{
      computeId: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      operation: String,
      timestamp: Date
    }]
  },
  
  // Rewards and incentives
  rewards: {
    totalEarned: {
      type: Number,
      default: 0
    },
    lastPayoutAmount: Number,
    lastPayoutTime: Date,
    payoutHistory: [{
      amount: Number,
      timestamp: Date,
      txHash: String
    }]
  },
  
  // Data status
  status: {
    type: String,
    enum: ['active', 'archived', 'deprecated', 'removed'],
    default: 'active',
    index: true
  },
  
  // License and terms
  license: {
    type: String,
    enum: ['MIT', 'Apache-2.0', 'GPL-3.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'Custom', 'None'],
    default: 'None'
  },
  customLicense: String, // For custom license text
  termsOfUse: String
}, {
  timestamps: true
});

// Indexes for query performance
DataSchema.index({ 'blockchainMetadata.dataId': 1 });
DataSchema.index({ 'accessControl': 1, 'status': 1 });
DataSchema.index({ 'dataType': 1, 'tags': 1 });
DataSchema.index({ 'quality.score': -1 });

/**
 * Check if a user has access to this data
 */
DataSchema.methods.hasAccess = function(userId, did) {
  // Public data is accessible to all
  if (this.accessControl === 'public') return true;
  
  // Owner always has access
  if (this.owner.toString() === userId || this.ownerDid === did) return true;
  
  // Check access list for restricted data
  if (this.accessControl === 'restricted') {
    const now = new Date();
    return this.accessList.some(access => {
      const userMatch = access.user && access.user.toString() === userId;
      const didMatch = access.did && access.did === did;
      const notExpired = !access.expiresAt || access.expiresAt > now;
      
      return (userMatch || didMatch) && notExpired;
    });
  }
  
  // Private data is only accessible by owner (already checked above)
  return false;
};

/**
 * Get access level for a user
 */
DataSchema.methods.getAccessLevel = function(userId, did) {
  // If no access, return null
  if (!this.hasAccess(userId, did)) return null;
  
  // Owner has full access
  if (this.owner.toString() === userId || this.ownerDid === did) return 'full';
  
  // For users in access list, return their specific access type
  const access = this.accessList.find(a => {
    return (a.user && a.user.toString() === userId) || (a.did && a.did === did);
  });
  
  if (access) return access.accessType;
  
  // For public data, default to read access
  return this.accessControl === 'public' ? 'read' : null;
};

/**
 * Record a compute usage
 */
DataSchema.methods.recordCompute = function(userId, computeId, operation) {
  this.usage.computeCount += 1;
  this.usage.lastComputeTime = new Date();
  
  this.usage.computeHistory.push({
    computeId,
    user: userId,
    operation,
    timestamp: new Date()
  });
  
  // Limit history size to prevent unbounded growth
  if (this.usage.computeHistory.length > 100) {
    this.usage.computeHistory = this.usage.computeHistory.slice(-100);
  }
  
  return this.save();
};

/**
 * Record a data access
 */
DataSchema.methods.recordAccess = function() {
  this.usage.accessCount += 1;
  this.usage.lastAccessTime = new Date();
  return this.save();
};

/**
 * Find datasets accessible by a user
 */
DataSchema.statics.findAccessibleDatasets = function(userId, did, options = {}) {
  const query = {
    status: 'active',
    $or: [
      { owner: userId },
      { ownerDid: did },
      { accessControl: 'public' },
      {
        accessControl: 'restricted',
        'accessList.user': userId
      },
      {
        accessControl: 'restricted',
        'accessList.did': did
      }
    ]
  };
  
  // Add data type filter if specified
  if (options.dataType) {
    query.dataType = options.dataType;
  }
  
  // Add tags filter if specified
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  // Find datasets with pagination
  return this.find(query)
    .skip(options.skip || 0)
    .limit(options.limit || 20)
    .sort(options.sort || { createdAt: -1 })
    .populate('owner', 'username profile.firstName profile.lastName');
};

// Create and export the model
const Data = mongoose.model('Data', DataSchema);
module.exports = Data; 