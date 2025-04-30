/**
 * PrivAI Network - Blockchain Module
 * 
 * This module provides interfaces for interacting with Ethereum and other blockchain networks,
 * including smart contract interactions, transaction management, and DID verification.
 */

const Web3 = require('web3');
const { ethers } = require('ethers');
const crypto = require('crypto');

// Contract ABIs
const PRAITokenABI = require('./abis/PRAIToken.json');
const DataRegistryABI = require('./abis/DataRegistry.json');

class Blockchain {
  constructor(config = {}) {
    this.config = {
      defaultNetwork: config.defaultNetwork || 'polygon', // polygon, ethereum, solana
      polygonRpc: config.polygonRpc || 'https://polygon-rpc.com',
      ethereumRpc: config.ethereumRpc || 'https://mainnet.infura.io/v3/your-infura-key',
      solanaPrc: config.solanaRpc || 'https://api.mainnet-beta.solana.com',
      contractAddresses: {
        polygon: {
          praiToken: config.polygonPraiToken || '0x0000000000000000000000000000000000000000',
          dataRegistry: config.polygonDataRegistry || '0x0000000000000000000000000000000000000000'
        },
        ethereum: {
          praiToken: config.ethereumPraiToken || '0x0000000000000000000000000000000000000000',
          dataRegistry: config.ethereumDataRegistry || '0x0000000000000000000000000000000000000000'
        }
      },
      ...config
    };
    
    // Track blockchain state
    this.providers = {};
    this.contracts = {};
    this.transactions = new Map();
    this.pendingTransactions = new Map();
    this.cachedData = new Map();
    
    // Initialize providers
    this._initializeProviders();
  }
  
  /**
   * Initialize blockchain providers
   * @private
   */
  _initializeProviders() {
    try {
      // Setup Ethereum/EVM providers
      this.providers.polygon = new ethers.providers.JsonRpcProvider(this.config.polygonRpc);
      this.providers.ethereum = new ethers.providers.JsonRpcProvider(this.config.ethereumRpc);
      
      // Also create Web3 instances for compatibility with some libraries
      this.web3 = {
        polygon: new Web3(this.config.polygonRpc),
        ethereum: new Web3(this.config.ethereumRpc)
      };
      
      console.log('Blockchain providers initialized');
    } catch (error) {
      console.error('Failed to initialize blockchain providers:', error);
      throw error;
    }
  }
  
  /**
   * Initialize contract instances
   * @param {string} network - Blockchain network
   * @param {object} wallet - Ethers wallet or signer
   * @returns {object} Initialized contracts
   */
  initializeContracts(network = this.config.defaultNetwork, wallet = null) {
    try {
      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Provider not available for network: ${network}`);
      }
      
      const contractAddresses = this.config.contractAddresses[network];
      if (!contractAddresses) {
        throw new Error(`Contract addresses not configured for network: ${network}`);
      }
      
      // Use provider or connect with wallet if provided
      const signer = wallet || provider;
      
      // Initialize contract instances
      const contracts = {
        praiToken: new ethers.Contract(
          contractAddresses.praiToken,
          PRAITokenABI,
          signer
        ),
        dataRegistry: new ethers.Contract(
          contractAddresses.dataRegistry,
          DataRegistryABI,
          signer
        )
      };
      
      // Store contracts for this network
      this.contracts[network] = contracts;
      
      console.log(`Contracts initialized for ${network}`);
      return contracts;
    } catch (error) {
      console.error(`Failed to initialize contracts for ${network}:`, error);
      throw error;
    }
  }
  
  /**
   * Connect with wallet
   * @param {string} privateKey - Private key for the wallet
   * @param {string} network - Blockchain network
   * @returns {object} Connected wallet and contracts
   */
  connectWallet(privateKey, network = this.config.defaultNetwork) {
    try {
      const provider = this.providers[network];
      if (!provider) {
        throw new Error(`Provider not available for network: ${network}`);
      }
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey, provider);
      
      // Initialize contracts with wallet
      const contracts = this.initializeContracts(network, wallet);
      
      console.log(`Wallet connected on ${network}: ${wallet.address}`);
      
      return {
        wallet,
        address: wallet.address,
        contracts
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }
  
  /**
   * Get token balance
   * @param {string} address - Wallet address
   * @param {string} network - Blockchain network
   * @returns {Promise<string>} Token balance in PRAI
   */
  async getTokenBalance(address, network = this.config.defaultNetwork) {
    try {
      // Ensure contracts are initialized
      if (!this.contracts[network]) {
        this.initializeContracts(network);
      }
      
      const praiToken = this.contracts[network].praiToken;
      const balanceWei = await praiToken.balanceOf(address);
      
      // Convert from wei to tokens (assuming 18 decimals)
      const balance = ethers.utils.formatUnits(balanceWei, 18);
      
      return balance;
    } catch (error) {
      console.error(`Failed to get token balance for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Get native token balance (ETH/MATIC)
   * @param {string} address - Wallet address
   * @param {string} network - Blockchain network
   * @returns {Promise<string>} Balance in native token
   */
  async getNativeBalance(address, network = this.config.defaultNetwork) {
    try {
      const provider = this.providers[network];
      const balanceWei = await provider.getBalance(address);
      
      // Convert from wei to tokens
      const balance = ethers.utils.formatEther(balanceWei);
      
      return balance;
    } catch (error) {
      console.error(`Failed to get native balance for ${address}:`, error);
      throw error;
    }
  }
  
  /**
   * Register data on the blockchain
   * @param {string} wallet - Connected wallet or signer
   * @param {string} dataId - Unique identifier for the data
   * @param {string} metadataHash - IPFS hash or other reference to metadata
   * @param {string} dataType - Type of data being registered
   * @param {string} encryptionType - Type of encryption used
   * @param {string} network - Blockchain network
   * @returns {Promise<object>} Transaction receipt
   */
  async registerData(wallet, dataId, metadataHash, dataType, encryptionType, network = this.config.defaultNetwork) {
    try {
      // Ensure contracts are initialized with wallet
      if (!this.contracts[network] || this.contracts[network].dataRegistry.signer !== wallet) {
        this.initializeContracts(network, wallet);
      }
      
      const dataRegistry = this.contracts[network].dataRegistry;
      
      // Convert strings to bytes32
      const dataIdBytes = this._stringToBytes32(dataId);
      const metadataHashBytes = this._stringToBytes32(metadataHash);
      
      // Prepare transaction
      const tx = await dataRegistry.registerData(
        dataIdBytes,
        metadataHashBytes,
        dataType,
        encryptionType,
        { gasLimit: 300000 }
      );
      
      // Track pending transaction
      this.pendingTransactions.set(tx.hash, {
        type: 'registerData',
        data: {
          dataId,
          metadataHash,
          dataType
        },
        timestamp: Date.now(),
        network
      });
      
      console.log(`Data registration transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Update transactions tracking
      this.transactions.set(tx.hash, {
        ...this.pendingTransactions.get(tx.hash),
        receipt,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'success' : 'failed'
      });
      
      this.pendingTransactions.delete(tx.hash);
      
      return {
        success: receipt.status === 1,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        events: receipt.events
      };
    } catch (error) {
      console.error('Failed to register data:', error);
      throw error;
    }
  }
  
  /**
   * Grant access to data
   * @param {string} wallet - Connected wallet or signer
   * @param {string} dataId - Data identifier
   * @param {string} granteeAddress - Address to grant access to
   * @param {number} expirationTime - Expiration timestamp (0 for no expiration)
   * @param {string} accessType - Type of access (read, compute, etc.)
   * @param {string} network - Blockchain network
   * @returns {Promise<object>} Transaction receipt
   */
  async grantDataAccess(wallet, dataId, granteeAddress, expirationTime, accessType, network = this.config.defaultNetwork) {
    try {
      // Ensure contracts are initialized with wallet
      if (!this.contracts[network] || this.contracts[network].dataRegistry.signer !== wallet) {
        this.initializeContracts(network, wallet);
      }
      
      const dataRegistry = this.contracts[network].dataRegistry;
      
      // Convert dataId to bytes32
      const dataIdBytes = this._stringToBytes32(dataId);
      
      // Create terms hash (in a real implementation, this would be more sophisticated)
      const termsHash = this._stringToBytes32(`${accessType}:${expirationTime}:${Date.now()}`);
      
      // Prepare transaction
      const tx = await dataRegistry.grantAccess(
        dataIdBytes,
        granteeAddress,
        expirationTime,
        accessType,
        termsHash,
        { gasLimit: 200000 }
      );
      
      console.log(`Data access grant transaction sent: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: receipt.status === 1,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        events: receipt.events
      };
    } catch (error) {
      console.error('Failed to grant data access:', error);
      throw error;
    }
  }
  
  /**
   * Verify if an address has valid access to data
   * @param {string} dataId - Data identifier
   * @param {string} address - Address to check access for
   * @param {string} network - Blockchain network
   * @returns {Promise<boolean>} Whether the address has valid access
   */
  async verifyDataAccess(dataId, address, network = this.config.defaultNetwork) {
    try {
      // Ensure contracts are initialized
      if (!this.contracts[network]) {
        this.initializeContracts(network);
      }
      
      const dataRegistry = this.contracts[network].dataRegistry;
      
      // Convert dataId to bytes32
      const dataIdBytes = this._stringToBytes32(dataId);
      
      // Check access
      const hasAccess = await dataRegistry.hasValidAccess(dataIdBytes, address);
      
      return hasAccess;
    } catch (error) {
      console.error('Failed to verify data access:', error);
      throw error;
    }
  }
  
  /**
   * Simulate a token transfer (for testing)
   * @param {string} wallet - Connected wallet or signer
   * @param {string} to - Recipient address
   * @param {string} amount - Amount in PRAI tokens
   * @param {string} network - Blockchain network
   * @returns {Promise<object>} Transaction information
   */
  async simulateTokenTransfer(wallet, to, amount, network = this.config.defaultNetwork) {
    try {
      // Ensure contracts are initialized with wallet
      if (!this.contracts[network] || this.contracts[network].praiToken.signer !== wallet) {
        this.initializeContracts(network, wallet);
      }
      
      // This is a simulation, so we don't actually send the transaction
      // We just estimate gas and other parameters
      
      const praiToken = this.contracts[network].praiToken;
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseUnits(amount, 18);
      
      // Estimate gas
      const gasEstimate = await praiToken.estimateGas.transfer(to, amountWei);
      
      // Get current gas price
      const gasPrice = await this.providers[network].getGasPrice();
      
      // Calculate total gas cost
      const gasCost = gasEstimate.mul(gasPrice);
      const gasCostEther = ethers.utils.formatEther(gasCost);
      
      console.log(`Simulated token transfer: ${amount} PRAI to ${to}`);
      console.log(`Estimated gas: ${gasEstimate.toString()}`);
      console.log(`Gas cost: ${gasCostEther} ${network === 'ethereum' ? 'ETH' : 'MATIC'}`);
      
      return {
        type: 'tokenTransfer',
        from: wallet.address,
        to,
        amount,
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        gasCost: gasCostEther,
        network,
        simulated: true
      };
    } catch (error) {
      console.error('Failed to simulate token transfer:', error);
      throw error;
    }
  }
  
  /**
   * Get transaction history for an address
   * @param {string} address - Wallet address
   * @param {number} limit - Maximum number of transactions to return
   * @param {string} network - Blockchain network
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(address, limit = 10, network = this.config.defaultNetwork) {
    try {
      // This is a simplified implementation
      // In a real application, we would query an indexer or blockchain explorer API
      
      const provider = this.providers[network];
      
      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      
      // Look back 1000 blocks maximum
      const lookbackBlocks = 1000;
      const fromBlock = Math.max(0, currentBlock - lookbackBlocks);
      
      // For tokens, we would need to query transfer events
      // Here we're just getting native transactions
      const history = [];
      const blockPromises = [];
      
      // To optimize, we get blocks in batches
      for (let i = 0; i < Math.min(limit, 10); i++) {
        const blockNumber = currentBlock - i;
        blockPromises.push(provider.getBlockWithTransactions(blockNumber));
      }
      
      const blocks = await Promise.all(blockPromises);
      
      // Process transactions in blocks
      for (const block of blocks) {
        const relevantTxs = block.transactions.filter(
          tx => tx.from === address || tx.to === address
        );
        
        for (const tx of relevantTxs) {
          history.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.utils.formatEther(tx.value),
            timestamp: block.timestamp * 1000, // Convert to milliseconds
            blockNumber: block.number,
            direction: tx.from === address ? 'outgoing' : 'incoming'
          });
          
          if (history.length >= limit) break;
        }
        
        if (history.length >= limit) break;
      }
      
      return history;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      throw error;
    }
  }
  
  /**
   * Create a blockchain-based DID (Decentralized Identifier)
   * @param {string} address - Wallet address
   * @param {string} network - Blockchain network
   * @returns {string} DID string
   */
  createDID(address, network = this.config.defaultNetwork) {
    try {
      // Create a DID string following the standard format
      // did:method:network:address
      
      const method = 'privai';
      const normalizedAddress = address.toLowerCase();
      
      // For Ethereum and Polygon addresses
      const did = `did:${method}:${network}:${normalizedAddress}`;
      
      return did;
    } catch (error) {
      console.error('Failed to create DID:', error);
      throw error;
    }
  }
  
  /**
   * Verify a DID
   * @param {string} did - Decentralized Identifier
   * @returns {object} Verification result
   */
  verifyDID(did) {
    try {
      // Parse the DID
      const parts = did.split(':');
      
      if (parts.length !== 4 || parts[0] !== 'did') {
        return { valid: false, reason: 'Invalid DID format' };
      }
      
      const method = parts[1];
      const network = parts[2];
      const address = parts[3];
      
      // Verify method
      if (method !== 'privai') {
        return { valid: false, reason: 'Unknown DID method' };
      }
      
      // Verify network
      if (!['ethereum', 'polygon', 'solana'].includes(network)) {
        return { valid: false, reason: 'Unsupported network' };
      }
      
      // Verify address format (simplified check)
      const isValidAddress = /^0x[0-9a-fA-F]{40}$/.test(address);
      if (!isValidAddress) {
        return { valid: false, reason: 'Invalid address format' };
      }
      
      return {
        valid: true,
        method,
        network,
        address
      };
    } catch (error) {
      console.error('Failed to verify DID:', error);
      return { valid: false, reason: error.message };
    }
  }
  
  /**
   * Helper method to convert string to bytes32
   * @param {string} str - String to convert
   * @returns {string} bytes32 representation
   * @private
   */
  _stringToBytes32(str) {
    // Hash the string with keccak256
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    return hash;
  }
  
  /**
   * Get transaction status
   * @param {string} txHash - Transaction hash
   * @param {string} network - Blockchain network
   * @returns {Promise<object>} Transaction status
   */
  async getTransactionStatus(txHash, network = this.config.defaultNetwork) {
    try {
      // Check if we have the transaction in our local tracking
      if (this.transactions.has(txHash)) {
        return this.transactions.get(txHash);
      }
      
      if (this.pendingTransactions.has(txHash)) {
        return {
          ...this.pendingTransactions.get(txHash),
          status: 'pending'
        };
      }
      
      // If not tracked locally, query the blockchain
      const provider = this.providers[network];
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        return { status: 'notFound', txHash };
      }
      
      if (!tx.blockNumber) {
        return { status: 'pending', txHash, from: tx.from, to: tx.to };
      }
      
      // Get transaction receipt to determine success/failure
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        txHash,
        from: tx.from,
        to: tx.to,
        blockNumber: tx.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        confirmations: tx.confirmations
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }
}

module.exports = Blockchain; 