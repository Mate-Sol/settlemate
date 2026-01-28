// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreditLinePool.sol";

/**
 * @title CreditLinePoolDeployer
 * @dev Factory contract to deploy CreditLinePool instances
 * Only admin (owner) can deploy new pools
 */
contract CreditLinePoolDeployer {
    address public owner;
    
    // Array to store all deployed pool addresses
    address[] public deployedPools;
    
    // Mapping from PSP address to their pool addresses
    mapping(address => address[]) public pspToPools;
    
    // Events
    event PoolDeployed(
        address indexed poolAddress,
        address indexed psp,
        uint256 creditLimit,
        uint256 duration,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Deploy a new CreditLinePool contract
     * @param _psp Address of the PSP (borrower)
     * @param _usdDFToken Address of the USD-DF stablecoin token
     * @param _creditLimit Total credit limit in wei (with token decimals)
     * @param _duration Duration in days
     * @param _utilizedBips Utilized rate in basis points per day
     * @param _unutilizedBips Unutilized rate in basis points per day
     * @return poolAddress Address of the newly deployed pool
     */
    function deployPool(
        address _psp,
        address _usdDFToken,
        uint256 _creditLimit,
        uint256 _duration,
        uint256 _utilizedBips,
        uint256 _unutilizedBips
    ) external onlyOwner returns (address poolAddress) {
        // Deploy new CreditLinePool contract with owner as admin
        CreditLinePool newPool = new CreditLinePool(
            owner,  // Pass factory owner as the pool admin
            _psp,
            _usdDFToken,
            _creditLimit,
            _duration,
            _utilizedBips,
            _unutilizedBips
        );
        
        poolAddress = address(newPool);
        
        // Track the deployed pool
        deployedPools.push(poolAddress);
        pspToPools[_psp].push(poolAddress);
        
        // Emit event
        emit PoolDeployed(
            poolAddress,
            _psp,
            _creditLimit,
            _duration,
            block.timestamp
        );
        
        return poolAddress;
    }
    
    /**
     * @dev Get all pools deployed for a specific PSP
     * @param _psp PSP address
     * @return Array of pool addresses
     */
    function getPoolsByPSP(address _psp) external view returns (address[] memory) {
        return pspToPools[_psp];
    }
    
    /**
     * @dev Get total number of deployed pools
     * @return Total count of pools
     */
    function getPoolCount() external view returns (uint256) {
        return deployedPools.length;
    }
    
    /**
     * @dev Get all deployed pool addresses
     * @return Array of all pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return deployedPools;
    }
    
    /**
     * @dev Get pool address by index
     * @param index Index in the deployedPools array
     * @return Pool address
     */
    function getPoolByIndex(uint256 index) external view returns (address) {
        require(index < deployedPools.length, "Index out of bounds");
        return deployedPools[index];
    }
    
    /**
     * @dev Transfer ownership to new owner
     * @param newOwner Address of new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
}
