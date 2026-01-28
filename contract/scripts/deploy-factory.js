import hre from "hardhat";

async function main() {
  console.log("Deploying CreditLinePoolDeployer factory contract...");

  // Deploy factory contract
  const CreditLinePoolDeployer = await hre.ethers.getContractFactory("CreditLinePoolDeployer");
  const factory = await CreditLinePoolDeployer.deploy();

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("\n✅ CreditLinePoolDeployer factory deployed to:", factoryAddress);
  
  // Get owner
  const owner = await factory.owner();
  console.log("Factory Owner:", owner);
  
  // Get initial stats
  const poolCount = await factory.getPoolCount();
  console.log("Initial Pool Count:", poolCount.toString());

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    factoryAddress: factoryAddress,
    owner: owner,
    deployedAt: new Date().toISOString()
  };

  console.log("\n📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n⚠️ IMPORTANT: Update your .env file with:");
  console.log(`CREDITLINE_FACTORY_ADDRESS=${factoryAddress}`);
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update .env with CREDITLINE_FACTORY_ADDRESS");
  console.log("2. Restart your backend server");
  console.log("3. Use the CRO approval endpoint to deploy new pools via the factory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
