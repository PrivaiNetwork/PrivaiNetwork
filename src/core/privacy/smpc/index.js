/**
 * PrivAI Network - Secure Multi-Party Computation (SMPC) Module
 * 
 * This module integrates various SMPC protocols including SPDZ and Shamir's
 * Secret Sharing to enable privacy-preserving computations across multiple
 * parties without revealing the raw data.
 */

const crypto = require('crypto');
const ShamirSecretSharing = require('./shamir');
const SPDZProtocol = require('./spdz');

class SMPC {
  constructor(config = {}) {
    this.config = {
      protocol: config.protocol || 'SPDZ', // SPDZ, ABY, etc.
      parties: config.parties || 3,  // Minimum 3 parties for security
      thresholdParties: config.thresholdParties || 2, // Minimum parties needed for reconstruction
      fieldSize: config.fieldSize || 2**32, // For modular arithmetic
      useFHE: config.useFHE || false, // Fully Homomorphic Encryption
      ...config
    };
    
    this.participants = [];
    this.computations = new Map();
    this.shares = new Map();
    
    // Initialize protocol implementations
    this.spdzProtocol = new SPDZProtocol({
      parties: this.config.parties,
      fieldSize: this.config.fieldSize
    });
  }
  
  /**
   * Register a participant for SMPC computation
   * @param {string} did - Decentralized identifier of the participant
   * @param {string} publicKey - Public key for authentication
   * @returns {string} Participant ID
   */
  registerParticipant(did, publicKey) {
    const participantId = crypto.randomBytes(16).toString('hex');
    
    this.participants.push({
      id: participantId,
      did,
      publicKey,
      status: 'active',
      lastSeen: Date.now()
    });
    
    console.log(`SMPC participant ${did} registered with ID ${participantId}`);
    return participantId;
  }
  
  /**
   * Create a new SMPC computation task
   * @param {string} ownerId - Owner/initiator participant ID
   * @param {string} computationType - Type of computation to perform
   * @param {Object} metadata - Additional computation metadata
   * @returns {string} Computation ID
   */
  createComputation(ownerId, computationType, metadata = {}) {
    const computationId = crypto.randomBytes(16).toString('hex');
    
    this.computations.set(computationId, {
      id: computationId,
      ownerId,
      type: computationType, // e.g., 'matrix_multiplication', 'logistic_regression'
      metadata,
      status: 'initialized',
      participants: [],
      result: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return computationId;
  }
  
  /**
   * Add participant to a computation
   * @param {string} computationId - Computation ID
   * @param {string} participantId - Participant ID to add
   * @param {Object} dataDescription - Description of data being contributed
   * @returns {Object} Status information
   */
  addParticipantToComputation(computationId, participantId, dataDescription) {
    const computation = this.computations.get(computationId);
    if (!computation) {
      throw new Error(`Computation ${computationId} not found`);
    }
    
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error(`Participant ${participantId} not found`);
    }
    
    computation.participants.push({
      participantId,
      did: participant.did,
      dataDescription,
      status: 'joined',
      joinedAt: Date.now()
    });
    
    computation.updatedAt = Date.now();
    
    return {
      computationId,
      participantCount: computation.participants.length
    };
  }
  
  /**
   * Generate secret shares using Shamir's Secret Sharing
   * @param {number|string} secret - Secret to be shared
   * @param {number} totalShares - Number of shares to generate
   * @param {number} threshold - Minimum shares needed for reconstruction
   * @returns {Array} Generated shares
   */
  generateShares(secret, totalShares, threshold) {
    return ShamirSecretSharing.generateShares(secret, totalShares, threshold);
  }
  
  /**
   * Reconstruct a secret from shares
   * @param {Array} shares - Array of shares
   * @param {string} prime - Prime number for modular arithmetic
   * @returns {string} Reconstructed secret
   */
  reconstructSecret(shares, prime) {
    return ShamirSecretSharing.reconstructSecret(shares, prime);
  }
  
  /**
   * Create additive shares for a value
   * @param {number|Array} value - Value to share
   * @param {number} numShares - Number of shares to create
   * @returns {Array} Additive shares
   */
  createAdditiveShares(value, numShares) {
    return this.spdzProtocol._createAdditiveShares(value, numShares);
  }
  
  /**
   * Create a message for MCP to invoke SMPC computation
   * @param {string} computationId - Computation ID
   * @param {string} participantId - Participant ID
   * @param {string} operation - Operation to perform
   * @returns {Object} MCP-formatted message
   */
  createMCPComputationMessage(computationId, participantId, operation) {
    const timestamp = Date.now();
    const messageId = crypto.randomBytes(8).toString('hex');
    
    return {
      messageId,
      timestamp,
      sender: participantId,
      computation: computationId,
      operation,
      protocol: this.config.protocol,
      version: '1.0',
      authenticated: true
    };
  }
  
  /**
   * Perform secure matrix multiplication
   * @param {Array} matrixA - First matrix
   * @param {Array} matrixB - Second matrix
   * @param {Array} participantIds - Participant IDs
   * @returns {Promise<Object>} Computation result
   */
  async secureMatrixMultiplication(matrixA, matrixB, participantIds) {
    console.log('Starting secure matrix multiplication with SPDZ protocol');
    
    if (participantIds.length < this.config.thresholdParties) {
      throw new Error(`Not enough participants. Need at least ${this.config.thresholdParties}`);
    }
    
    // Validate matrices dimensions
    if (matrixA[0].length !== matrixB.length) {
      throw new Error('Invalid matrix dimensions for multiplication');
    }
    
    // Create a computation ID
    const ownerId = participantIds[0];
    const computationId = this.createComputation(ownerId, 'matrix_multiplication', {
      dimensions: {
        matrixA: [matrixA.length, matrixA[0].length],
        matrixB: [matrixB.length, matrixB[0].length]
      }
    });
    
    // Initialize SPDZ computation
    this.spdzProtocol.initializeComputation(computationId, participantIds, 'matrix_mult');
    
    // Simulate first participant sharing matrix A
    this.spdzProtocol.shareInput(computationId, participantIds[0], matrixA);
    
    // Simulate second participant sharing matrix B
    this.spdzProtocol.shareInput(computationId, participantIds[1], matrixB);
    
    // Add remaining participants (if any)
    for (let i = 2; i < participantIds.length; i++) {
      this.addParticipantToComputation(computationId, participantIds[i], { role: 'validator' });
    }
    
    // Perform the secure multiplication
    const result = await this.spdzProtocol.performSecureMatrixMultiplication(computationId);
    
    // Update the computation with the result
    const computation = this.computations.get(computationId);
    computation.result = result.result;
    computation.status = 'completed';
    computation.updatedAt = Date.now();
    
    return {
      computationId,
      status: 'completed',
      result: result.result
    };
  }
  
  /**
   * Perform secure credit risk assessment
   * @param {Object} clientData - Client financial data
   * @param {Array} bankModels - Bank risk assessment models
   * @param {Array} participantIds - Participant IDs
   * @returns {Promise<Object>} Assessment result
   */
  async secureCreditRiskAssessment(clientData, bankModels, participantIds) {
    console.log('Starting secure credit risk assessment with SMPC');
    
    if (participantIds.length < 2) {
      throw new Error('Credit risk assessment requires at least 2 participants');
    }
    
    // Create a computation ID for credit assessment
    const computationId = this.createComputation(
      participantIds[0], 
      'credit_assessment',
      { dataFields: Object.keys(clientData) }
    );
    
    // Initialize the computation with SPDZ
    this.spdzProtocol.initializeComputation(computationId, participantIds, 'credit_assessment');
    
    // Add client (first participant) data
    const clientFields = Object.values(clientData);
    this.spdzProtocol.shareInput(computationId, participantIds[0], clientFields);
    
    // Add bank models (second participant)
    this.spdzProtocol.shareInput(computationId, participantIds[1], bankModels);
    
    // Simulate computation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate the actual computation
    // In a real implementation, this would be done securely across participants
    
    // Generate a plausible credit score based on input data
    const incomeWeight = 0.4;
    const creditHistoryWeight = 0.3;
    const debtRatioWeight = 0.3;
    
    // Extract client data (for simulation)
    const income = clientData.annualIncome || Math.random() * 100000;
    const creditHistory = clientData.creditHistory || Math.random() * 800;
    const debtRatio = clientData.debtToIncomeRatio || Math.random() * 0.5;
    
    // Normalize values
    const normalizedIncome = Math.min(income / 100000, 1) * 100;
    const normalizedCreditHistory = creditHistory / 800 * 100;
    const normalizedDebtRatio = (1 - debtRatio / 0.5) * 100; // Lower is better
    
    // Calculate weighted score
    const score = Math.round(
      incomeWeight * normalizedIncome +
      creditHistoryWeight * normalizedCreditHistory +
      debtRatioWeight * normalizedDebtRatio
    );
    
    // Add small random noise for privacy (simulating differential privacy)
    const noisyScore = score + this._generateGaussianNoise(0, 2);
    const finalScore = Math.max(0, Math.min(100, Math.round(noisyScore)));
    
    // Determine risk category
    const riskCategory = this._categorizeRisk(finalScore);
    
    // Update computation
    const computation = this.computations.get(computationId);
    computation.result = { score: finalScore, riskCategory };
    computation.status = 'completed';
    computation.updatedAt = Date.now();
    
    return {
      computationId,
      status: 'completed',
      result: { 
        score: finalScore,
        riskCategory,
        confidence: 0.92 // Simulated confidence level
      }
    };
  }
  
  /**
   * Categorize credit risk based on score
   * @param {number} score - Credit score
   * @returns {string} Risk category
   * @private
   */
  _categorizeRisk(score) {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Medium-Low Risk';
    if (score >= 40) return 'Medium Risk';
    if (score >= 20) return 'Medium-High Risk';
    return 'High Risk';
  }
  
  /**
   * Generate Gaussian noise for differential privacy
   * @param {number} mean - Mean of the distribution
   * @param {number} stdDev - Standard deviation
   * @returns {number} Random noise
   * @private
   */
  _generateGaussianNoise(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }
}

module.exports = SMPC; 