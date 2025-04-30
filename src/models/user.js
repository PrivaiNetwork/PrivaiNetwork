/**
 * PrivAI Network - User Model
 * 
 * This module defines the MongoDB schema for users in the PrivAI Network.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { Schema } = mongoose;

const UserSchema = new Schema({
  // Basic user information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  
  // Password fields (hashed, not stored in plaintext)
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  
  // Web3 related fields
  did: {
    type: String,
    unique: true,
    sparse: true, // Allow null values (for users without DIDs)
    index: true
  },
  ethAddress: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^0x[a-fA-F0-9]{40}$/, 'Please fill a valid Ethereum address']
  },
  
  // User profile
  profile: {
    firstName: String,
    lastName: String,
    bio: {
      type: String,
      maxlength: 500
    },
    avatar: String, // IPFS hash or URL to profile image
    organization: String,
    website: String,
    location: String
  },
  
  // User roles and permissions
  roles: {
    type: [String],
    enum: ['user', 'dataProvider', 'computeProvider', 'admin', 'moderator'],
    default: ['user']
  },
  permissions: {
    type: [String],
    default: []
  },
  
  // Privacy settings
  privacySettings: {
    shareUsageStats: {
      type: Boolean,
      default: true
    },
    allowDatasetIndexing: {
      type: Boolean,
      default: true
    },
    allowContactByEmail: {
      type: Boolean,
      default: true
    }
  },
  
  // DAO-related fields
  daoMember: {
    type: Boolean,
    default: false
  },
  tokensHeld: {
    type: Number,
    default: 0
  },
  votingDelegation: {
    delegatedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    delegatedFrom: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      tokens: Number
    }]
  },
  
  // User activity and metrics
  contributions: {
    datasets: {
      type: Number,
      default: 0
    },
    computeHours: {
      type: Number,
      default: 0
    },
    models: {
      type: Number,
      default: 0
    }
  },
  
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  
  // Timestamps
  lastLogin: Date,
  verifiedAt: Date,
  
  // API keys
  apiKeys: [{
    key: String,
    name: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date,
    permissions: [String]
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: {
    transform: function(doc, ret) {
      delete ret.hashedPassword;
      delete ret.salt;
      return ret;
    }
  }
});

/**
 * Virtual for user's full name
 */
UserSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

/**
 * Method to set the password
 */
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hashedPassword = crypto.pbkdf2Sync(
    password, this.salt, 10000, 64, 'sha512'
  ).toString('hex');
};

/**
 * Method to validate password
 */
UserSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(
    password, this.salt, 10000, 64, 'sha512'
  ).toString('hex');
  return this.hashedPassword === hash;
};

/**
 * Generate a JWT token for authentication
 */
UserSchema.methods.generateAuthToken = function() {
  const jwt = require('jsonwebtoken');
  const config = require('../config');
  
  return jwt.sign(
    { 
      id: this._id, 
      username: this.username,
      roles: this.roles,
      did: this.did
    },
    config.server.jwtSecret,
    { expiresIn: config.server.jwtExpiresIn }
  );
};

/**
 * Generate a new API key
 */
UserSchema.methods.generateApiKey = function(name, permissions = []) {
  const key = crypto.randomBytes(32).toString('hex');
  
  this.apiKeys.push({
    key: crypto.createHash('sha256').update(key).digest('hex'),
    name,
    permissions,
    createdAt: new Date()
  });
  
  return key; // Return the plaintext key (will only be shown once to the user)
};

/**
 * Static method to find user by API key
 */
UserSchema.statics.findByApiKey = async function(apiKey) {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const user = await this.findOne({
    'apiKeys.key': keyHash,
    status: 'active'
  });
  
  if (user) {
    // Update last used timestamp
    const keyIndex = user.apiKeys.findIndex(k => k.key === keyHash);
    if (keyIndex !== -1) {
      user.apiKeys[keyIndex].lastUsed = new Date();
      await user.save();
    }
  }
  
  return user;
};

// Create and export the model
const User = mongoose.model('User', UserSchema);
module.exports = User; 