import hre from "hardhat";

async function main() {
  console.log("Deploying USD-DF Mock Token...");

  // Deploy USD-DF token
  const USDDF = await hre.ethers.getContractFactory("USDDF");
  const usdDF = await USDDF.deploy();

  await usdDF.waitForDeployment();

  const tokenAddress = await usdDF.getAddress();
  console.log("✅ USD-DF Token deployed to:", tokenAddress);

  const [deployer] = await hre.ethers.getSigners();
  const balance = await usdDF.balanceOf(deployer.address);
  const decimals = await usdDF.decimals();

  console.log("\nToken Info:");
  console.log("Name:", await usdDF.name());
  console.log("Symbol:", await usdDF.symbol());
  console.log("Decimals:", decimals.toString());
  console.log("Initial Supply:", hre.ethers.formatUnits(balance, decimals), "USD-DF");
  console.log("Deployer Balance:", hre.ethers.formatUnits(balance, decimals), "USD-DF");

  console.log("\n📝 Save this address to your .env file:");
  console.log(`USDDF_TOKEN_ADDRESS=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
