/**
 * @file deploy.js
 * @description Deployment script for PredictionValidation contract to Sepolia testnet using Hardhat and ethers v6.
 */

const hre = require("hardhat");

async function main() {
  console.log(
    "Deploying PredictionValidation contract to network:",
    hre.network.name
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const PredictionValidation = await hre.ethers.getContractFactory(
    "PredictionValidation"
  );
  const predictionValidation = await PredictionValidation.deploy();

  await predictionValidation.waitForDeployment();

  console.log("PredictionValidation deployed at:", predictionValidation.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
