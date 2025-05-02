/**
 * resolvePrediction.js - Script to resolve a prediction on the WIA PredictionValidation contract
 * Usage:
 *   node resolvePrediction.js --id <predictionId> --outcome <1|2|3>
 * Outcome Codes:
 *   1 = Success
 *   2 = Failure
 *   3 = Undetermined
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const argv = yargs
  .option("id", {
    alias: "i",
    description: "Prediction ID to resolve",
    type: "number",
    demandOption: true
  })
  .option("outcome", {
    alias: "o",
    description: "Outcome code (1=Success, 2=Failure, 3=Undetermined)",
    type: "number",
    choices: [1, 2, 3],
    demandOption: true
  })
  .help()
  .alias("help", "h").argv;

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

const ABI_PATH = path.resolve(__dirname, "../artifacts/contracts/PredictionValidation.sol/PredictionValidation.json");
const contractABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function resolvePrediction(id, outcome) {
  try {
    const tx = await contract.resolvePrediction(id, outcome);
    console.log("Submitting resolution...");
    const receipt = await tx.wait();
    console.log(`✅ Prediction #${id} resolved with outcome ${outcome}`);
    console.log("Tx hash:", receipt.transactionHash);
  } catch (err) {
    console.error("❌ Error resolving prediction:", err);
  }
}

resolvePrediction(argv.id, argv.outcome);
