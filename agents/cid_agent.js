/**
 * CID Agent (Obfuscator v0) for WIA/CID System
 * Language: JavaScript (Node.js)
 * Purpose: Submit ambiguous or deceptive predictions to test the reasoning integrity of WIA
 * Requires: ethers.js, dotenv
 */

const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });
const fs = require("fs");

// Load environment variables
const SEPOLIA_URL = process.env.SEPOLIA_URL;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
console.log(
  "Loaded SEPOLIA_PRIVATE_KEY:",
  SEPOLIA_PRIVATE_KEY
    ? SEPOLIA_PRIVATE_KEY.substring(0, 6) + "..."
    : "undefined"
);
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ABI_PATH =
  "../artifacts/contracts/PredictionValidation.sol/PredictionValidation.json";

// Connect to provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
const wallet = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider);

// Load ABI
const contractABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// Obfuscation utilities
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

// Main function
async function submitObfuscatedPrediction() {
  try {
    const confidence = getRandomConfidence();
    const description = getAmbiguousDescription();
    const variablesHash = generateFakeVariablesHash();
    const currentBlock = await provider.getBlockNumber();
    const expiryBlock = currentBlock + 75;

    const tx = await contract.submitPrediction(
      confidence,
      variablesHash,
      expiryBlock,
      description
    );

    console.log("CID Obfuscator submitted fake prediction:");
    console.log("Tx hash:", tx.hash);
    console.log("Confidence:", confidence);
    console.log("Description:", description);
    console.log("Variables Hash:", variablesHash);
    console.log("Expires at block:", expiryBlock);
  } catch (err) {
    console.error("Error submitting obfuscated prediction:", err);
  }
}

submitObfuscatedPrediction();
