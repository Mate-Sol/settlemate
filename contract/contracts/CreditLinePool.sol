// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreditLinePool
 * @dev On-demand credit pool deployed when CRO approves a PSP's financing limit.
 * Manages credit limit, drawdowns, repayments, and fee calculations using USD-DF stablecoin.
 */
contract CreditLinePool {
    using SafeERC20 for IERC20;

    // State variables
    address public admin;           // Admin (CRO) who deployed and manages the pool
    address public pspWallet;        // PSP wallet address (recipient of funds)
    IERC20 public usdDF;             // USD-DF stablecoin token
    uint256 public creditLimit;      // Total approved credit limit
    uint256 public utilizedAmount;   // Currently utilized (borrowed) amount
    uint256 public duration;         // Duration in days
    uint256 public utilizedBips;     // Utilized rate in basis points per day (e.g., 5 bps)
    uint256 public unutilizedBips;   // Unutilized rate in basis points per day (e.g., 1 bps)
    uint256 public deploymentTime;   // Timestamp when contract was deployed
    uint256 public expiryTime;       // Timestamp when credit line expires
    bool public isActive;            // Contract status
    
    // Events
    event Drawdown(address indexed pspWallet, uint256 amount, uint256 timestamp, string referenceId);
    event Repayment(
        address indexed pspWallet, 
        uint256 principal, 
        uint256 actualInterest, 
        uint256 expectedInterest, 
        uint256 timestamp
    );
    event CreditLineActivated(address indexed pspWallet, uint256 creditLimit, uint256 duration);
    event CreditLineClosed(uint256 timestamp);
    event FeesCollected(uint256 utilizedFees, uint256 unutilizedFees, uint256 timestamp);
    event MaintenanceFeePaid(address indexed pspWallet, uint256 amount, uint256 timestamp);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier isActiveCreditLine() {
        require(isActive, "Credit line is not active");
        require(block.timestamp < expiryTime, "Credit line has expired");
        _;
    }

    /**
     * @dev Constructor to initialize the credit line pool
     * @param _admin Address of the admin who will manage this pool (calls drawdown)
     * @param _pspWallet Address of the PSP wallet (receives funds from drawdown)
     * @param _usdDFToken Address of the USD-DF stablecoin token
     * @param _creditLimit Total credit limit in wei (with token decimals)
     * @param _duration Duration in days
     * @param _utilizedBips Utilized rate in basis points per day
     * @param _unutilizedBips Unutilized rate in basis points per day
     */
    constructor(
        address _admin,
        address _pspWallet,
        address _usdDFToken,
        uint256 _creditLimit,
        uint256 _duration,
        uint256 _utilizedBips,
        uint256 _unutilizedBips
    ) {
        require(_admin != address(0), "Invalid admin address");
        require(_pspWallet != address(0), "Invalid PSP wallet address");
        require(_usdDFToken != address(0), "Invalid token address");
        require(_creditLimit > 0, "Credit limit must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        admin = _admin;
        pspWallet = _pspWallet;
        usdDF = IERC20(_usdDFToken);
        creditLimit = _creditLimit;
        duration = _duration;
        utilizedBips = _utilizedBips;
        unutilizedBips = _unutilizedBips;
        deploymentTime = block.timestamp;
        expiryTime = block.timestamp + (_duration * 1 days);
        isActive = true;
        utilizedAmount = 0;

        emit CreditLineActivated(_pspWallet, _creditLimit, _duration);
    }

    /**
     * @dev Admin executes drawdown on behalf of PSP (sends funds to PSP wallet)
     * @param amount Amount to draw (in USD-DF tokens with decimals)
     * @param referenceId Order book reference ID for validation
     */
    function drawdown(uint256 amount, string memory referenceId) 
        external 
        onlyAdmin 
        isActiveCreditLine 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(utilizedAmount + amount <= creditLimit, "Exceeds credit limit");
        
        // Check if contract has sufficient USD-DF balance
        uint256 contractBalance = usdDF.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient USD-DF liquidity in pool");
        
        utilizedAmount += amount;
        
        // Transfer USD-DF tokens to PSP wallet
        usdDF.safeTransfer(pspWallet, amount);
        
        emit Drawdown(pspWallet, amount, block.timestamp, referenceId);
    }

    /**
     * @dev PSP repays borrowed amount with interest (called from PSP wallet)
     * @param principal Principal amount to repay
     * @param interestAmount Actual interest amount PSP is paying (can differ from expected)
     */
    function repay(uint256 principal, uint256 interestAmount) external {
        require(msg.sender == pspWallet, "Only PSP wallet can repay");
        require(principal > 0, "Principal must be greater than 0");
        require(principal <= utilizedAmount, "Repayment exceeds utilized amount");
        
        uint256 expectedInterest = calculateInterest(principal);
        uint256 totalRepayment = principal + interestAmount;
        
        // Transfer USD-DF tokens from msg.sender (PSP wallet) to contract
        // msg.sender is already validated to be pspWallet via require check above
        usdDF.safeTransferFrom(msg.sender, address(this), totalRepayment);
        
        utilizedAmount -= principal;
        
        emit Repayment(pspWallet, principal, interestAmount, expectedInterest, block.timestamp);
    }

    /**
     * @dev Calculate interest on a given amount based on utilized rate
     * @param amount Amount to calculate interest for
     * @return interest Interest amount in wei
     */
    function calculateInterest(uint256 amount) public view returns (uint256) {
        uint256 daysElapsed = (block.timestamp - deploymentTime) / 1 days;
        if (daysElapsed > duration) {
            daysElapsed = duration;
        }
        
        // Interest = amount * utilizedBips * daysElapsed / 10000
        uint256 interest = (amount * utilizedBips * daysElapsed) / 10000;
        return interest;
    }

    /**
     * @dev Calculate unutilized fees on the unused portion of credit
     * @return unutilizedFee Fee for unutilized portion
     */
    function calculateUnutilizedFee() public view returns (uint256) {
        uint256 daysElapsed = (block.timestamp - deploymentTime) / 1 days;
        if (daysElapsed > duration) {
            daysElapsed = duration;
        }
        
        uint256 unutilizedPortion = creditLimit - utilizedAmount;
        // Fee = unutilizedPortion * unutilizedBips * daysElapsed / 10000
        uint256 fee = (unutilizedPortion * unutilizedBips * daysElapsed) / 10000;
        return fee;
    }

    /**
     * @dev Get remaining credit available for drawdown
     * @return remaining Remaining credit amount
     */
    function getRemainingCredit() external view returns (uint256) {
        return creditLimit - utilizedAmount;
    }

    /**
     * @dev Get pool status information
     * @return _pspWallet PSP wallet address
     * @return _creditLimit Total credit limit
     * @return _utilizedAmount Currently utilized amount
     * @return _remainingCredit Remaining available credit
     * @return _isActive Contract status
     * @return _daysRemaining Days until expiry
     * @return _poolBalance Current USD-DF balance in pool
     */
    function getPoolStatus() 
        external 
        view 
        returns (
            address _pspWallet,
            uint256 _creditLimit,
            uint256 _utilizedAmount,
            uint256 _remainingCredit,
            bool _isActive,
            uint256 _daysRemaining,
            uint256 _poolBalance
        ) 
    {
        uint256 daysRemaining = 0;
        if (block.timestamp < expiryTime) {
            daysRemaining = (expiryTime - block.timestamp) / 1 days;
        }

        return (
            pspWallet,
            creditLimit,
            utilizedAmount,
            creditLimit - utilizedAmount,
            isActive,
            daysRemaining,
            usdDF.balanceOf(address(this))
        );
    }

    /**
     * @dev Admin funds the pool with USD-DF tokens
     * @param amount Amount of USD-DF to deposit
     */
    function fundPool(uint256 amount) external onlyAdmin {
        require(amount > 0, "Amount must be greater than 0");
        usdDF.safeTransferFrom(admin, address(this), amount);
    }

    /**
     * @dev Collect unutilized fees (admin only)
     */
    function collectFees() external onlyAdmin {
        uint256 unutilizedFee = calculateUnutilizedFee();
        
        if (unutilizedFee > 0) {
            uint256 contractBalance = usdDF.balanceOf(address(this));
            require(contractBalance >= unutilizedFee, "Insufficient balance for fee collection");
            
            usdDF.safeTransfer(admin, unutilizedFee);
            emit FeesCollected(0, unutilizedFee, block.timestamp);
        }
    }

    /**
     * @dev PSP pays credit line maintenance fee (called separately from loan repayment)
     * @param maintenanceFeeAmount Amount of maintenance fee to pay
     * NOTE: This is for periodic (weekly/monthly) credit line maintenance charges
     * This is separate from loan interest which is paid via repay() function
     */
    function payMaintenanceFee(uint256 maintenanceFeeAmount) external {
        require(msg.sender == pspWallet, "Only PSP wallet can pay maintenance fee");
        require(maintenanceFeeAmount > 0, "Fee amount must be greater than 0");
        
        // Transfer USD-DF tokens from PSP wallet to contract
        usdDF.safeTransferFrom(msg.sender, address(this), maintenanceFeeAmount);
        
        emit MaintenanceFeePaid(pspWallet, maintenanceFeeAmount, block.timestamp);
    }

    /**
     * @dev Close credit line (only when fully repaid and expired)
     */
    function closeCreditLine() external onlyAdmin {
        require(block.timestamp >= expiryTime, "Credit line has not expired");
        require(utilizedAmount == 0, "Outstanding balance must be zero");
        
        isActive = false;
        
        // Return remaining USD-DF to admin
        uint256 remainingBalance = usdDF.balanceOf(address(this));
        if (remainingBalance > 0) {
            usdDF.safeTransfer(admin, remainingBalance);
        }
        
        emit CreditLineClosed(block.timestamp);
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pauseCreditLine() external onlyAdmin {
        isActive = false;
    }

    /**
     * @dev Reactivate credit line (admin only)
     */
    function reactivateCreditLine() external onlyAdmin {
        require(block.timestamp < expiryTime, "Cannot reactivate expired credit line");
        isActive = true;
    }

    /**
     * @dev Get USD-DF token address
     * @return Token address
     */
    function getTokenAddress() external view returns (address) {
        return address(usdDF);
    }

    /**
     * @dev Check if credit line has expired
     */
    function isExpired() external view returns (bool) {
        return block.timestamp > expiryTime;
    }

    /**
     * @dev Get remaining days until expiry
     */
    function getRemainingDays() external view returns (uint256) {
        if (block.timestamp >= expiryTime) {
            return 0;
        }
        return (expiryTime - block.timestamp) / 86400; // Convert seconds to days
    }

    /**
     * @dev Get days since deployment
     */
    function getDaysSinceDeployment() external view returns (uint256) {
        return (block.timestamp - deploymentTime) / 86400;
    }
}
