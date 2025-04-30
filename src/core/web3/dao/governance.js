/**
 * PrivAI Network - DAO Governance Module
 * 
 * This module implements decentralized governance functionality for the PrivAI Network,
 * allowing token holders to create, vote on, and execute proposals that affect the
 * protocol's parameters, upgrades, and resource allocations.
 */

const crypto = require('crypto');

class DAOGovernance {
  constructor(config = {}) {
    this.config = {
      minProposalThreshold: config.minProposalThreshold || 1000000, // 0.1% of total supply (1 billion)
      quorum: config.quorum || 100000000, // 10% of total supply needed for valid vote
      votingPeriod: config.votingPeriod || 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      timeLockPeriod: config.timeLockPeriod || 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
      useQuadraticVoting: config.useQuadraticVoting !== false, // Default to true
      ...config
    };
    
    this.proposals = new Map();
    this.votes = new Map();
    this.delegations = new Map();
    this.executedProposals = new Map();
    this.cancelledProposals = new Map();
  }
  
  /**
   * Create a new governance proposal
   * @param {string} proposerDid - Decentralized identifier of the proposer
   * @param {number} tokensHeld - Number of tokens held by the proposer
   * @param {string} title - Title of the proposal
   * @param {string} description - Detailed description of the proposal
   * @param {Array} actions - Array of actions to be executed if proposal passes
   * @param {Object} metadata - Additional proposal metadata
   * @returns {Object} Created proposal information
   */
  createProposal(proposerDid, tokensHeld, title, description, actions, metadata = {}) {
    // Check if proposer has enough tokens
    if (tokensHeld < this.config.minProposalThreshold) {
      throw new Error(`Proposer needs at least ${this.config.minProposalThreshold} PRAI tokens to create a proposal`);
    }
    
    // Validate actions
    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Proposal must include at least one action');
    }
    
    // Generate proposal ID
    const proposalId = crypto.randomBytes(16).toString('hex');
    
    // Create timestamp
    const createdAt = Date.now();
    const votingStarts = createdAt;
    const votingEnds = votingStarts + this.config.votingPeriod;
    
    // Create the proposal
    const proposal = {
      id: proposalId,
      title,
      description,
      proposerDid,
      tokensHeld,
      status: 'active',
      actions,
      votingStarts,
      votingEnds,
      createdAt,
      metadata: {
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        urls: metadata.urls || [],
        ...metadata
      },
      votes: {
        for: 0,
        against: 0,
        abstain: 0
      },
      voterCount: 0
    };
    
    // Store the proposal
    this.proposals.set(proposalId, proposal);
    
    console.log(`Created proposal ${proposalId}: ${title}`);
    
    return {
      proposalId,
      title,
      status: 'active',
      votingStarts,
      votingEnds,
      proposerDid
    };
  }
  
  /**
   * Cast a vote on a proposal
   * @param {string} proposalId - ID of the proposal
   * @param {string} voterDid - Decentralized identifier of the voter
   * @param {number} tokensHeld - Number of tokens held by the voter
   * @param {string} voteDirection - Direction of vote ('for', 'against', 'abstain')
   * @param {Object} metadata - Additional vote metadata
   * @returns {Object} Vote confirmation
   */
  castVote(proposalId, voterDid, tokensHeld, voteDirection, metadata = {}) {
    // Get the proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Check if proposal is active
    if (proposal.status !== 'active') {
      throw new Error(`Proposal ${proposalId} is not active for voting`);
    }
    
    // Check if voting period is active
    const now = Date.now();
    if (now < proposal.votingStarts || now > proposal.votingEnds) {
      throw new Error(`Voting period for proposal ${proposalId} is not active`);
    }
    
    // Check if voter has already voted
    const existingVoteKey = `${proposalId}:${voterDid}`;
    if (this.votes.has(existingVoteKey)) {
      throw new Error(`Voter ${voterDid} has already voted on proposal ${proposalId}`);
    }
    
    // Validate vote direction
    if (!['for', 'against', 'abstain'].includes(voteDirection)) {
      throw new Error(`Invalid vote direction: ${voteDirection}`);
    }
    
    // Calculate voting power
    let votingPower = tokensHeld;
    
    // Apply quadratic voting if enabled
    if (this.config.useQuadraticVoting) {
      votingPower = Math.floor(Math.sqrt(tokensHeld));
    }
    
    // Apply stake duration multiplier if provided
    if (metadata.stakeDuration) {
      // 1 year stake = 1.5x multiplier, max 2x for 2+ years
      const durationMultiplier = Math.min(1 + (metadata.stakeDuration / 365 / 2), 2);
      votingPower = Math.floor(votingPower * durationMultiplier);
    }
    
    // Create the vote
    const vote = {
      proposalId,
      voterDid,
      tokensHeld,
      votingPower,
      direction: voteDirection,
      timestamp: now,
      metadata: metadata
    };
    
    // Update proposal vote counts
    proposal.votes[voteDirection] += votingPower;
    proposal.voterCount += 1;
    
    // Store the vote
    this.votes.set(existingVoteKey, vote);
    
    console.log(`Voter ${voterDid} cast ${voteDirection} vote with power ${votingPower} on proposal ${proposalId}`);
    
    return {
      proposalId,
      voterDid,
      direction: voteDirection,
      votingPower,
      timestamp: now,
      status: 'recorded'
    };
  }
  
  /**
   * Delegate voting power to another address
   * @param {string} delegatorDid - Decentralized identifier of the delegator
   * @param {string} delegateeDid - Decentralized identifier of the delegatee
   * @param {number} tokensHeld - Number of tokens held by the delegator
   * @returns {Object} Delegation confirmation
   */
  delegateVotes(delegatorDid, delegateeDid, tokensHeld) {
    // Prevent self-delegation
    if (delegatorDid === delegateeDid) {
      throw new Error('Cannot delegate to self');
    }
    
    // Check if delegation already exists
    if (this.delegations.has(delegatorDid)) {
      throw new Error(`Delegation already exists for ${delegatorDid}`);
    }
    
    // Create the delegation
    const delegation = {
      delegatorDid,
      delegateeDid,
      tokensHeld,
      timestamp: Date.now()
    };
    
    // Store the delegation
    this.delegations.set(delegatorDid, delegation);
    
    console.log(`${delegatorDid} delegated ${tokensHeld} voting power to ${delegateeDid}`);
    
    return {
      delegatorDid,
      delegateeDid,
      tokensHeld,
      status: 'delegated',
      timestamp: delegation.timestamp
    };
  }
  
  /**
   * Get current status of a proposal
   * @param {string} proposalId - ID of the proposal
   * @returns {Object} Proposal details and current status
   */
  getProposalStatus(proposalId) {
    // Get the proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Calculate total votes and percentages
    const totalVotes = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    const forPercentage = totalVotes > 0 ? (proposal.votes.for / totalVotes * 100).toFixed(2) : '0.00';
    const againstPercentage = totalVotes > 0 ? (proposal.votes.against / totalVotes * 100).toFixed(2) : '0.00';
    const abstainPercentage = totalVotes > 0 ? (proposal.votes.abstain / totalVotes * 100).toFixed(2) : '0.00';
    
    // Check if quorum is reached
    const quorumReached = totalVotes >= this.config.quorum;
    
    // Determine if proposal is passing (simple majority)
    const isPassing = proposal.votes.for > proposal.votes.against;
    
    // Update status if voting period has ended
    const now = Date.now();
    if (proposal.status === 'active' && now > proposal.votingEnds) {
      if (quorumReached && isPassing) {
        proposal.status = 'passed';
        proposal.executionTime = now + this.config.timeLockPeriod;
      } else {
        proposal.status = quorumReached ? 'rejected' : 'failed_quorum';
      }
    }
    
    return {
      proposalId,
      title: proposal.title,
      status: proposal.status,
      votes: {
        for: proposal.votes.for,
        against: proposal.votes.against,
        abstain: proposal.votes.abstain,
        total: totalVotes,
        forPercentage,
        againstPercentage,
        abstainPercentage
      },
      quorum: {
        required: this.config.quorum,
        reached: quorumReached,
        percentage: (totalVotes / this.config.quorum * 100).toFixed(2)
      },
      timing: {
        created: proposal.createdAt,
        votingStarts: proposal.votingStarts,
        votingEnds: proposal.votingEnds,
        executionTime: proposal.executionTime || null
      },
      voterCount: proposal.voterCount,
      isPassing
    };
  }
  
  /**
   * Execute a passed proposal after timelock
   * @param {string} proposalId - ID of the proposal to execute
   * @param {string} executorDid - Decentralized identifier of the executor
   * @returns {Object} Execution result
   */
  executeProposal(proposalId, executorDid) {
    // Get the proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Check if proposal is passed
    if (proposal.status !== 'passed') {
      throw new Error(`Proposal ${proposalId} is not in passed state`);
    }
    
    // Check if timelock period has elapsed
    const now = Date.now();
    if (now < proposal.executionTime) {
      throw new Error(`Timelock period for proposal ${proposalId} has not elapsed yet`);
    }
    
    console.log(`Executing proposal ${proposalId} actions...`);
    
    // In a real implementation, we would execute each action in the proposal
    // Here we simulate successful execution
    
    // Record execution details
    const execution = {
      proposalId,
      executorDid,
      timestamp: now,
      actions: proposal.actions,
      result: 'success'
    };
    
    // Update proposal status
    proposal.status = 'executed';
    proposal.executedAt = now;
    
    // Store execution record
    this.executedProposals.set(proposalId, execution);
    
    return {
      proposalId,
      status: 'executed',
      executedAt: now,
      executorDid,
      result: 'success'
    };
  }
  
  /**
   * Cancel a proposal (only by proposer or governance admin)
   * @param {string} proposalId - ID of the proposal to cancel
   * @param {string} cancelerDid - Decentralized identifier of the canceler
   * @returns {Object} Cancellation result
   */
  cancelProposal(proposalId, cancelerDid) {
    // Get the proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    // Can only cancel active proposals
    if (proposal.status !== 'active') {
      throw new Error(`Proposal ${proposalId} is not in active state`);
    }
    
    // Check if canceler is the proposer
    const isProposer = proposal.proposerDid === cancelerDid;
    
    // In real implementation, we would also check if canceler is admin
    // For now, simulate admin check
    const isAdmin = false; // This would be a real check in production
    
    if (!isProposer && !isAdmin) {
      throw new Error('Only the proposer or an admin can cancel a proposal');
    }
    
    // Update proposal status
    proposal.status = 'cancelled';
    proposal.cancelledAt = Date.now();
    proposal.cancelledBy = cancelerDid;
    
    // Store cancellation record
    this.cancelledProposals.set(proposalId, {
      proposalId,
      cancelerDid,
      timestamp: proposal.cancelledAt,
      reason: 'Cancelled by proposer or admin'
    });
    
    console.log(`Proposal ${proposalId} cancelled by ${cancelerDid}`);
    
    return {
      proposalId,
      status: 'cancelled',
      cancelledAt: proposal.cancelledAt,
      cancelledBy: cancelerDid
    };
  }
  
  /**
   * List active proposals
   * @param {number} limit - Maximum number of proposals to return
   * @param {number} offset - Offset for pagination
   * @returns {Array} List of active proposals
   */
  listActiveProposals(limit = 10, offset = 0) {
    const activeProposals = [];
    const now = Date.now();
    
    // Collect all active proposals
    for (const proposal of this.proposals.values()) {
      if (proposal.status === 'active' && now <= proposal.votingEnds) {
        activeProposals.push({
          proposalId: proposal.id,
          title: proposal.title,
          proposerDid: proposal.proposerDid,
          votingEnds: proposal.votingEnds,
          timeRemaining: proposal.votingEnds - now,
          votes: proposal.votes,
          voterCount: proposal.voterCount
        });
      }
    }
    
    // Sort by most recent first
    activeProposals.sort((a, b) => b.votingEnds - a.votingEnds);
    
    // Apply pagination
    return activeProposals.slice(offset, offset + limit);
  }
  
  /**
   * Get detailed voting history for a proposal
   * @param {string} proposalId - ID of the proposal
   * @returns {Array} Voting history
   */
  getProposalVotingHistory(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    
    const votingHistory = [];
    
    // Collect all votes for this proposal
    for (const vote of this.votes.values()) {
      if (vote.proposalId === proposalId) {
        votingHistory.push({
          voterDid: vote.voterDid,
          direction: vote.direction,
          votingPower: vote.votingPower,
          timestamp: vote.timestamp
        });
      }
    }
    
    // Sort by timestamp (earliest first)
    votingHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    return votingHistory;
  }
}

module.exports = DAOGovernance; 