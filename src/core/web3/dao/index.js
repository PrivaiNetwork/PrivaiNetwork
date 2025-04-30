/**
 * PrivAI Network - DAO Module
 * 
 * This module integrates governance and treasury functionality to provide
 * a comprehensive DAO (Decentralized Autonomous Organization) system for
 * managing the PrivAI Network protocol.
 */

const DAOGovernance = require('./governance');
const DAOTreasury = require('./treasury');
const crypto = require('crypto');

class DAO {
  constructor(config = {}) {
    this.config = {
      name: config.name || 'PrivAI Network DAO',
      tokenSymbol: config.tokenSymbol || 'PRAI',
      totalSupply: config.totalSupply || 1000000000, // 1 billion tokens
      ...config
    };
    
    // Initialize sub-modules
    this.governance = new DAOGovernance({
      minProposalThreshold: config.minProposalThreshold,
      quorum: config.quorum,
      votingPeriod: config.votingPeriod,
      timeLockPeriod: config.timeLockPeriod,
      useQuadraticVoting: config.useQuadraticVoting
    });
    
    this.treasury = new DAOTreasury({
      pendingPeriod: config.pendingPeriod,
      minApprovers: config.minApprovers,
      maxWithdrawalPercent: config.maxWithdrawalPercent,
      emergencyTimelock: config.emergencyTimelock
    });
    
    this.members = new Map();
    this.memberStats = {
      totalMembers: 0,
      activeVoters: 0,
      tokenHolders: 0
    };
    
    this.history = [];
    this.metadata = {
      createdAt: Date.now(),
      version: '1.0.0',
      lastUpdated: Date.now(),
      ...config.metadata
    };
    
    console.log(`Initialized ${this.config.name} with ${this.config.totalSupply} ${this.config.tokenSymbol} tokens`);
  }
  
  /**
   * Register a new DAO member
   * @param {string} did - Decentralized identifier of the member
   * @param {number} tokenBalance - Initial token balance
   * @param {Object} metadata - Additional member metadata
   * @returns {Object} Member information
   */
  registerMember(did, tokenBalance = 0, metadata = {}) {
    if (this.members.has(did)) {
      throw new Error(`Member ${did} already registered`);
    }
    
    // Create member record
    const member = {
      did,
      tokenBalance,
      votingPower: tokenBalance,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      proposals: [],
      votes: [],
      delegatedTo: null,
      delegatedFrom: [],
      metadata: {
        name: metadata.name || 'Anonymous',
        avatarUrl: metadata.avatarUrl || null,
        bio: metadata.bio || '',
        ...metadata
      }
    };
    
    // Store member
    this.members.set(did, member);
    
    // Update stats
    this.memberStats.totalMembers++;
    if (tokenBalance > 0) {
      this.memberStats.tokenHolders++;
    }
    
    console.log(`Registered new DAO member ${did} with ${tokenBalance} ${this.config.tokenSymbol}`);
    
    // Add to history
    this._addToHistory('member_registration', {
      did,
      tokenBalance,
      timestamp: member.joinedAt
    });
    
    return {
      did,
      tokenBalance,
      votingPower: member.votingPower,
      joinedAt: member.joinedAt,
      status: 'registered'
    };
  }
  
  /**
   * Update a member's token balance
   * @param {string} did - Decentralized identifier of the member
   * @param {number} newBalance - New token balance
   * @returns {Object} Updated member information
   */
  updateMemberBalance(did, newBalance) {
    const member = this.members.get(did);
    if (!member) {
      throw new Error(`Member ${did} not found`);
    }
    
    const oldBalance = member.tokenBalance;
    member.tokenBalance = newBalance;
    
    // Update voting power if not delegated
    if (!member.delegatedTo) {
      member.votingPower = newBalance;
    }
    
    // Update token holder stats
    if (oldBalance === 0 && newBalance > 0) {
      this.memberStats.tokenHolders++;
    } else if (oldBalance > 0 && newBalance === 0) {
      this.memberStats.tokenHolders--;
    }
    
    // Update last active timestamp
    member.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('balance_update', {
      did,
      oldBalance,
      newBalance,
      timestamp: member.lastActive
    });
    
    return {
      did,
      tokenBalance: member.tokenBalance,
      votingPower: member.votingPower,
      updatedAt: member.lastActive
    };
  }
  
  /**
   * Create a governance proposal
   * @param {string} proposerDid - Decentralized identifier of the proposer
   * @param {string} title - Title of the proposal
   * @param {string} description - Detailed description of the proposal
   * @param {Array} actions - Array of actions to be executed if proposal passes
   * @param {Object} metadata - Additional proposal metadata
   * @returns {Object} Created proposal information
   */
  createProposal(proposerDid, title, description, actions, metadata = {}) {
    const member = this.members.get(proposerDid);
    if (!member) {
      throw new Error(`Member ${proposerDid} not found`);
    }
    
    // Create proposal using governance module
    const proposal = this.governance.createProposal(
      proposerDid,
      member.tokenBalance,
      title,
      description,
      actions,
      metadata
    );
    
    // Update member record
    member.proposals.push({
      proposalId: proposal.proposalId,
      title,
      createdAt: proposal.votingStarts
    });
    
    // Update last active timestamp
    member.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('proposal_creation', {
      proposalId: proposal.proposalId,
      proposerDid,
      title,
      timestamp: proposal.votingStarts
    });
    
    return proposal;
  }
  
  /**
   * Cast a vote on a proposal
   * @param {string} proposalId - ID of the proposal
   * @param {string} voterDid - Decentralized identifier of the voter
   * @param {string} voteDirection - Direction of vote ('for', 'against', 'abstain')
   * @param {Object} metadata - Additional vote metadata
   * @returns {Object} Vote confirmation
   */
  castVote(proposalId, voterDid, voteDirection, metadata = {}) {
    const member = this.members.get(voterDid);
    if (!member) {
      throw new Error(`Member ${voterDid} not found`);
    }
    
    // Cast vote using governance module
    const vote = this.governance.castVote(
      proposalId,
      voterDid,
      member.votingPower, // Use voting power (which may include delegated power)
      voteDirection,
      metadata
    );
    
    // Update member record
    member.votes.push({
      proposalId,
      direction: voteDirection,
      votingPower: vote.votingPower,
      timestamp: vote.timestamp
    });
    
    // Update stats if this is their first vote
    if (member.votes.length === 1) {
      this.memberStats.activeVoters++;
    }
    
    // Update last active timestamp
    member.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('vote_cast', {
      proposalId,
      voterDid,
      direction: voteDirection,
      votingPower: vote.votingPower,
      timestamp: vote.timestamp
    });
    
    return vote;
  }
  
  /**
   * Delegate voting power to another member
   * @param {string} fromDid - Decentralized identifier of the delegator
   * @param {string} toDid - Decentralized identifier of the delegatee
   * @returns {Object} Delegation confirmation
   */
  delegateVotingPower(fromDid, toDid) {
    const delegator = this.members.get(fromDid);
    if (!delegator) {
      throw new Error(`Member ${fromDid} not found`);
    }
    
    const delegatee = this.members.get(toDid);
    if (!delegatee) {
      throw new Error(`Member ${toDid} not found`);
    }
    
    // Can't delegate if already delegated
    if (delegator.delegatedTo) {
      throw new Error(`Member ${fromDid} has already delegated to ${delegator.delegatedTo}`);
    }
    
    // Update delegator record
    delegator.delegatedTo = toDid;
    delegator.votingPower = 0; // Transferred to delegatee
    
    // Update delegatee record
    delegatee.delegatedFrom.push(fromDid);
    delegatee.votingPower += delegator.tokenBalance;
    
    // Create delegation in governance module
    const delegation = this.governance.delegateVotes(fromDid, toDid, delegator.tokenBalance);
    
    // Update last active timestamps
    delegator.lastActive = Date.now();
    delegatee.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('voting_delegation', {
      fromDid,
      toDid,
      amount: delegator.tokenBalance,
      timestamp: delegation.timestamp
    });
    
    return {
      delegatorDid: fromDid,
      delegateeDid: toDid,
      tokenBalance: delegator.tokenBalance,
      timestamp: delegation.timestamp,
      status: 'delegated'
    };
  }
  
  /**
   * Undo a voting power delegation
   * @param {string} fromDid - Decentralized identifier of the delegator
   * @returns {Object} Undelegation confirmation
   */
  undelegateVotingPower(fromDid) {
    const delegator = this.members.get(fromDid);
    if (!delegator) {
      throw new Error(`Member ${fromDid} not found`);
    }
    
    // Check if actually delegated
    if (!delegator.delegatedTo) {
      throw new Error(`Member ${fromDid} has not delegated their voting power`);
    }
    
    const toDid = delegator.delegatedTo;
    const delegatee = this.members.get(toDid);
    
    // Update delegatee record if they still exist
    if (delegatee) {
      delegatee.votingPower -= delegator.tokenBalance;
      delegatee.delegatedFrom = delegatee.delegatedFrom.filter(did => did !== fromDid);
      delegatee.lastActive = Date.now();
    }
    
    // Update delegator record
    delegator.delegatedTo = null;
    delegator.votingPower = delegator.tokenBalance; // Reclaim voting power
    delegator.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('voting_undelegation', {
      fromDid,
      toDid,
      amount: delegator.tokenBalance,
      timestamp: delegator.lastActive
    });
    
    return {
      delegatorDid: fromDid,
      previousDelegateeDid: toDid,
      reclaimedVotingPower: delegator.tokenBalance,
      timestamp: delegator.lastActive,
      status: 'undelegated'
    };
  }
  
  /**
   * Request a treasury withdrawal
   * @param {string} initiatorDid - Decentralized identifier of the initiator
   * @param {string} recipientDid - Decentralized identifier of the recipient
   * @param {string} assetType - Asset type (e.g., 'PRAI', 'ETH')
   * @param {number} amount - Amount to withdraw
   * @param {string} purpose - Purpose of the withdrawal
   * @returns {Object} Withdrawal request information
   */
  requestWithdrawal(initiatorDid, recipientDid, assetType, amount, purpose) {
    const member = this.members.get(initiatorDid);
    if (!member) {
      throw new Error(`Member ${initiatorDid} not found`);
    }
    
    // Create withdrawal request using treasury module
    const withdrawalRequest = this.treasury.requestWithdrawal(
      initiatorDid,
      recipientDid,
      assetType,
      amount,
      purpose
    );
    
    // Update last active timestamp
    member.lastActive = Date.now();
    
    // Add to history
    this._addToHistory('withdrawal_request', {
      transactionId: withdrawalRequest.transactionId,
      initiatorDid,
      recipientDid,
      assetType,
      amount,
      timestamp: Date.now()
    });
    
    return withdrawalRequest;
  }
  
  /**
   * Get member information
   * @param {string} did - Decentralized identifier of the member
   * @returns {Object} Member details
   */
  getMemberInfo(did) {
    const member = this.members.get(did);
    if (!member) {
      throw new Error(`Member ${did} not found`);
    }
    
    return {
      did,
      tokenBalance: member.tokenBalance,
      votingPower: member.votingPower,
      joinedAt: member.joinedAt,
      lastActive: member.lastActive,
      delegatedTo: member.delegatedTo,
      delegatedFrom: member.delegatedFrom,
      metadata: member.metadata,
      stats: {
        proposalCount: member.proposals.length,
        voteCount: member.votes.length,
        delegationCount: member.delegatedFrom.length
      }
    };
  }
  
  /**
   * Get DAO statistics
   * @returns {Object} DAO statistics
   */
  getDAOStats() {
    // Get governance stats
    const activeProposals = this.governance.listActiveProposals();
    
    // Get treasury balance
    const treasuryBalance = this.treasury.getBalance();
    
    return {
      name: this.config.name,
      tokenSymbol: this.config.tokenSymbol,
      totalSupply: this.config.totalSupply,
      members: {
        totalMembers: this.memberStats.totalMembers,
        activeVoters: this.memberStats.activeVoters,
        tokenHolders: this.memberStats.tokenHolders
      },
      governance: {
        activeProposalCount: activeProposals.length,
        totalProposalCount: this.history.filter(h => h.type === 'proposal_creation').length,
        totalVotes: this.history.filter(h => h.type === 'vote_cast').length
      },
      treasury: {
        balance: treasuryBalance
      },
      metadata: this.metadata
    };
  }
  
  /**
   * Add an event to history
   * @param {string} type - Type of event
   * @param {Object} data - Event data
   * @private
   */
  _addToHistory(type, data) {
    this.history.push({
      type,
      data,
      timestamp: data.timestamp || Date.now()
    });
    
    // Limit history size (keep most recent 1000 events)
    if (this.history.length > 1000) {
      this.history.shift();
    }
    
    // Update last updated timestamp
    this.metadata.lastUpdated = Date.now();
  }
  
  /**
   * Get DAO history
   * @param {number} limit - Maximum number of events to return
   * @param {number} offset - Offset for pagination
   * @param {string} type - Filter by event type (optional)
   * @returns {Array} DAO history events
   */
  getHistory(limit = 20, offset = 0, type = null) {
    // Filter by type if specified
    let filteredHistory = this.history;
    if (type) {
      filteredHistory = this.history.filter(event => event.type === type);
    }
    
    // Sort by timestamp (most recent first)
    const sortedHistory = [...filteredHistory].sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    return sortedHistory.slice(offset, offset + limit);
  }
}

module.exports = DAO; 