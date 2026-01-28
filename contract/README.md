# CreditLine Pool Smart Contract

This folder contains the Solidity smart contracts for on-demand credit line pools deployed on Sepolia testnet, using USD-DF stablecoin.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure your `.env` file with:
   - `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
   - `PRIVATE_KEY`: Your wallet private key (admin/CRO wallet)
   - `ETHERSCAN_API_KEY`: For contract verification
   - `USDDF_TOKEN_ADDRESS`: USD-DF stablecoin address on Sepolia

## Contracts Overview

### USDDF.sol
Mock USD-DF stablecoin (ERC20) token for testing:
- **Name**: DeFa USD
- **Symbol**: USD-DF  
- **Decimals**: 6 (USDC-like)
- **Initial Supply**: 10,000,000 USD-DF to deployer
- **Functions**: mint (admin), burn, standard ERC20

### CreditLinePool.sol
Manages individual PSP credit lines with USD-DF token:
- Credit limit management
- **Drawdown**: Transfers USD-DF tokens to PSP wallet
- **Repayment**: Receives USD-DF tokens (principal + interest) from PSP
- Interest calculation (utilized rate: 5 bps/day)
- Unutilized fee calculation (1 bps/day)
- Time-bound credit facility (expiry after duration)
- **Fund Pool**: Admin deposits USD-DF liquidity
- **Collect Fees**: Admin collects unutilized fees

## Testing

Run tests locally:
```bash
npx hardhat test
```

## Deployment Workflow

### Step 1: Deploy USD-DF Token (for testing)
```bash
npx hardhat run scripts/deploy-token.js --network sepolia
```
Save the token address to `.env` as `USDDF_TOKEN_ADDRESS`.

### Step 2: Deploy CreditLinePool
Set environment variables and deploy:
```bash
PSP_ADDRESS=0x... CREDIT_LIMIT=500000 DURATION=90 npx hardhat run scripts/deploy.js --network sepolia
```

### Step 3: Fund the Pool
Admin must deposit USD-DF tokens before PSP can drawdown:
```javascript
// Approve CreditLinePool to spend USD-DF
await usdDF.approve(creditLinePoolAddress, amount);

// Fund the pool
await creditLinePool.fundPool(amount);
```

## Contract Functions

### PSP Functions
- `drawdown(amount, referenceId)`: Borrow USD-DF against order book reference
- `repay(principal)`: Repay borrowed USD-DF with interest

### View Functions
- `getRemainingCredit()`: Get available credit
- `getPoolStatus()`: Get comprehensive pool info (includes USD-DF balance)
- `calculateInterest(amount)`: Preview interest on amount
- `calculateUnutilizedFee()`: Preview unutilized fees
- `getTokenAddress()`: Get USD-DF token address

### Admin Functions (CRO)
- `fundPool(amount)`: Deposit USD-DF liquidity into pool
- `collectFees()`: Collect unutilized fees
- `pauseCreditLine()`: Emergency pause
- `reactivateCreditLine()`: Reactivate paused line
- `closeCreditLine()`: Close expired & fully repaid line (returns remaining USD-DF)

## Integration with Backend

When CRO approves a PSP application, the backend should:
1. Deploy new CreditLinePool contract with approved parameters + USD-DF address
2. Fund the pool with sufficient USD-DF liquidity (call `fundPool`)
3. Store contract address in database linked to PSP
4. PSP can then call `drawdown()` via backend validation
5. PSP must approve CreditLinePool to spend USD-DF before calling `repay()`

## USD-DF Token Addresses

**Sepolia Testnet**: Set in your `.env` file after deployment
**Mainnet**: TBD (will be the actual DeFa stablecoin)



Deploying CreditLinePool contract...
Deployment Parameters:
PSP Address: 0xc6febB12613498287dc7B414ae59BCd455bfA24F
USD-DF Token: 0xE2853C79cc6761eFFEAdF15f4199f843aa4B3E37
Credit Limit: 500000.0 USD-DF
Duration: 90 days
Utilized Rate: 5 bps/day
Unutilized Rate: 1 bps/day

✅ CreditLinePool deployed to: 0x5a0032ab86beCd65c2b832b4763A0175b80c2A40

Pool Status:
PSP: 0xc6febB12613498287dc7B414ae59BCd455bfA24F
Credit Limit: 500000.0 USD-DF
Utilized Amount: 0.0 USD-DF
Remaining Credit: 500000.0 USD-DF
Is Active: true
Days Remaining: 90
Pool USD-DF Balance: 0.0 USD-DF

📄 Deployment Info: {
  "network": "sepolia",
  "contractAddress": "0x5a0032ab86beCd65c2b832b4763A0175b80c2A40",
  "pspAddress": "0xc6febB12613498287dc7B414ae59BCd455bfA24F",
  "usdDFTokenAddress": "0xE2853C79cc6761eFFEAdF15f4199f843aa4B3E37",
  "creditLimit": "500000.0",
  "duration": "90",
  "utilizedBips": "5",
  "unutilizedBips": "1",
  "deployedAt": "2026-01-28T10:00:27.710Z"
}


