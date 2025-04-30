/**
 * PrivAI Network - Trusted Execution Environment (TEE) Module
 * 
 * This module provides an interface for working with Trusted Execution Environments,
 * enabling secure computation on sensitive data within protected memory regions.
 * It integrates Intel SGX simulations and specialized applications like medical
 * image analysis.
 */

const SGXEnclave = require('./sgx');
const MedicalImageAnalysis = require('./medical_analysis');
const crypto = require('crypto');

class TEE {
  constructor(config = {}) {
    this.config = {
      defaultEnclaveType: config.defaultEnclaveType || 'SGX',
      maxEnclaves: config.maxEnclaves || 10,
      attestationRequired: config.attestationRequired !== false, // Default to true
      ...config
    };
    
    this.enclaves = new Map();
    this.applications = new Map();
    this.tasks = new Map();
    this.attestations = new Map();
  }
  
  /**
   * Create a new TEE enclave
   * @param {string} type - Type of enclave to create (SGX, TrustZone, etc.)
   * @param {Object} enclaveConfig - Configuration for the enclave
   * @returns {Object} Enclave information
   */
  createEnclave(type = this.config.defaultEnclaveType, enclaveConfig = {}) {
    if (this.enclaves.size >= this.config.maxEnclaves) {
      throw new Error(`Maximum number of enclaves (${this.config.maxEnclaves}) reached`);
    }
    
    // Currently only SGX is supported in this implementation
    if (type !== 'SGX') {
      throw new Error(`Enclave type '${type}' not supported. Only SGX is currently available.`);
    }
    
    // Create a unique ID for the enclave
    const enclaveId = crypto.randomBytes(16).toString('hex');
    
    // Create the actual enclave
    const enclave = new SGXEnclave(enclaveId, enclaveConfig);
    
    // Initialize the enclave
    const initResult = enclave.initialize();
    
    // Store the enclave
    this.enclaves.set(enclaveId, {
      enclave,
      type,
      status: 'initialized',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      config: enclaveConfig
    });
    
    console.log(`Created ${type} enclave with ID ${enclaveId}`);
    
    return {
      enclaveId,
      type,
      status: 'initialized',
      measurement: initResult.measurement,
      publicKey: initResult.publicKey
    };
  }
  
  /**
   * Generate remote attestation for an enclave
   * @param {string} enclaveId - ID of the enclave
   * @param {string} challengeData - Challenge data from the verifier
   * @returns {Object} Attestation information
   */
  generateAttestation(enclaveId, challengeData) {
    const enclaveInfo = this.enclaves.get(enclaveId);
    if (!enclaveInfo) {
      throw new Error(`Enclave ${enclaveId} not found`);
    }
    
    // Generate attestation quote using the enclave
    const attestationResult = enclaveInfo.enclave.generateAttestationQuote(challengeData);
    
    // Store the attestation
    this.attestations.set(attestationResult.quoteId, {
      enclaveId,
      timestamp: Date.now(),
      quote: attestationResult.quote,
      challengeData
    });
    
    // Update last used timestamp
    enclaveInfo.lastUsed = Date.now();
    
    return attestationResult;
  }
  
  /**
   * Verify an attestation quote
   * @param {Object} quote - Attestation quote to verify
   * @param {string} expectedMeasurement - Expected enclave measurement (optional)
   * @returns {Object} Verification result
   */
  verifyAttestation(quote, expectedMeasurement = null) {
    return SGXEnclave.verifyAttestationQuote(quote, expectedMeasurement);
  }
  
  /**
   * Execute a function within an enclave
   * @param {string} enclaveId - ID of the enclave
   * @param {Object} inputData - Input data for the function
   * @param {Function} processingFunction - Function to execute within the enclave
   * @returns {Object} Execution result
   */
  executeInEnclave(enclaveId, inputData, processingFunction) {
    const enclaveInfo = this.enclaves.get(enclaveId);
    if (!enclaveInfo) {
      throw new Error(`Enclave ${enclaveId} not found`);
    }
    
    // Update last used timestamp
    enclaveInfo.lastUsed = Date.now();
    
    // Execute the function in the enclave
    const result = enclaveInfo.enclave.secureComputation(inputData, processingFunction);
    
    // Generate a task ID for this execution
    if (result.status === 'completed') {
      const taskId = crypto.randomBytes(8).toString('hex');
      this.tasks.set(taskId, {
        enclaveId,
        resultDataId: result.resultDataId,
        timestamp: Date.now(),
        status: 'completed'
      });
      
      return {
        taskId,
        status: result.status,
        enclaveId
      };
    }
    
    return result;
  }
  
  /**
   * Retrieve result from a completed task
   * @param {string} taskId - ID of the task
   * @returns {Object} Task result
   */
  getTaskResult(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    const enclaveInfo = this.enclaves.get(task.enclaveId);
    if (!enclaveInfo) {
      throw new Error(`Enclave for task ${taskId} not found`);
    }
    
    // Retrieve the result from the enclave
    const result = enclaveInfo.enclave.unsealData(task.resultDataId);
    
    // Update last used timestamp
    enclaveInfo.lastUsed = Date.now();
    
    return {
      taskId,
      result,
      retrievedAt: Date.now()
    };
  }
  
  /**
   * Initialize a medical image analysis application
   * @param {Object} config - Configuration for the application
   * @returns {Object} Application information
   */
  async initializeMedicalAnalysis(config = {}) {
    const appId = crypto.randomBytes(8).toString('hex');
    
    // Create the medical image analysis application
    const medicalApp = new MedicalImageAnalysis(config);
    
    // Initialize the application
    const initResult = await medicalApp.initialize();
    
    // Store the application
    this.applications.set(appId, {
      type: 'medical_analysis',
      app: medicalApp,
      enclaveId: initResult.enclaveId,
      status: 'initialized',
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
    
    console.log(`Initialized medical image analysis application with ID ${appId}`);
    
    return {
      appId,
      type: 'medical_analysis',
      status: 'initialized',
      enclaveId: initResult.enclaveId,
      supportedImageTypes: initResult.supportedImageTypes
    };
  }
  
  /**
   * Create a session for medical image analysis
   * @param {string} appId - Application ID
   * @param {string} patientId - Patient identifier
   * @param {string} physicianDid - Physician's decentralized identifier
   * @param {Object} metadata - Session metadata
   * @returns {Object} Session information
   */
  createMedicalSession(appId, patientId, physicianDid, metadata = {}) {
    const appInfo = this.applications.get(appId);
    if (!appInfo || appInfo.type !== 'medical_analysis') {
      throw new Error(`Medical analysis application ${appId} not found`);
    }
    
    // Update last used timestamp
    appInfo.lastUsed = Date.now();
    
    // Create a session in the medical analysis application
    return appInfo.app.createSession(patientId, physicianDid, metadata);
  }
  
  /**
   * Add an encrypted medical image to a session
   * @param {string} appId - Application ID
   * @param {string} sessionId - Session ID
   * @param {Buffer} encryptedImage - Encrypted image data
   * @param {Object} metadata - Image metadata
   * @returns {Object} Operation status
   */
  addMedicalImage(appId, sessionId, encryptedImage, metadata) {
    const appInfo = this.applications.get(appId);
    if (!appInfo || appInfo.type !== 'medical_analysis') {
      throw new Error(`Medical analysis application ${appId} not found`);
    }
    
    // Update last used timestamp
    appInfo.lastUsed = Date.now();
    
    // Add the image to the session
    return appInfo.app.addEncryptedImage(sessionId, encryptedImage, metadata);
  }
  
  /**
   * Analyze medical images in a session
   * @param {string} appId - Application ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeMedicalImages(appId, sessionId) {
    const appInfo = this.applications.get(appId);
    if (!appInfo || appInfo.type !== 'medical_analysis') {
      throw new Error(`Medical analysis application ${appId} not found`);
    }
    
    // Update last used timestamp
    appInfo.lastUsed = Date.now();
    
    // Analyze the images
    return appInfo.app.analyzeImages(sessionId);
  }
  
  /**
   * Get medical analysis results
   * @param {string} appId - Application ID
   * @param {string} sessionId - Session ID
   * @param {string} physicianDid - Physician's decentralized identifier
   * @returns {Object} Analysis results
   */
  getMedicalResults(appId, sessionId, physicianDid) {
    const appInfo = this.applications.get(appId);
    if (!appInfo || appInfo.type !== 'medical_analysis') {
      throw new Error(`Medical analysis application ${appId} not found`);
    }
    
    // Update last used timestamp
    appInfo.lastUsed = Date.now();
    
    // Get the analysis results
    return appInfo.app.getAnalysisResults(sessionId, physicianDid);
  }
  
  /**
   * Destroy an enclave and free its resources
   * @param {string} enclaveId - ID of the enclave to destroy
   * @returns {Object} Operation status
   */
  destroyEnclave(enclaveId) {
    const enclaveInfo = this.enclaves.get(enclaveId);
    if (!enclaveInfo) {
      throw new Error(`Enclave ${enclaveId} not found`);
    }
    
    // Destroy the enclave
    const result = enclaveInfo.enclave.destroy();
    
    // Remove the enclave from our map
    this.enclaves.delete(enclaveId);
    
    console.log(`Destroyed enclave ${enclaveId}`);
    
    return result;
  }
  
  /**
   * Shut down a TEE application
   * @param {string} appId - Application ID
   * @returns {Object} Operation status
   */
  shutdownApplication(appId) {
    const appInfo = this.applications.get(appId);
    if (!appInfo) {
      throw new Error(`Application ${appId} not found`);
    }
    
    let result;
    
    // Shutdown the application
    if (appInfo.type === 'medical_analysis') {
      result = appInfo.app.shutdown();
    } else {
      result = { status: 'unknown_app_type' };
    }
    
    // Remove the application from our map
    this.applications.delete(appId);
    
    console.log(`Shut down ${appInfo.type} application ${appId}`);
    
    return result;
  }
  
  /**
   * Clean up idle enclaves
   * @param {number} maxIdleTime - Maximum idle time in milliseconds
   * @returns {number} Number of enclaves cleaned up
   */
  cleanupIdleEnclaves(maxIdleTime = 30 * 60 * 1000) { // Default: 30 minutes
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [enclaveId, info] of this.enclaves.entries()) {
      if (now - info.lastUsed > maxIdleTime) {
        try {
          this.destroyEnclave(enclaveId);
          cleanedCount++;
        } catch (error) {
          console.error(`Error destroying idle enclave ${enclaveId}: ${error.message}`);
        }
      }
    }
    
    return cleanedCount;
  }
}

module.exports = TEE; 