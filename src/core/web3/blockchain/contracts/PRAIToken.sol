// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PRAI Token
 * @dev ERC20 token for the PrivAI Network ecosystem
 */
contract PRAIToken is ERC20, ERC20Burnable, Ownable {
    // Events
    event FeePercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    event FeeExemptStatusUpdated(address account, bool exemptStatus);
    event BurnOccurred(address indexed from, uint256 amount);

    // State variables
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens with 18 decimals
    uint256 public feePercentage = 0; // No fee on transfers by default
    uint256 public totalBurned = 0;
    
    // Fee exemptions for specific addresses
    mapping(address => bool) public isFeeExempt;
    
    // Reserved allocation settings
    uint256 public ecosystemAllocation;
    uint256 public developerAllocation;
    uint256 public liquidityAllocation;
    
    /**
     * @dev Constructor to initialize the PRAI token
     * @param initialOwner The address that will receive ownership of the contract
     */
    constructor(address initialOwner) ERC20("Privacy AI Token", "PRAI") Ownable(initialOwner) {
        // No initial minting - all tokens will be released through the fair launch
    }
    
    /**
     * @dev Launch the token with a fair distribution model
     * @param pumpFunAddress Address of the pump.fun contract for fair launch
     */
    function fairLaunch(address pumpFunAddress) external onlyOwner {
        require(totalSupply() == 0, "Token already launched");
        
        // 100% of tokens to fair launch via pump.fun
        _mint(pumpFunAddress, MAX_SUPPLY);
    }
    
    /**
     * @dev Set the fee percentage for transfers (for deflationary mechanism)
     * @param newFeePercentage New fee percentage (0-5%, expressed as basis points)
     */
    function setFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 500, "Fee cannot exceed 5%");
        
        uint256 oldFeePercentage = feePercentage;
        feePercentage = newFeePercentage;
        
        emit FeePercentageUpdated(oldFeePercentage, newFeePercentage);
    }
    
    /**
     * @dev Set fee exemption status for an address
     * @param account Address to update exemption status
     * @param exempt Whether the address should be exempt from fees
     */
    function setFeeExemptStatus(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
        
        emit FeeExemptStatusUpdated(account, exempt);
    }
    
    /**
     * @dev Override to implement fee on transfers for deflationary mechanism
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (feePercentage > 0 && 
            from != address(0) && // Exclude minting
            to != address(0) &&   // Exclude burning
            !isFeeExempt[from] && // Check if sender is exempt
            !isFeeExempt[to])     // Check if recipient is exempt
        {
            uint256 feeAmount = (amount * feePercentage) / 10000; // Fee in basis points
            uint256 transferAmount = amount - feeAmount;
            
            // Burn the fee
            super._update(from, address(0), feeAmount);
            
            // Transfer the remaining amount
            super._update(from, to, transferAmount);
            
            // Track burned tokens
            totalBurned += feeAmount;
            
            // Emit burn event
            emit BurnOccurred(from, feeAmount);
        } else {
            // Standard transfer without fee
            super._update(from, to, amount);
        }
    }
} 