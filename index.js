// PrivAI Network - Main Server
// Implementation of a server that demonstrates the integration
// of MCP, Privacy Computing, and Web3 technologies

const express = require('express');
const crypto = require('crypto');
const { DataAuthorization } = require('./data_authorization');
const { FederatedLearning } = require('./federated_learning');
const { SMPC } = require('./smpc');
const { TrustedExecution } = require('./trusted_execution');
const { DAOGovernance } = require('./dao_governance');
const { Blockchain } = require('./blockchain');

// Create Express application
const app = express();
app.use(express.json());

// Simulated database for demonstration
const db = {
  models: {},
  tasks: {},
  users: {},
  authorizations: [],
  computations: {}
};

// Initialize privacy computing components
let smpc, tee, dao, blockchain;

// Create a sample federated learning task
const initializeSampleTask = async () => {
  const flTask = new FederatedLearning("healthcare-demo", {
    useDifferentialPrivacy: true,
    epsilon: 0.8,
    clipNorm: 1.0,
    noiseMultiplier: 0.05,
    useSecureAggregation: true
  });
  
  // Initialize a sample model
  await flTask.initializeGlobalModel("healthcare-cnn", {
    "conv1": Array(100).fill(0).map(() => Math.random() * 0.1),
    "conv2": Array(200).fill(0).map(() => Math.random() * 0.1),
    "dense": Array(50).fill(0).map(() => Math.random() * 0.1)
  });
  
  db.tasks["healthcare-demo"] = flTask;
  return flTask;
};

// Initialize SMPC environment
const initializeSMPC = () => {
  smpc = new SMPC({
    protocol: 'SPDZ',
    parties: 3,
    thresholdParties: 2,
    useFHE: false
  });
  
  console.log('SMPC environment initialized');
  return smpc;
};

// Initialize TEE environment
const initializeTEE = () => {
  tee = new TrustedExecution({
    teeType: 'SGX',
    attestationProvider: 'IAS',
    enclaveMemory: 128
  });
  
  console.log('TEE environment initialized');
  return tee;
};

// Initialize DAO governance
const initializeDAO = () => {
  dao = new DAOGovernance({
    proposalThreshold: 1000000, // 1 million PRAI
    votingPeriod: 14 * 24 * 60 * 60 * 1000, // 14 days
    quorum: 0.1, // 10% participation required
    useQuadraticVoting: true
  });
  
  console.log('DAO governance initialized');
  return dao;
};

// Initialize blockchain
const initializeBlockchain = () => {
  blockchain = new Blockchain({
    chainType: 'polygon',
    blockTime: 5000, // 5 seconds for simulation
    networkFee: 0.01, // 0.01 MATIC
    burnRatio: 0.05 // 5% of fees burned
  });
  
  console.log('Blockchain initialized');
  return blockchain;
};

// Initialize sample data
const initializeSampleData = async () => {
  // Create sample users with DIDs
  for (let i = 1; i <= 3; i++) {
    const privateKey = "0x" + crypto.randomBytes(32).toString('hex');
    const auth = new DataAuthorization(privateKey);
    db.users[`hospital${i}`] = {
      did: auth.did,
      auth,
      name: `Hospital ${i}`,
      dataDescription: {
        dataType: "medical-images",
        datasetSize: 800 + Math.floor(Math.random() * 400),
        classes: ["normal", "pneumonia", "covid"]
      }
    };
  }
  
  // Create sample bank users for SMPC
  for (let i = 1; i <= 3; i++) {
    const privateKey = "0x" + crypto.randomBytes(32).toString('hex');
    const auth = new DataAuthorization(privateKey);
    db.users[`bank${i}`] = {
      did: auth.did,
      auth,
      name: `Bank ${i}`,
      dataDescription: {
        dataType: "financial-data",
        clientCount: 500 + Math.floor(Math.random() * 500),
        dataCategories: ["credit_history", "income", "debt_ratio"]
      }
    };
    
    // Register with SMPC
    const bankId = smpc.registerParticipant(auth.did, "bank-public-key");
    db.users[`bank${i}`].smpcId = bankId;
  }
  
  // Register hospitals with TEE
  const hospital1 = db.users.hospital1;
  const nodeId = tee.registerNode(hospital1.did, {
    capabilities: {
      memorySize: 128,
      supportedOperations: [
        'medical_image_analysis',
        'genomic_analysis',
        'secure_aggregation'
      ]
    }
  });
  hospital1.teeNodeId = nodeId;
  
  // Create TEE enclave
  const enclaveId = tee.createEnclave(nodeId, 'medical_image_analysis', {
    version: '1.0',
    model: 'covid-detector-cnn'
  });
  hospital1.enclaveId = enclaveId;
  
  // Register with DAO governance
  const member1 = dao.registerMember(hospital1.did, 5000000); // 5 million PRAI
  const member2 = dao.registerMember(db.users.hospital2.did, 3000000); // 3 million PRAI
  const member3 = dao.registerMember(db.users.hospital3.did, 2000000); // 2 million PRAI
  
  // Store DAO member IDs
  db.users.hospital1.daoMemberId = member1;
  db.users.hospital2.daoMemberId = member2;
  db.users.hospital3.daoMemberId = member3;
  
  // Create blockchain accounts for hospitals
  const account1 = blockchain.createAccount(100); // 100 MATIC
  const account2 = blockchain.createAccount(50);  // 50 MATIC
  const account3 = blockchain.createAccount(75);  // 75 MATIC
  
  db.users.hospital1.blockchainAddress = account1.address;
  db.users.hospital1.blockchainPrivateKey = account1.privateKey;
  db.users.hospital2.blockchainAddress = account2.address;
  db.users.hospital3.blockchainAddress = account3.address;
  
  // Initialize a sample FL task
  await initializeSampleTask();
  
  // Create a sample DAO proposal
  const proposalId = dao.createProposal(
    member1,
    "Implement Secure Multi-Party Computation Protocol Update",
    "We propose upgrading the SMPC protocol to support the latest SPDZ optimization for faster matrix operations with lower communication overhead.",
    [
      {
        type: "protocol_upgrade",
        component: "smpc_protocol",
        version: "2.0",
        details: "SPDZ optimization for matrix operations"
      },
      {
        type: "allocate_funding",
        amount: 500000, // 500,000 PRAI
        recipient: "did:privai:0xresearch_team",
        purpose: "Implementation and testing of the SPDZ optimization"
      }
    ],
    "protocol_upgrade"
  );
  
  db.proposalId = proposalId;
  
  // Deploy a privacy-preserving smart contract
  const flContract = blockchain.deployPrivacyContract(
    account1.address,
    'federated_learning',
    {
      modelId: 'medical-image-classifier',
      taskType: 'image_classification',
      privacyLevel: 'differential_privacy'
    }
  );
  
  db.smartContractAddress = flContract.contractAddress;
  
  console.log("Sample data initialized");
};

// Routes

// 1. Register participant to a federated learning task
app.post('/api/tasks/:taskId/register', (req, res) => {
  const { taskId } = req.params;
  const { userId } = req.body;
  
  if (!db.tasks[taskId]) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  const task = db.tasks[taskId];
  
  const participantId = task.registerParticipant(user.did, user.dataDescription);
  
  res.json({
    success: true,
    participantId,
    taskId,
    message: `${user.name} registered to ${taskId}`
  });
});

// 2. Start a new training round
app.post('/api/tasks/:taskId/rounds/start', (req, res) => {
  const { taskId } = req.params;
  
  if (!db.tasks[taskId]) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  const task = db.tasks[taskId];
  const roundInfo = task.startTrainingRound();
  
  res.json({
    success: true,
    roundInfo
  });
});

// 3. Submit model update (simulated, with simplified model update)
app.post('/api/tasks/:taskId/rounds/submit', (req, res) => {
  const { taskId } = req.params;
  const { participantId, metrics } = req.body;
  
  if (!db.tasks[taskId]) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  const task = db.tasks[taskId];
  
  // Simplified model update (in a real system, this would be actual gradients)
  const modelUpdate = {
    "conv1": Array(100).fill(0).map(() => Math.random() * 0.01),
    "conv2": Array(200).fill(0).map(() => Math.random() * 0.01),
    "dense": Array(50).fill(0).map(() => Math.random() * 0.01)
  };
  
  try {
    const result = task.submitModelUpdate(participantId, modelUpdate, metrics);
    
    res.json({
      success: true,
      contributionId: result.contributionId,
      totalContributions: result.totalContributions
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 4. Finalize training round
app.post('/api/tasks/:taskId/rounds/finalize', (req, res) => {
  const { taskId } = req.params;
  
  if (!db.tasks[taskId]) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  const task = db.tasks[taskId];
  
  try {
    const result = task.finalizeTrainingRound();
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 5. Get global model
app.get('/api/tasks/:taskId/model', (req, res) => {
  const { taskId } = req.params;
  const { requesterDid } = req.query;
  
  if (!db.tasks[taskId]) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  const task = db.tasks[taskId];
  const model = task.getGlobalModel(requesterDid);
  
  // In a real application, we would check access permissions here
  
  res.json({
    success: true,
    model: {
      id: model.architecture,
      version: model.version,
      updatedAt: model.updatedAt,
      metrics: model.metrics
      // We wouldn't send actual weights in a REST API response
    }
  });
});

// 6. Create a data authorization
app.post('/api/authorization', async (req, res) => {
  const { userId, dataId, recipientId, permissions, expirationTime } = req.body;
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  if (!db.users[recipientId]) {
    return res.status(404).json({ error: "Recipient not found" });
  }
  
  const user = db.users[userId];
  const recipient = db.users[recipientId];
  
  try {
    const authorization = await user.auth.createAuthorizationRequest(
      dataId,
      recipient.did,
      permissions,
      expirationTime || Date.now() + 86400000
    );
    
    // Simulated blockchain recording
    const blockchainRecord = await user.auth.recordOnBlockchain(authorization);
    
    // Save to our simulated database
    db.authorizations.push({
      id: crypto.randomBytes(8).toString('hex'),
      authorization,
      blockchainRecord
    });
    
    // Record on the blockchain if we have blockchain address
    if (user.blockchainAddress) {
      const authTxn = blockchain.recordDataAuthorization(user.blockchainAddress, authorization);
      blockchainRecord.transactionHash = authTxn.txnHash;
    }
    
    res.json({
      success: true,
      authorizationId: db.authorizations[db.authorizations.length - 1].id,
      blockchainRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 7. Verify a data authorization
app.get('/api/authorization/:authId/verify', async (req, res) => {
  const { authId } = req.params;
  
  const authRecord = db.authorizations.find(a => a.id === authId);
  
  if (!authRecord) {
    return res.status(404).json({ error: "Authorization not found" });
  }
  
  try {
    const verification = await DataAuthorization.verifyAuthorization(authRecord.authorization);
    
    res.json({
      success: true,
      isValid: verification.isValid,
      signerAddress: verification.signerAddress,
      isExpired: verification.isExpired
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 8. Create SMPC computation
app.post('/api/smpc/computations', async (req, res) => {
  const { userId, computationType, data } = req.body;
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  
  if (!user.smpcId) {
    return res.status(400).json({ error: "User not registered with SMPC" });
  }
  
  try {
    // Create SMPC computation
    const computationId = smpc.createComputation(
      user.smpcId,
      computationType,
      { description: `${computationType} initiated by ${user.name}` }
    );
    
    // Add initiator as participant
    smpc.addParticipantToComputation(
      computationId,
      user.smpcId,
      user.dataDescription
    );
    
    // Store in database
    db.computations[computationId] = {
      id: computationId,
      type: computationType,
      initiator: userId,
      status: 'initialized',
      participants: [user.smpcId],
      createdAt: Date.now()
    };
    
    res.json({
      success: true,
      computationId,
      status: 'initialized'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 9. Join SMPC computation
app.post('/api/smpc/computations/:computationId/join', async (req, res) => {
  const { computationId } = req.params;
  const { userId } = req.body;
  
  if (!db.computations[computationId]) {
    return res.status(404).json({ error: "Computation not found" });
  }
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  const computation = db.computations[computationId];
  
  if (!user.smpcId) {
    return res.status(400).json({ error: "User not registered with SMPC" });
  }
  
  try {
    // Add participant to SMPC computation
    const result = smpc.addParticipantToComputation(
      computationId,
      user.smpcId,
      user.dataDescription
    );
    
    // Update in database
    computation.participants.push(user.smpcId);
    
    res.json({
      success: true,
      computationId,
      participants: result.participantCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 10. Execute SMPC credit risk assessment
app.post('/api/smpc/computations/:computationId/credit-assessment', async (req, res) => {
  const { computationId } = req.params;
  const { clients } = req.body;
  
  if (!db.computations[computationId]) {
    return res.status(404).json({ error: "Computation not found" });
  }
  
  const computation = db.computations[computationId];
  
  if (computation.type !== 'credit_risk_assessment') {
    return res.status(400).json({ 
      error: "Computation type mismatch. Expected 'credit_risk_assessment'"
    });
  }
  
  try {
    // Simulate bank models (in reality, these would be private to each bank)
    const bankModels = computation.participants.map((participantId, index) => {
      return {
        bankId: `bank${index + 1}`,
        baseScore: 600 + (index * 25),
        weights: {
          income: 0.0010 + (index * 0.0002),
          creditHistory: 10 + (index * 2),
          debtRatio: -100 - (index * 10),
          age: 0.3 + (index * 0.1)
        }
      };
    });
    
    // Execute SMPC computation
    const result = await smpc.secureCreditRiskAssessment(
      clients,
      bankModels,
      computation.participants
    );
    
    // Update computation status
    computation.status = 'completed';
    computation.result = result;
    computation.completedAt = Date.now();
    
    res.json({
      success: true,
      result: {
        computationId: result.computationId,
        clientsProcessed: result.results.length,
        creditScores: result.results.map(r => ({
          clientId: r.clientId,
          score: r.creditScore,
          risk: r.riskCategory
        }))
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 11. Execute TEE computation
app.post('/api/tee/computations', async (req, res) => {
  const { userId, enclaveId, computation, inputs } = req.body;
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  
  try {
    // Verify enclave attestation first
    const attestation = await tee.performRemoteAttestation(enclaveId);
    const verification = tee.verifyAttestation(attestation);
    
    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Enclave attestation invalid',
        verification
      });
    }
    
    // Execute computation in TEE
    const result = await tee.executeComputation(
      enclaveId,
      computation,
      inputs
    );
    
    res.json({
      success: true,
      computationId: result.computationId,
      executionTime: result.executionTime,
      result: result.result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 12. Get TEE attestation
app.get('/api/tee/enclaves/:enclaveId/attestation', async (req, res) => {
  const { enclaveId } = req.params;
  
  try {
    const attestation = await tee.performRemoteAttestation(enclaveId);
    const verification = tee.verifyAttestation(attestation);
    
    res.json({
      success: true,
      attestation,
      verification
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 13. Cast vote on DAO proposal
app.post('/api/dao/proposals/:proposalId/vote', async (req, res) => {
  const { proposalId } = req.params;
  const { userId, voteType } = req.body;
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  
  if (!user.daoMemberId) {
    return res.status(400).json({ error: "User not a DAO member" });
  }
  
  try {
    const vote = dao.castVote(user.daoMemberId, proposalId, voteType);
    
    res.json({
      success: true,
      proposalId,
      vote: {
        memberId: vote.memberId,
        voteType: vote.voteType,
        votingPower: vote.votingPower,
        timestamp: vote.timestamp
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 14. Get DAO proposal details
app.get('/api/dao/proposals/:proposalId', (req, res) => {
  const { proposalId } = req.params;
  
  try {
    const proposalDetails = dao.getProposal(proposalId);
    
    res.json({
      success: true,
      proposal: proposalDetails
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 15. Process DAO proposals (admin function)
app.post('/api/dao/process-proposals', (req, res) => {
  try {
    const result = dao.processProposals();
    
    res.json({
      success: true,
      processed: result.processedProposals
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 16. Get blockchain transaction details
app.get('/api/blockchain/transactions/:txHash', (req, res) => {
  const { txHash } = req.params;
  
  try {
    const transaction = blockchain.getTransaction(txHash);
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 17. Create blockchain transaction
app.post('/api/blockchain/transactions', (req, res) => {
  const { userId, type, data } = req.body;
  
  if (!db.users[userId]) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const user = db.users[userId];
  
  if (!user.blockchainAddress) {
    return res.status(400).json({ error: "User has no blockchain account" });
  }
  
  try {
    const txHash = blockchain.createTransaction(
      user.blockchainAddress,
      type,
      data
    );
    
    res.json({
      success: true,
      transactionHash: txHash
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 18. Get system status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    status: {
      federated_learning: {
        tasks: Object.keys(db.tasks).length,
        models: Object.values(db.tasks).reduce((sum, task) => sum + (task.globalModel ? 1 : 0), 0)
      },
      smpc: {
        participants: smpc.participants.length,
        computations: smpc.computations.size
      },
      tee: {
        nodes: tee.nodes.length,
        enclaves: tee.enclaves.size,
        computations: tee.computations.size
      },
      dao: {
        members: dao.members.size,
        proposals: dao.proposals.size,
        activeProposals: Array.from(dao.proposals.values()).filter(p => p.status === 'active').length
      },
      blockchain: {
        blockHeight: blockchain.latestBlockHeight,
        pendingTransactions: blockchain.pendingTransactions.length,
        contracts: blockchain.smartContracts.size
      },
      users: Object.keys(db.users).length,
      authorizations: db.authorizations.length
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`PrivAI Network server running on port ${PORT}`);
  
  // Initialize privacy computing components
  initializeSMPC();
  initializeTEE();
  initializeDAO();
  initializeBlockchain();
  
  // Initialize sample data
  await initializeSampleData();
  
  console.log(`
  PrivAI Network Demo Server
  =========================
  
  Server is running on port ${PORT} with the following components:
  
  - Federated Learning with Differential Privacy
  - Secure Multi-Party Computation (SMPC)
  - Trusted Execution Environment (TEE)
  - DAO Governance
  - Blockchain Integration
  
  Available endpoints:
  
  Federated Learning:
  1. POST /api/tasks/:taskId/register - Register a participant to a task
  2. POST /api/tasks/:taskId/rounds/start - Start a new training round
  3. POST /api/tasks/:taskId/rounds/submit - Submit model update
  4. POST /api/tasks/:taskId/rounds/finalize - Finalize a training round
  5. GET  /api/tasks/:taskId/model - Get the global model
  
  Data Authorization:
  6. POST /api/authorization - Create a data authorization
  7. GET  /api/authorization/:authId/verify - Verify an authorization
  
  SMPC:
  8. POST /api/smpc/computations - Create SMPC computation
  9. POST /api/smpc/computations/:computationId/join - Join computation
  10. POST /api/smpc/computations/:computationId/credit-assessment - Run credit assessment
  
  TEE:
  11. POST /api/tee/computations - Execute TEE computation
  12. GET  /api/tee/enclaves/:enclaveId/attestation - Get TEE attestation
  
  DAO Governance:
  13. POST /api/dao/proposals/:proposalId/vote - Cast vote on proposal
  14. GET  /api/dao/proposals/:proposalId - Get proposal details
  15. POST /api/dao/process-proposals - Process proposals
  
  Blockchain:
  16. GET  /api/blockchain/transactions/:txHash - Get transaction details
  17. POST /api/blockchain/transactions - Create transaction
  
  System:
  18. GET  /api/status - Get system status
  
  Sample users: hospital1, hospital2, hospital3, bank1, bank2, bank3
  Sample task: healthcare-demo
  Sample proposal ID: ${db.proposalId}
  Sample smart contract: ${db.smartContractAddress}
  `);
}); 