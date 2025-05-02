/**
 * EventPoller.js - Core event subscription and dispatch system
 * Listens to PredictionValidation contract events and notifies attached loggers.
 */

const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const ABI_PATH = path.resolve(__dirname, "../../artifacts/contracts/PredictionValidation.sol/PredictionValidation.json");
const contractABI = JSON.parse(fs.readFileSync(ABI_PATH)).abi;

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, provider);

function subscribeToEvents(callbacks) {
  contract.on("PredictionSubmitted", (id, agent, confidence, variablesHash, expiryBlock, description, event) => {
    callbacks.onPredictionSubmitted({
      type: "PredictionSubmitted",
      id: id.toString(),
      agent,
      confidence: confidence.toString(),
      variablesHash,
      expiryBlock: expiryBlock.toString(),
      description,
      blockNumber: event.blockNumber,
      timestamp: Date.now()
    });
  });

  contract.on("PredictionResolved", (id, resolver, outcome, resolutionBlock, event) => {
    callbacks.onPredictionResolved({
      type: "PredictionResolved",
      id: id.toString(),
      resolver,
      outcome: outcome.toString(),
      resolutionBlock: resolutionBlock.toString(),
      blockNumber: event.blockNumber,
      timestamp: Date.now()
    });
  });

  console.log("EventPoller: Subscribed to PredictionSubmitted and PredictionResolved events.");
}

module.exports = { subscribeToEvents };
