// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DataRegistry
 * @dev Smart contract for registering and managing data ownership and access permissions
 * in the PrivAI Network ecosystem.
 */
contract DataRegistry is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // Events
    event DataRegistered(address indexed owner, bytes32 dataId, bytes32 metadataHash);
    event AccessGranted(address indexed owner, address indexed grantee, bytes32 dataId, uint256 expiration);
    event AccessRevoked(address indexed owner, address indexed grantee, bytes32 dataId);
    event RewardDistributed(address indexed recipient, bytes32 dataId, uint256 amount);
    event DataQualityUpdated(bytes32 indexed dataId, uint256 newQualityScore);
    
    // Data struct
    struct DataRecord {
        address owner;
        bytes32 metadataHash;      // Hash of off-chain metadata (IPFS hash, description, etc.)
        uint256 registrationTime;
        uint256 qualityScore;      // Data quality score (0-100)
        bool exists;
        string dataType;           // Type of data (e.g., "medical", "financial", "iot")
        string encryptionType;     // Type of encryption used
    }
    
    // Access permission struct
    struct AccessPermission {
        bool hasAccess;
        uint256 expirationTime;
        string accessType;         // E.g., "read", "compute", "full"
        bytes32 termsHash;         // Hash of access terms
    }
    
    // Contributor rewards tracking
    struct ContributorRewards {
        uint256 totalRewarded;
        uint256 lastRewardTime;
        uint256 contributionCount;
    }
    
    // Data registry mapping: dataId => DataRecord
    mapping(bytes32 => DataRecord) public dataRegistry;
    
    // Access permissions mapping: dataId => grantee address => AccessPermission
    mapping(bytes32 => mapping(address => AccessPermission)) public accessPermissions;
    
    // Contributor rewards mapping: contributor address => ContributorRewards
    mapping(address => ContributorRewards) public contributorRewards;
    
    // Trusted sources mapping: address => bool
    mapping(address => bool) public trustedSources;
    
    // Registry stats
    uint256 public totalDataRecords;
    uint256 public totalAccessGrants;
    
    /**
     * @dev Constructor to initialize the DataRegistry
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // Initialize with the contract deployer as the first trusted source
        trustedSources[initialOwner] = true;
    }
    
    /**
     * @dev Modifier to check if a data record exists
     */
    modifier dataExists(bytes32 dataId) {
        require(dataRegistry[dataId].exists, "Data does not exist");
        _;
    }
    
    /**
     * @dev Modifier to check if caller is the data owner
     */
    modifier onlyDataOwner(bytes32 dataId) {
        require(dataRegistry[dataId].owner == msg.sender, "Not the data owner");
        _;
    }
    
    /**
     * @dev Add or remove a trusted source
     * @param source Address to set as trusted or untrusted
     * @param isTrusted Whether the address should be trusted
     */
    function setTrustedSource(address source, bool isTrusted) external onlyOwner {
        trustedSources[source] = isTrusted;
    }
    
    /**
     * @dev Register new data in the registry
     * @param dataId Unique identifier for the data
     * @param metadataHash Hash of the data metadata
     * @param dataType Type of data being registered
     * @param encryptionType Type of encryption used
     */
    function registerData(
        bytes32 dataId,
        bytes32 metadataHash,
        string memory dataType,
        string memory encryptionType
    ) external {
        require(!dataRegistry[dataId].exists, "Data ID already registered");
        
        // Create and store the data record
        dataRegistry[dataId] = DataRecord({
            owner: msg.sender,
            metadataHash: metadataHash,
            registrationTime: block.timestamp,
            qualityScore: 0, // Initially unrated
            exists: true,
            dataType: dataType,
            encryptionType: encryptionType
        });
        
        // Update stats
        totalDataRecords++;
        
        // Update contributor stats
        contributorRewards[msg.sender].contributionCount++;
        
        emit DataRegistered(msg.sender, dataId, metadataHash);
    }
    
    /**
     * @dev Grant access to data for a specific address
     * @param dataId Identifier of the data
     * @param grantee Address to grant access to
     * @param expirationTime When the access expires (0 for no expiration)
     * @param accessType Type of access granted
     * @param termsHash Hash of the access terms
     */
    function grantAccess(
        bytes32 dataId,
        address grantee,
        uint256 expirationTime,
        string memory accessType,
        bytes32 termsHash
    ) external dataExists(dataId) onlyDataOwner(dataId) {
        require(grantee != address(0), "Invalid grantee address");
        
        // Set access permission
        accessPermissions[dataId][grantee] = AccessPermission({
            hasAccess: true,
            expirationTime: expirationTime,
            accessType: accessType,
            termsHash: termsHash
        });
        
        totalAccessGrants++;
        
        emit AccessGranted(msg.sender, grantee, dataId, expirationTime);
    }
    
    /**
     * @dev Revoke access to data for a specific address
     * @param dataId Identifier of the data
     * @param grantee Address to revoke access from
     */
    function revokeAccess(bytes32 dataId, address grantee) 
        external 
        dataExists(dataId) 
        onlyDataOwner(dataId) 
    {
        require(accessPermissions[dataId][grantee].hasAccess, "Grantee has no access");
        
        // Remove access
        accessPermissions[dataId][grantee].hasAccess = false;
        
        emit AccessRevoked(msg.sender, grantee, dataId);
    }
    
    /**
     * @dev Check if an address has access to specific data
     * @param dataId Identifier of the data
     * @param grantee Address to check access for
     * @return Whether the address has valid access
     */
    function hasValidAccess(bytes32 dataId, address grantee) public view returns (bool) {
        AccessPermission memory permission = accessPermissions[dataId][grantee];
        
        // Check if access is granted and not expired
        return permission.hasAccess && 
               (permission.expirationTime == 0 || permission.expirationTime >= block.timestamp);
    }
    
    /**
     * @dev Update data quality score (only callable by trusted sources)
     * @param dataId Identifier of the data
     * @param newQualityScore New quality score (0-100)
     */
    function updateDataQuality(bytes32 dataId, uint256 newQualityScore) 
        external 
        dataExists(dataId) 
    {
        require(trustedSources[msg.sender], "Not a trusted source");
        require(newQualityScore <= 100, "Quality score must be between 0-100");
        
        dataRegistry[dataId].qualityScore = newQualityScore;
        
        emit DataQualityUpdated(dataId, newQualityScore);
    }
    
    /**
     * @dev Distribute rewards to data contributors (e.g., from compute tasks)
     * @param recipient Address of the recipient
     * @param dataId Identifier of the data that earned the reward
     * @param amount Amount of reward (in wei)
     */
    function distributeReward(address recipient, bytes32 dataId, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(recipient != address(0), "Invalid recipient");
        require(dataRegistry[dataId].exists, "Data does not exist");
        require(dataRegistry[dataId].owner == recipient, "Recipient is not the data owner");
        
        // Update reward tracking
        contributorRewards[recipient].totalRewarded += amount;
        contributorRewards[recipient].lastRewardTime = block.timestamp;
        
        // Emit event
        emit RewardDistributed(recipient, dataId, amount);
        
        // Note: Actual token transfer would be handled separately
    }
    
    /**
     * @dev Get detailed information about a data record
     * @param dataId Identifier of the data
     */
    function getDataDetails(bytes32 dataId) 
        external 
        view 
        dataExists(dataId) 
        returns (
            address owner,
            bytes32 metadataHash,
            uint256 registrationTime,
            uint256 qualityScore,
            string memory dataType,
            string memory encryptionType
        ) 
    {
        DataRecord memory record = dataRegistry[dataId];
        
        return (
            record.owner,
            record.metadataHash,
            record.registrationTime,
            record.qualityScore,
            record.dataType,
            record.encryptionType
        );
    }
    
    /**
     * @dev Get access permission details
     * @param dataId Identifier of the data
     * @param grantee Address of the grantee
     */
    function getAccessDetails(bytes32 dataId, address grantee) 
        external 
        view 
        returns (
            bool hasAccess,
            uint256 expirationTime,
            string memory accessType,
            bytes32 termsHash
        ) 
    {
        AccessPermission memory permission = accessPermissions[dataId][grantee];
        
        return (
            permission.hasAccess,
            permission.expirationTime,
            permission.accessType,
            permission.termsHash
        );
    }
    
    /**
     * @dev Get contributor reward information
     * @param contributor Address of the contributor
     */
    function getContributorStats(address contributor) 
        external 
        view 
        returns (
            uint256 totalRewarded,
            uint256 lastRewardTime,
            uint256 contributionCount
        ) 
    {
        ContributorRewards memory rewards = contributorRewards[contributor];
        
        return (
            rewards.totalRewarded,
            rewards.lastRewardTime,
            rewards.contributionCount
        );
    }
} 