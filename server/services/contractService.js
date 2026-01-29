const { ethers } = require('ethers');

class ContractService {
  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Initialize wallet (admin wallet for deploying contracts)
    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    
    // USD-DF Token address
    this.usdDFAddress = process.env.USDDF_TOKEN_ADDRESS;
    
    // Factory deployer address
    this.factoryAddress = process.env.CREDITLINE_FACTORY_ADDRESS;
    
    // Contract ABIs (simplified for key functions)
    this.factoryABI = [
      "function deployPool(address _psp, address _usdDFToken, uint256 _creditLimit, uint256 _duration, uint256 _utilizedBips, uint256 _unutilizedBips) external returns (address)",
      "function getPoolsByPSP(address _psp) external view returns (address[])",
      "function getPoolCount() external view returns (uint256)",
      "function getAllPools() external view returns (address[])",
      "event PoolDeployed(address indexed poolAddress, address indexed psp, uint256 creditLimit, uint256 duration, uint256 timestamp)"
    ];
    
    this.creditLinePoolABI = [
      "constructor(address _admin, address _psp, address _usdDFToken, uint256 _creditLimit, uint256 _duration, uint256 _utilizedBips, uint256 _unutilizedBips)",
      "function drawdown(uint256 amount, string memory referenceId) external",
      "function repay(uint256 principal) external",
      "function fundPool(uint256 amount) external",
      "function getPoolStatus() external view returns (address, uint256, uint256, uint256, bool, uint256, uint256)",
      "function getRemainingCredit() external view returns (uint256)",
      "function pauseCreditLine() external",
      "function closeCreditLine() external",
      "event Drawdown(address indexed psp, uint256 amount, uint256 timestamp, string referenceId)",
      "event Repayment(address indexed psp, uint256 principal, uint256 interest, uint256 timestamp)"
    ];
    
    this.usdDFABI = [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() external view returns (uint8)"
    ];
  }

  /**
   * Deploy a new CreditLinePool contract via Factory
   */
  async deployCreditLinePool(pspAddress, creditLimit, duration, utilizedBips, unutilizedBips) {
    try {
      // Get factory contract instance
      const factory = new ethers.Contract(
        this.factoryAddress,
        this.factoryABI,
        this.adminWallet
      );

      // Convert credit limit to proper decimals (assuming 6 decimals for USD-DF)
      const creditLimitWei = ethers.parseUnits(creditLimit.toString(), 6);

      // Deploy via factory
      console.log('Deploying CreditLinePool via factory for PSP:', pspAddress);
      const tx = await factory.deployPool(
        pspAddress,
        this.usdDFAddress,
        creditLimitWei,
        duration,
        utilizedBips,
        unutilizedBips
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Get the deployed pool address from the event
      const poolDeployedEvent = receipt.logs.find(
        log => {
          try {
            const parsedLog = factory.interface.parseLog(log);
            return parsedLog && parsedLog.name === 'PoolDeployed';
          } catch {
            return false;
          }
        }
      );
      
      let contractAddress;
      if (poolDeployedEvent) {
        const parsedEvent = factory.interface.parseLog(poolDeployedEvent);
        contractAddress = parsedEvent.args.poolAddress;
      } else {
        throw new Error('PoolDeployed event not found in transaction receipt');
      }

      console.log(`CreditLinePool deployed at: ${contractAddress}`);

      return {
        success: true,
        contractAddress,
        transactionHash: tx.hash
      };
    } catch (error) {
      console.error('Contract deployment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fund a CreditLinePool with USD-DF tokens
   */
  async fundPool(poolAddress, amount) {
    try {
      const usdDF = new ethers.Contract(this.usdDFAddress, this.usdDFABI, this.adminWallet);
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Approve pool to spend USD-DF
      console.log('Approving USD-DF transfer...');
      const approveTx = await usdDF.approve(poolAddress, amountWei);
      await approveTx.wait();

      // Fund the pool
      const pool = new ethers.Contract(poolAddress, this.creditLinePoolABI, this.adminWallet);
      console.log('Funding pool...');
      const fundTx = await pool.fundPool(amountWei);
      
      // Wait for transaction with timeout (30 seconds)
      console.log('Waiting for funding transaction confirmation...');
      const receipt = await Promise.race([
        fundTx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout after 30 seconds')), 30000)
        )
      ]);

      console.log('Pool funded successfully! Block:', receipt.blockNumber);
      return {
        success: true,
        transactionHash: fundTx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Pool funding error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pool status from blockchain
   */
  async getPoolStatus(poolAddress) {
    try {
      const pool = new ethers.Contract(poolAddress, this.creditLinePoolABI, this.provider);
      const status = await pool.getPoolStatus();

      return {
        success: true,
        data: {
          psp: status[0],
          creditLimit: ethers.formatUnits(status[1], 6),
          utilizedAmount: ethers.formatUnits(status[2], 6),
          remainingCredit: ethers.formatUnits(status[3], 6),
          isActive: status[4],
          daysRemaining: status[5].toString(),
          poolBalance: ethers.formatUnits(status[6], 6)
        }
      };
    } catch (error) {
      console.error('Get pool status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute drawdown from creditline pool
   * Admin calls this function, funds go to pspWallet stored in contract
   */
  async drawdownFunds(poolAddress, amount, referenceId = 'ORDER-' + Date.now()) {
    try {
      // Admin wallet executes drawdown (consistent operator)
      const pool = new ethers.Contract(poolAddress, this.creditLinePoolABI, this.adminWallet);
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      console.log('Executing drawdown:', { poolAddress, amount, referenceId });
      const tx = await pool.drawdown(amountWei, referenceId);
      
      console.log('Waiting for drawdown transaction confirmation...');
      const receipt = await tx.wait();

      console.log('Drawdown successful! Block:', receipt.blockNumber);
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Drawdown error:', error);
      throw new Error(`Drawdown failed: ${error.message}`);
    }
  }

  /**
   * Monitor drawdown events
   */
  async monitorDrawdownEvents(poolAddress, callback) {
    try {
      const pool = new ethers.Contract(poolAddress, this.creditLinePoolABI, this.provider);
      
      pool.on('Drawdown', (psp, amount, timestamp, referenceId, event) => {
        callback({
          psp,
          amount: ethers.formatUnits(amount, 6),
          timestamp: timestamp.toString(),
          referenceId,
          transactionHash: event.log.transactionHash
        });
      });
    } catch (error) {
      console.error('Event monitoring error:', error);
    }
  }

  /**
   * PSP repays principal + interest on a credit line pool
   * @param {string} poolAddress - Address of the CreditLinePool contract
   * @param {number} principalAmount - Principal amount to repay (in USD-DF)
   * @param {number} interestAmount - Interest amount to pay (in USD-DF)
   * @returns {object} Transaction result
   */
  async repay(poolAddress, principalAmount, interestAmount) {
    try {
      console.log('Initiating repayment on pool:', poolAddress);
      console.log('Principal:', principalAmount, 'Interest:', interestAmount);

      // Convert amounts to wei (6 decimals for USD-DF)
      const principalWei = ethers.parseUnits(principalAmount.toString(), 6);
      const interestWei = ethers.parseUnits(interestAmount.toString(), 6);
      
      // Get pool contract instance with admin wallet
      const pool = new ethers.Contract(poolAddress, this.creditLinePoolABI, this.adminWallet);

      // First, approve the pool to spend USD-DF tokens (principal + interest)
      const totalAmount = principalWei + interestWei;
      const usddf = new ethers.Contract(this.usddfTokenAddress, this.usddfTokenABI, this.adminWallet);
      
      console.log('Approving USD-DF transfer...');
      const approveTx = await usddf.approve(poolAddress, totalAmount);
      await approveTx.wait();
      console.log('Approval confirmed');

      // Call repay function on the pool
      console.log('Calling repay function...');
      const tx = await pool.repay(principalWei, interestWei);
      
      console.log('Waiting for repayment transaction confirmation...');
      const receipt = await tx.wait();

      console.log(`Repayment successful! Tx Hash: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        principalAmount,
        interestAmount,
        totalRepayment: principalAmount + interestAmount
      };
    } catch (error) {
      console.error('Contract repayment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ContractService();
