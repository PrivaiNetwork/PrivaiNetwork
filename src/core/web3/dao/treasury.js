/**
 * PrivAI Network - DAO Treasury Module
 * 
 * This module manages the DAO's treasury funds, including allocations, distributions,
 * and financial operations. It supports both native PRAI token and other assets.
 */

const crypto = require('crypto');

class DAOTreasury {
  constructor(config = {}) {
    this.config = {
      pendingPeriod: config.pendingPeriod || 48 * 60 * 60 * 1000, // 48 hours in milliseconds
      minApprovers: config.minApprovers || 3, // Minimum number of approvers for multisig
      maxWithdrawalPercent: config.maxWithdrawalPercent || 10, // Maximum % of treasury that can be withdrawn at once
      emergencyTimelock: config.emergencyTimelock || 7 * 24 * 60 * 60 * 1000, // 7 days for emergency actions
      ...config
    };
    
    this.balance = {
      PRAI: 0,
      ETH: 0,
      MATIC: 0
    };
    
    this.allocations = new Map();
    this.transactions = new Map();
    this.pendingTransactions = new Map();
    this.approvers = new Set();
    this.emergencyActions = new Map();
  }
  
  /**
   * Add an approver for multisig treasury operations
   * @param {string} approverDid - Decentralized identifier of the approver
   * @param {Object} metadata - Additional approver metadata
   * @returns {Object} Approver status
   */
  addApprover(approverDid, metadata = {}) {
    if (this.approvers.has(approverDid)) {
      throw new Error(`Approver ${approverDid} already exists`);
    }
    
    this.approvers.add(approverDid);
    
    console.log(`Added ${approverDid} as treasury approver`);
    
    return {
      approverDid,
      status: 'added',
      timestamp: Date.now(),
      approverCount: this.approvers.size
    };
  }
  
  /**
   * Remove an approver
   * @param {string} approverDid - Decentralized identifier of the approver to remove
   * @returns {Object} Removal status
   */
  removeApprover(approverDid) {
    if (!this.approvers.has(approverDid)) {
      throw new Error(`Approver ${approverDid} not found`);
    }
    
    // Prevent removing if it would leave fewer than minApprovers
    if (this.approvers.size <= this.config.minApprovers) {
      throw new Error(`Cannot remove approver: minimum of ${this.config.minApprovers} approvers required`);
    }
    
    this.approvers.delete(approverDid);
    
    console.log(`Removed ${approverDid} as treasury approver`);
    
    return {
      approverDid,
      status: 'removed',
      timestamp: Date.now(),
      approverCount: this.approvers.size
    };
  }
  
  /**
   * Deposit funds into the treasury
   * @param {string} fromDid - Decentralized identifier of the sender
   * @param {string} assetType - Asset type (e.g., 'PRAI', 'ETH')
   * @param {number} amount - Amount to deposit
   * @returns {Object} Deposit transaction information
   */
  deposit(fromDid, assetType, amount) {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    
    // Validate asset type
    if (!this.balance.hasOwnProperty(assetType)) {
      this.balance[assetType] = 0; // Initialize balance for new asset type
    }
    
    // Update balance
    this.balance[assetType] += amount;
    
    // Generate transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex');
    
    // Create transaction record
    const transaction = {
      id: transactionId,
      type: 'deposit',
      fromDid,
      assetType,
      amount,
      timestamp: Date.now(),
      status: 'completed'
    };
    
    // Store transaction
    this.transactions.set(transactionId, transaction);
    
    console.log(`Deposited ${amount} ${assetType} from ${fromDid}`);
    
    return {
      transactionId,
      assetType,
      amount,
      newBalance: this.balance[assetType],
      status: 'completed'
    };
  }
  
  /**
   * Create a withdrawal request (requires multisig approval)
   * @param {string} initiatorDid - Decentralized identifier of the initiator
   * @param {string} recipientDid - Decentralized identifier of the recipient
   * @param {string} assetType - Asset type (e.g., 'PRAI', 'ETH')
   * @param {number} amount - Amount to withdraw
   * @param {string} purpose - Purpose of the withdrawal
   * @returns {Object} Withdrawal request information
   */
  requestWithdrawal(initiatorDid, recipientDid, assetType, amount, purpose) {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    
    // Validate asset type
    if (!this.balance.hasOwnProperty(assetType) || this.balance[assetType] < amount) {
      throw new Error(`Insufficient ${assetType} balance for withdrawal`);
    }
    
    // Check maximum withdrawal percent
    const maxWithdrawal = this.balance[assetType] * (this.config.maxWithdrawalPercent / 100);
    if (amount > maxWithdrawal) {
      throw new Error(`Withdrawal exceeds maximum allowed (${this.config.maxWithdrawalPercent}% of treasury)`);
    }
    
    // Generate transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex');
    
    // Create pending transaction
    const pendingTx = {
      id: transactionId,
      type: 'withdrawal',
      initiatorDid,
      recipientDid,
      assetType,
      amount,
      purpose,
      approvals: new Set(),
      rejections: new Set(),
      requestedAt: Date.now(),
      expiresAt: Date.now() + this.config.pendingPeriod,
      status: 'pending'
    };
    
    // Store pending transaction
    this.pendingTransactions.set(transactionId, pendingTx);
    
    console.log(`Withdrawal request ${transactionId} created: ${amount} ${assetType} to ${recipientDid}`);
    
    return {
      transactionId,
      assetType,
      amount,
      recipientDid,
      status: 'pending',
      expiresAt: pendingTx.expiresAt,
      requiredApprovals: Math.ceil(this.approvers.size / 2) // Simple majority
    };
  }
  
  /**
   * Approve a pending withdrawal request
   * @param {string} transactionId - ID of the transaction to approve
   * @param {string} approverDid - Decentralized identifier of the approver
   * @returns {Object} Approval status
   */
  approveWithdrawal(transactionId, approverDid) {
    // Check if approver is authorized
    if (!this.approvers.has(approverDid)) {
      throw new Error(`${approverDid} is not an authorized approver`);
    }
    
    // Get pending transaction
    const pendingTx = this.pendingTransactions.get(transactionId);
    if (!pendingTx) {
      throw new Error(`Transaction ${transactionId} not found or already processed`);
    }
    
    // Check if transaction is still pending
    if (pendingTx.status !== 'pending') {
      throw new Error(`Transaction ${transactionId} is already ${pendingTx.status}`);
    }
    
    // Check if transaction has expired
    if (Date.now() > pendingTx.expiresAt) {
      pendingTx.status = 'expired';
      throw new Error(`Transaction ${transactionId} has expired`);
    }
    
    // Check if approver has already approved
    if (pendingTx.approvals.has(approverDid)) {
      throw new Error(`${approverDid} has already approved this transaction`);
    }
    
    // Remove from rejections if previously rejected
    if (pendingTx.rejections.has(approverDid)) {
      pendingTx.rejections.delete(approverDid);
    }
    
    // Add approval
    pendingTx.approvals.add(approverDid);
    
    console.log(`${approverDid} approved withdrawal ${transactionId}`);
    
    // Check if we have enough approvals to execute
    const requiredApprovals = Math.ceil(this.approvers.size / 2); // Simple majority
    
    if (pendingTx.approvals.size >= requiredApprovals) {
      return this._executeWithdrawal(transactionId);
    }
    
    return {
      transactionId,
      status: 'pending',
      approvals: pendingTx.approvals.size,
      rejections: pendingTx.rejections.size,
      requiredApprovals,
      approvedBy: Array.from(pendingTx.approvals)
    };
  }
  
  /**
   * Reject a pending withdrawal request
   * @param {string} transactionId - ID of the transaction to reject
   * @param {string} approverDid - Decentralized identifier of the approver
   * @param {string} reason - Reason for rejection
   * @returns {Object} Rejection status
   */
  rejectWithdrawal(transactionId, approverDid, reason = '') {
    // Check if approver is authorized
    if (!this.approvers.has(approverDid)) {
      throw new Error(`${approverDid} is not an authorized approver`);
    }
    
    // Get pending transaction
    const pendingTx = this.pendingTransactions.get(transactionId);
    if (!pendingTx) {
      throw new Error(`Transaction ${transactionId} not found or already processed`);
    }
    
    // Check if transaction is still pending
    if (pendingTx.status !== 'pending') {
      throw new Error(`Transaction ${transactionId} is already ${pendingTx.status}`);
    }
    
    // Check if transaction has expired
    if (Date.now() > pendingTx.expiresAt) {
      pendingTx.status = 'expired';
      throw new Error(`Transaction ${transactionId} has expired`);
    }
    
    // Check if approver has already rejected
    if (pendingTx.rejections.has(approverDid)) {
      throw new Error(`${approverDid} has already rejected this transaction`);
    }
    
    // Remove from approvals if previously approved
    if (pendingTx.approvals.has(approverDid)) {
      pendingTx.approvals.delete(approverDid);
    }
    
    // Add rejection
    pendingTx.rejections.add(approverDid);
    pendingTx.rejectionReasons = pendingTx.rejectionReasons || {};
    pendingTx.rejectionReasons[approverDid] = reason;
    
    console.log(`${approverDid} rejected withdrawal ${transactionId}`);
    
    // Check if we have enough rejections to cancel
    const requiredRejections = Math.ceil(this.approvers.size / 2); // Simple majority
    
    if (pendingTx.rejections.size >= requiredRejections) {
      pendingTx.status = 'rejected';
      pendingTx.rejectedAt = Date.now();
      
      // Move from pending to completed transactions
      this.transactions.set(transactionId, {
        ...pendingTx,
        status: 'rejected',
        approvals: Array.from(pendingTx.approvals),
        rejections: Array.from(pendingTx.rejections)
      });
      
      this.pendingTransactions.delete(transactionId);
      
      return {
        transactionId,
        status: 'rejected',
        rejectedAt: pendingTx.rejectedAt
      };
    }
    
    return {
      transactionId,
      status: 'pending',
      approvals: pendingTx.approvals.size,
      rejections: pendingTx.rejections.size,
      requiredRejections,
      rejectedBy: Array.from(pendingTx.rejections)
    };
  }
  
  /**
   * Execute an approved withdrawal (internal method)
   * @param {string} transactionId - ID of the transaction to execute
   * @returns {Object} Execution status
   * @private
   */
  _executeWithdrawal(transactionId) {
    const pendingTx = this.pendingTransactions.get(transactionId);
    
    // Double-check balance
    if (this.balance[pendingTx.assetType] < pendingTx.amount) {
      pendingTx.status = 'failed';
      pendingTx.failureReason = 'Insufficient balance';
      
      this.transactions.set(transactionId, {
        ...pendingTx,
        approvals: Array.from(pendingTx.approvals),
        rejections: Array.from(pendingTx.rejections)
      });
      
      this.pendingTransactions.delete(transactionId);
      
      return {
        transactionId,
        status: 'failed',
        reason: 'Insufficient balance'
      };
    }
    
    // Update balances
    this.balance[pendingTx.assetType] -= pendingTx.amount;
    
    // Update transaction status
    pendingTx.status = 'completed';
    pendingTx.executedAt = Date.now();
    
    // Move from pending to completed transactions
    this.transactions.set(transactionId, {
      ...pendingTx,
      approvals: Array.from(pendingTx.approvals),
      rejections: Array.from(pendingTx.rejections)
    });
    
    this.pendingTransactions.delete(transactionId);
    
    console.log(`Executed withdrawal ${transactionId}: ${pendingTx.amount} ${pendingTx.assetType} to ${pendingTx.recipientDid}`);
    
    return {
      transactionId,
      status: 'completed',
      assetType: pendingTx.assetType,
      amount: pendingTx.amount,
      recipientDid: pendingTx.recipientDid,
      executedAt: pendingTx.executedAt,
      newBalance: this.balance[pendingTx.assetType]
    };
  }
  
  /**
   * Create a budget allocation
   * @param {string} name - Name of the allocation
   * @param {string} assetType - Asset type (e.g., 'PRAI', 'ETH')
   * @param {number} amount - Amount to allocate
   * @param {Object} metadata - Additional allocation metadata
   * @returns {Object} Allocation information
   */
  createAllocation(name, assetType, amount, metadata = {}) {
    if (amount <= 0) {
      throw new Error('Allocation amount must be positive');
    }
    
    // Validate asset type
    if (!this.balance.hasOwnProperty(assetType) || this.balance[assetType] < amount) {
      throw new Error(`Insufficient ${assetType} balance for allocation`);
    }
    
    // Generate allocation ID
    const allocationId = crypto.randomBytes(8).toString('hex');
    
    // Create allocation
    const allocation = {
      id: allocationId,
      name,
      assetType,
      amount,
      remaining: amount,
      createdAt: Date.now(),
      metadata: {
        description: metadata.description || '',
        category: metadata.category || 'general',
        expiration: metadata.expiration || null,
        ...metadata
      },
      transactions: []
    };
    
    // Store allocation
    this.allocations.set(allocationId, allocation);
    
    console.log(`Created ${assetType} allocation ${name} with ${amount} ${assetType}`);
    
    return {
      allocationId,
      name,
      assetType,
      amount,
      status: 'created'
    };
  }
  
  /**
   * Spend from an allocation
   * @param {string} allocationId - ID of the allocation
   * @param {string} recipientDid - Decentralized identifier of the recipient
   * @param {number} amount - Amount to spend
   * @param {string} purpose - Purpose of the expenditure
   * @returns {Object} Expenditure information
   */
  spendFromAllocation(allocationId, recipientDid, amount, purpose) {
    if (amount <= 0) {
      throw new Error('Expenditure amount must be positive');
    }
    
    // Get allocation
    const allocation = this.allocations.get(allocationId);
    if (!allocation) {
      throw new Error(`Allocation ${allocationId} not found`);
    }
    
    // Check if allocation has enough funds
    if (allocation.remaining < amount) {
      throw new Error(`Insufficient funds in allocation ${allocation.name}`);
    }
    
    // Check if allocation has expired
    if (allocation.metadata.expiration && Date.now() > allocation.metadata.expiration) {
      throw new Error(`Allocation ${allocation.name} has expired`);
    }
    
    // Generate transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex');
    
    // Update allocation
    allocation.remaining -= amount;
    
    // Create transaction
    const transaction = {
      id: transactionId,
      allocationId,
      recipientDid,
      amount,
      purpose,
      timestamp: Date.now()
    };
    
    // Add to allocation transactions
    allocation.transactions.push(transaction);
    
    // Add to global transactions
    this.transactions.set(transactionId, {
      ...transaction,
      type: 'allocation_spend',
      assetType: allocation.assetType,
      allocationName: allocation.name,
      status: 'completed'
    });
    
    console.log(`Spent ${amount} ${allocation.assetType} from allocation ${allocation.name} to ${recipientDid}`);
    
    return {
      transactionId,
      allocationId,
      allocationName: allocation.name,
      amount,
      assetType: allocation.assetType,
      recipientDid,
      status: 'completed',
      remainingInAllocation: allocation.remaining
    };
  }
  
  /**
   * Get the current treasury balance
   * @returns {Object} Current balance for all asset types
   */
  getBalance() {
    return {
      ...this.balance,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get transaction history
   * @param {number} limit - Maximum number of transactions to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} Transaction history
   */
  getTransactionHistory(limit = 20, offset = 0) {
    // Convert transactions map to array and sort by timestamp (most recent first)
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    return transactions.slice(offset, offset + limit);
  }
  
  /**
   * Get detailed information about an allocation
   * @param {string} allocationId - ID of the allocation
   * @returns {Object} Allocation details
   */
  getAllocationDetails(allocationId) {
    const allocation = this.allocations.get(allocationId);
    if (!allocation) {
      throw new Error(`Allocation ${allocationId} not found`);
    }
    
    // Calculate some statistics
    const spent = allocation.amount - allocation.remaining;
    const percentUsed = (spent / allocation.amount * 100).toFixed(2);
    
    // Sort transactions by timestamp (most recent first)
    const sortedTransactions = [...allocation.transactions]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      id: allocation.id,
      name: allocation.name,
      assetType: allocation.assetType,
      amount: allocation.amount,
      remaining: allocation.remaining,
      spent,
      percentUsed,
      createdAt: allocation.createdAt,
      metadata: allocation.metadata,
      transactions: sortedTransactions
    };
  }
}

module.exports = DAOTreasury; 