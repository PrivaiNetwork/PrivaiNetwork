// PrivAI Network - Federated Learning Module
// Implementation of privacy-preserving Federated Learning with MCP integration

const crypto = require('crypto');
const tf = require('@tensorflow/tfjs-node');
const { DataAuthorization } = require('./data_authorization');

class FederatedLearning {
  constructor(modelId, privacyConfig = {}) {
    this.modelId = modelId;
    this.participants = [];
    this.globalModel = null;
    this.currentRound = 0;
    this.aggregatedUpdates = null;
    
    // Privacy configuration
    this.privacyConfig = {
      useDifferentialPrivacy: privacyConfig.useDifferentialPrivacy || true,
      epsilon: privacyConfig.epsilon || 1.0, // Privacy budget
      clipNorm: privacyConfig.clipNorm || 1.0, // Gradient clipping threshold
      noiseMultiplier: privacyConfig.noiseMultiplier || 0.1, // Noise scale
      useSecureAggregation: privacyConfig.useSecureAggregation || true,
      ...privacyConfig
    };
  }

  // Register a participant with their DID
  registerParticipant(did, dataDescription) {
    const participantId = crypto.randomBytes(16).toString('hex');
    
    this.participants.push({
      id: participantId,
      did,
      dataDescription,
      status: 'registered',
      lastUpdate: null,
      contributionHistory: []
    });
    
    console.log(`Participant ${did} registered with ID ${participantId}`);
    return participantId;
  }

  // Initialize the global model
  async initializeGlobalModel(modelArchitecture, initialWeights) {
    try {
      this.globalModel = {
        architecture: modelArchitecture,
        weights: initialWeights,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metrics: {}
      };
      
      console.log(`Global model initialized: ${this.modelId}`);
      return this.globalModel;
    } catch (error) {
      console.error('Error initializing global model:', error);
      throw error;
    }
  }

  // Start a new training round
  startTrainingRound() {
    this.currentRound++;
    console.log(`Starting training round ${this.currentRound} for model ${this.modelId}`);
    
    // Reset aggregation for new round
    this.aggregatedUpdates = null;
    
    // Notify participants (in a real system, this would be an MCP call)
    const roundInfo = {
      roundId: `${this.modelId}-round-${this.currentRound}`,
      modelVersion: this.globalModel.version,
      startTime: Date.now(),
      deadline: Date.now() + 3600000, // 1 hour to complete training
      minParticipants: Math.ceil(this.participants.length * 0.5) // Require 50% participation
    };
    
    // Update participant status
    this.participants.forEach(participant => {
      participant.status = 'training';
    });
    
    return roundInfo;
  }

  // Apply differential privacy to model updates
  _applyDifferentialPrivacy(modelUpdate) {
    // In a real implementation, this would use proper DP libraries
    // This is a simplified version for demonstration
    
    if (!this.privacyConfig.useDifferentialPrivacy) {
      return modelUpdate;
    }
    
    // Deep clone the update to avoid modifying the original
    const clippedUpdate = JSON.parse(JSON.stringify(modelUpdate));
    
    // Apply gradient clipping (simplified)
    for (const layer of Object.keys(clippedUpdate)) {
      // L2 norm clipping
      const norm = Math.sqrt(clippedUpdate[layer].reduce((sum, val) => sum + val * val, 0));
      
      if (norm > this.privacyConfig.clipNorm) {
        const scale = this.privacyConfig.clipNorm / norm;
        clippedUpdate[layer] = clippedUpdate[layer].map(val => val * scale);
      }
      
      // Add Gaussian noise for differential privacy
      clippedUpdate[layer] = clippedUpdate[layer].map(val => {
        // Generate Gaussian noise
        const noise = this._generateGaussianNoise(0, this.privacyConfig.noiseMultiplier);
        return val + noise;
      });
    }
    
    return clippedUpdate;
  }

  // Helper to generate Gaussian noise
  _generateGaussianNoise(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  // Submit model update from a participant
  submitModelUpdate(participantId, modelUpdate, trainingMetrics) {
    // Find the participant
    const participant = this.participants.find(p => p.id === participantId);
    
    if (!participant) {
      throw new Error(`Participant with ID ${participantId} not found`);
    }
    
    // Apply differential privacy to the model update
    const privatizedUpdate = this._applyDifferentialPrivacy(modelUpdate);
    
    // Record the contribution
    participant.lastUpdate = {
      timestamp: Date.now(),
      roundId: this.currentRound,
      metrics: trainingMetrics
    };
    
    participant.status = 'contributed';
    participant.contributionHistory.push({
      roundId: this.currentRound,
      timestamp: Date.now(),
      metricsHash: crypto.createHash('sha256')
        .update(JSON.stringify(trainingMetrics))
        .digest('hex')
    });
    
    // In a real implementation, secure aggregation would happen here
    // For simplicity, we'll just accumulate updates
    if (!this.aggregatedUpdates) {
      this.aggregatedUpdates = privatizedUpdate;
    } else {
      // Simple averaging (in real FedAvg, this would be weighted by data size)
      for (const layer of Object.keys(privatizedUpdate)) {
        for (let i = 0; i < privatizedUpdate[layer].length; i++) {
          this.aggregatedUpdates[layer][i] += privatizedUpdate[layer][i];
        }
      }
    }
    
    console.log(`Participant ${participant.did} submitted update for round ${this.currentRound}`);
    
    // Check if we have enough contributions to finalize the round
    const contributedCount = this.participants.filter(p => 
      p.status === 'contributed' && 
      p.lastUpdate && 
      p.lastUpdate.roundId === this.currentRound
    ).length;
    
    return {
      accepted: true,
      contributionId: crypto.randomBytes(8).toString('hex'),
      totalContributions: contributedCount
    };
  }

  // Finalize a training round and update the global model
  finalizeTrainingRound() {
    const contributedParticipants = this.participants.filter(p => 
      p.status === 'contributed' && 
      p.lastUpdate && 
      p.lastUpdate.roundId === this.currentRound
    );
    
    if (contributedParticipants.length === 0) {
      throw new Error('No contributions received for this round');
    }
    
    // Average the aggregated updates
    for (const layer of Object.keys(this.aggregatedUpdates)) {
      for (let i = 0; i < this.aggregatedUpdates[layer].length; i++) {
        this.aggregatedUpdates[layer][i] /= contributedParticipants.length;
      }
    }
    
    // Update the global model (in a real system, this would update actual model weights)
    this.globalModel.version++;
    this.globalModel.updatedAt = Date.now();
    
    // Add round metrics
    this.globalModel.metrics[`round-${this.currentRound}`] = {
      participantCount: contributedParticipants.length,
      timestamp: Date.now(),
      epsilon: this.privacyConfig.useDifferentialPrivacy ? this.privacyConfig.epsilon : 'not used'
    };
    
    // Update participant status
    this.participants.forEach(participant => {
      participant.status = 'idle';
    });
    
    console.log(`Finalized training round ${this.currentRound} for model ${this.modelId}`);
    
    return {
      roundId: this.currentRound,
      modelVersion: this.globalModel.version,
      participantCount: contributedParticipants.length,
      timestamp: Date.now()
    };
  }

  // Get the current global model (in a real system, this would be access-controlled)
  getGlobalModel(requesterDid) {
    // In a real system, this would check authorization
    // Here we just return a copy of the model
    return {
      ...this.globalModel,
      fetchedBy: requesterDid,
      fetchedAt: Date.now()
    };
  }

  // MCP integration: create a standardized protocol message for model update
  createMCPModelUpdateMessage(participantId, modelUpdate, metrics) {
    // This simulates the MCP protocol standardized format
    return {
      protocol: "mcp",
      version: "1.0",
      requestType: "model_update",
      modelId: this.modelId,
      roundId: this.currentRound,
      participantId,
      timestamp: Date.now(),
      payload: {
        modelUpdate, // In practice, this would be encrypted or securely aggregated
        metrics
      },
      security: {
        encryptionType: this.privacyConfig.useSecureAggregation ? "secure_aggregation" : "none",
        differentialPrivacy: this.privacyConfig.useDifferentialPrivacy ? {
          epsilon: this.privacyConfig.epsilon,
          delta: 1e-5
        } : "none"
      }
    };
  }
}

// Example usage
async function example() {
  // Create a federated learning task for medical image classification
  const flTask = new FederatedLearning("medical-image-classifier", {
    useDifferentialPrivacy: true,
    epsilon: 0.5,
    clipNorm: 1.0,
    noiseMultiplier: 0.1,
    useSecureAggregation: true
  });
  
  // Register hospitals as participants (in a real system, these would be DIDs verified by the DataAuthorization module)
  const hospital1 = flTask.registerParticipant("did:privai:0xhospital1", {
    dataType: "medical-images",
    datasetSize: 1000,
    classes: ["normal", "pneumonia", "covid"]
  });
  
  const hospital2 = flTask.registerParticipant("did:privai:0xhospital2", {
    dataType: "medical-images",
    datasetSize: 800,
    classes: ["normal", "pneumonia", "covid"]
  });
  
  // Initialize a global model (in a real system, this would be an actual TensorFlow model)
  await flTask.initializeGlobalModel("CNN", {
    "conv1": Array(100).fill(0).map(() => Math.random() * 0.1),
    "conv2": Array(200).fill(0).map(() => Math.random() * 0.1),
    "dense": Array(50).fill(0).map(() => Math.random() * 0.1)
  });
  
  // Start training round
  const roundInfo = flTask.startTrainingRound();
  console.log("Training round started:", roundInfo);
  
  // Simulate hospital1 training and submitting update
  const hospital1Update = {
    "conv1": Array(100).fill(0).map(() => Math.random() * 0.01),
    "conv2": Array(200).fill(0).map(() => Math.random() * 0.01),
    "dense": Array(50).fill(0).map(() => Math.random() * 0.01)
  };
  
  const hospital1Metrics = {
    accuracy: 0.85,
    loss: 0.23,
    f1Score: 0.84,
    trainingTime: 120,
    samplesUsed: 950
  };
  
  const hospital1Result = flTask.submitModelUpdate(hospital1, hospital1Update, hospital1Metrics);
  console.log("Hospital 1 contribution:", hospital1Result);
  
  // Simulate hospital2 training and submitting update
  const hospital2Update = {
    "conv1": Array(100).fill(0).map(() => Math.random() * 0.015),
    "conv2": Array(200).fill(0).map(() => Math.random() * 0.015),
    "dense": Array(50).fill(0).map(() => Math.random() * 0.015)
  };
  
  const hospital2Metrics = {
    accuracy: 0.83,
    loss: 0.25,
    f1Score: 0.82,
    trainingTime: 105,
    samplesUsed: 780
  };
  
  const hospital2Result = flTask.submitModelUpdate(hospital2, hospital2Update, hospital2Metrics);
  console.log("Hospital 2 contribution:", hospital2Result);
  
  // Finalize the training round
  const finalResult = flTask.finalizeTrainingRound();
  console.log("Training round finalized:", finalResult);
  
  // Get the updated global model
  const updatedModel = flTask.getGlobalModel("did:privai:0xresearcher");
  console.log("Updated global model version:", updatedModel.version);
  
  // Create an MCP message for model update (demonstrating MCP integration)
  const mcpMessage = flTask.createMCPModelUpdateMessage(
    hospital1, 
    { /* simplified model update */ }, 
    { accuracy: 0.87 }
  );
  console.log("MCP protocol message:", mcpMessage);
}

module.exports = {
  FederatedLearning
}; 