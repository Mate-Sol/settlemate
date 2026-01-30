import hre from "hardhat";

async function main() {
  console.log("Deploying CreditLinePool contract...");

  // Get deployment parameters
  const PSP_ADDRESS = process.env.PSP_ADDRESS || "0x0000000000000000000000000000000000000000";
  const USDDF_TOKEN_ADDRESS = process.env.USDDF_TOKEN_ADDRESS;
  
  if (!USDDF_TOKEN_ADDRESS || USDDF_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("ERROR: USDDF_TOKEN_ADDRESS not set in environment variables");
    console.log("Please set USDDF_TOKEN_ADDRESS in your .env file");
    process.exit(1);
  }

  const CREDIT_LIMIT = hre.ethers.parseUnits(process.env.CREDIT_LIMIT || "500000", 6); // Default 500k USDC (6 decimals)
  const DURATION = process.env.DURATION || 90; // Default 90 days
  const UTILIZED_BIPS = process.env.UTILIZED_BIPS || 5; // 5 basis points per day
  const UNUTILIZED_BIPS = process.env.UNUTILIZED_BIPS || 1; // 1 basis point per day

  console.log("Deployment Parameters:");
  console.log("PSP Address:", PSP_ADDRESS);
  console.log("USD-DF Token:", USDDF_TOKEN_ADDRESS);
  console.log("Credit Limit:", hre.ethers.formatUnits(CREDIT_LIMIT, 6), "USD-DF");
  console.log("Duration:", DURATION, "days");
  console.log("Utilized Rate:", UTILIZED_BIPS, "bps/day");
  console.log("Unutilized Rate:", UNUTILIZED_BIPS, "bps/day");

  // Deploy contract
  const CreditLinePool = await hre.ethers.getContractFactory("CreditLinePool");
  const creditLinePool = await CreditLinePool.deploy(
    "0x07bFa2e2327b2b669347b6FD2aEb855eA9659b95",
    PSP_ADDRESS,
    USDDF_TOKEN_ADDRESS,
    CREDIT_LIMIT,
    DURATION,
    UTILIZED_BIPS,
    UNUTILIZED_BIPS

    //  address _admin,
    //     address _pspWallet,
    //     address _usdDFToken,
    //     uint256 _creditLimit,
    //     uint256 _duration,
    //     uint256 _utilizedBips,
    //     uint256 _unutilizedBips
  );

  await creditLinePool.waitForDeployment();

  const contractAddress = await creditLinePool.getAddress();
  console.log("\n✅ CreditLinePool deployed to:", contractAddress);
  
  // Get pool status
  const poolStatus = await creditLinePool.getPoolStatus();
  console.log("\nPool Status:");
  console.log("PSP:", poolStatus[0]);
  console.log("Credit Limit:", hre.ethers.formatUnits(poolStatus[1], 6), "USD-DF");
  console.log("Utilized Amount:", hre.ethers.formatUnits(poolStatus[2], 6), "USD-DF");
  console.log("Remaining Credit:", hre.ethers.formatUnits(poolStatus[3], 6), "USD-DF");
  console.log("Is Active:", poolStatus[4]);
  console.log("Days Remaining:", poolStatus[5].toString());
  console.log("Pool USD-DF Balance:", hre.ethers.formatUnits(poolStatus[6], 6), "USD-DF");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    pspAddress: PSP_ADDRESS,
    usdDFTokenAddress: USDDF_TOKEN_ADDRESS,
    creditLimit: hre.ethers.formatUnits(CREDIT_LIMIT, 6),
    duration: DURATION,
    utilizedBips: UTILIZED_BIPS,
    unutilizedBips: UNUTILIZED_BIPS,
    deployedAt: new Date().toISOString()
  };

  console.log("\n📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
  
console.log("\n⚠️ IMPORTANT: Admin must fund the pool before PSP can drawdown!");
  console.log("Run: creditLinePool.fundPool(amount) with sufficient USD-DF tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
