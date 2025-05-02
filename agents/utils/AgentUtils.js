const path = require("path");
const fs = require("fs");
const { ethers } = require("ethers");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Load environment variables
const { SEPOLIA_URL, SEPOLIA_PRIVATE_KEY, WALLET_ADDRESS, CONTRACT_ADDRESS } =
  process.env;

// Validate required environment variables
if (!SEPOLIA_URL || !SEPOLIA_PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error(
    "Missing required environment variables: SEPOLIA_URL, SEPOLIA_PRIVATE_KEY, CONTRACT_ADDRESS"
  );
}

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
const wallet = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider);

// Load contract ABI
const ABI_PATH = path.resolve(
  __dirname,
  "../../artifacts/contracts/PredictionValidation.sol/PredictionValidation.json"
);
const contractABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;

// Initialize contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// Shared utility functions
function getRandomConfidence() {
  return Math.floor(Math.random() * 100) + 1; // 1-100
}

function getAmbiguousDescription() {
  const phrases = [
    "Something may happen... probably.",
    "Funds might or might not move.",
    "An entity could interact with something undefined.",
    "Activity expected in a non-specific timeframe.",
    "Uncertain events involving unspecified wallets.",
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function generateFakeVariablesHash() {
  const raw = "noise:" + Math.random().toString(36).substring(2);
  return ethers.keccak256(ethers.toUtf8Bytes(raw));
}

// Submit prediction wrapper
async function submitPrediction(
  confidence,
  variablesHash,
  expiryBlock,
  description
) {
  const tx = await contract.submitPrediction(
    confidence,
    variablesHash,
    expiryBlock,
    description
  );
  return tx;
}

// Placeholder for fetching the latest prediction
async function getLatestPrediction() {
  // TODO: Implement fetching the latest prediction from contract events or state
  return null;
}

module.exports = {
  provider,
  wallet,
  contract,
  getRandomConfidence,
  getAmbiguousDescription,
  generateFakeVariablesHash,
  submitPrediction,
  getLatestPrediction,
};
