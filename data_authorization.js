// PrivAI Network - Data Authorization Module
// Implementation of DID-based data authorization for privacy-preserving data sharing

const crypto = require('crypto');
const ethers = require('ethers');

class DataAuthorization {
  constructor(privateKey) {
    this.wallet = new ethers.Wallet(privateKey);
    this.did = `did:privai:${this.wallet.address.toLowerCase()}`;
  }

  // Create a data authorization request
  async createAuthorizationRequest(dataId, recipient, permissions, expirationTime) {
    const authorizationPayload = {
      did: this.did,
      dataId,
      recipient,
      permissions, // e.g., ["read", "compute", "federated_learning"]
      expirationTime,
      timestamp: Date.now()
    };
    
    // Create authorization message
    const message = JSON.stringify(authorizationPayload);
    
    // Sign the message
    const signature = await this.wallet.signMessage(message);
    
    return {
      payload: authorizationPayload,
      signature
    };
  }

  // Verify a data authorization request
  static async verifyAuthorization(authorization) {
    const { payload, signature } = authorization;
    
    // Reconstruct the message
    const message = JSON.stringify(payload);
    
    // Recover the signer's address
    const signerAddress = ethers.utils.verifyMessage(message, signature);
    
    // Extract the DID from the payload
    const { did, expirationTime } = payload;
    const expectedAddress = did.split(':')[2];
    
    // Verify the signer matches the DID
    const isValidSigner = signerAddress.toLowerCase() === expectedAddress;
    
    // Check if authorization has expired
    const isExpired = Date.now() > expirationTime;
    
    return {
      isValid: isValidSigner && !isExpired,
      signerAddress,
      isExpired
    };
  }

  // Create a privacy proof using zero-knowledge proof simulation
  // Note: This is a simplified simulation of ZKP for educational purposes
  createPrivacyProof(dataAttribute, threshold) {
    // In a real implementation, this would use an actual ZKP library
    // This is just a simulation to demonstrate the concept
    
    // Create a hash of the data attribute
    const attributeHash = crypto.createHash('sha256')
      .update(JSON.stringify(dataAttribute))
      .digest('hex');
    
    // Create a simple proof (in real ZKP, this would not reveal the actual value)
    const simulatedProof = {
      attributeType: dataAttribute.type,
      thresholdMet: dataAttribute.value > threshold,
      proofHash: crypto.createHash('sha256')
        .update(`${attributeHash}${threshold}`)
        .digest('hex')
    };
    
    return simulatedProof;
  }
  
  // Record authorization on blockchain (simplified simulation)
  async recordOnBlockchain(authorization) {
    // In a real implementation, this would interact with a blockchain
    // This is just a simulation to demonstrate the concept
    
    const blockchainRecord = {
      did: authorization.payload.did,
      dataId: authorization.payload.dataId,
      recipientDid: authorization.payload.recipient,
      permissionsHash: crypto.createHash('sha256')
        .update(JSON.stringify(authorization.payload.permissions))
        .digest('hex'),
      timestamp: Date.now(),
      transactionHash: crypto.randomBytes(32).toString('hex')
    };
    
    console.log('Authorization recorded on blockchain:', blockchainRecord);
    return blockchainRecord;
  }
}

// Example usage
async function example() {
  // Create a random private key (in production, this would be securely managed)
  const privateKey = "0x" + crypto.randomBytes(32).toString('hex');
  
  // Create a data owner instance
  const dataOwner = new DataAuthorization(privateKey);
  
  // Create a data authorization request
  const authorization = await dataOwner.createAuthorizationRequest(
    "medical-record-123",
    "did:privai:0xrecipientaddress",
    ["federated_learning", "differential_privacy"],
    Date.now() + 86400000 // 24 hours expiration
  );
  
  console.log('Authorization created:', authorization);
  
  // Verify the authorization
  const verification = await DataAuthorization.verifyAuthorization(authorization);
  console.log('Verification result:', verification);
  
  // Create a privacy proof (e.g., prove the data contains rare cancer samples without revealing specifics)
  const dataAttribute = { type: "cancer_sample_count", value: 50 };
  const privacyProof = dataOwner.createPrivacyProof(dataAttribute, 30);
  console.log('Privacy proof:', privacyProof);
  
  // Record on blockchain
  const blockchainRecord = await dataOwner.recordOnBlockchain(authorization);
}

module.exports = {
  DataAuthorization
}; 