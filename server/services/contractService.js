const { ethers } = require('ethers');

class ContractService {
  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Initialize wallet (admin wallet for deploying contracts)
    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    
    // USD-DF Token address
    this.usdDFAddress = process.env.USDDF_TOKEN_ADDRESS;
    
    // Contract ABIs (simplified for key functions)
    this.creditLinePoolABI = [
      "constructor(address _psp, address _usdDFToken, uint256 _creditLimit, uint256 _duration, uint256 _utilizedBips, uint256 _unutilizedBips)",
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
   * Deploy a new CreditLinePool contract
   */
  async deployCreditLinePool(pspAddress, creditLimit, duration, utilizedBips, unutilizedBips) {
    try {
      // Load contract factory
      const CreditLinePool = new ethers.ContractFactory(
        this.creditLinePoolABI,
        require('../../contract/artifacts/contracts/CreditLinePool.sol/CreditLinePool.json').bytecode,
        this.adminWallet
      );

      // Convert credit limit to proper decimals (assuming 6 decimals for USD-DF)
      const creditLimitWei = ethers.parseUnits(creditLimit.toString(), 6);

      // Deploy contract
      console.log('Deploying CreditLinePool contract...');
      const contract = await CreditLinePool.deploy(
        pspAddress,
        this.usdDFAddress,
        creditLimitWei,
        duration,
        utilizedBips,
        unutilizedBips
      );

      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      console.log(`CreditLinePool deployed at: ${contractAddress}`);

      return {
        success: true,
        contractAddress,
        transactionHash: contract.deploymentTransaction().hash
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
      await fundTx.wait();

      return {
        success: true,
        transactionHash: fundTx.hash
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
}

module.exports = new ContractService();
