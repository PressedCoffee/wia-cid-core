const {
  provider,
  submitPrediction,
  getAmbiguousDescription,
  generateFakeVariablesHash,
} = require("../utils/AgentUtils");

// Helper to create a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  try {
    const iterations = Math.floor(Math.random() * 6) + 5; // 5-10 iterations

    for (let i = 0; i < iterations; i++) {
      const confidence = Math.floor(Math.random() * 100) + 1;
      const description = getAmbiguousDescription();
      const variablesHash = generateFakeVariablesHash();
      const currentBlock = await provider.getBlockNumber();
      const expiryBlock = currentBlock + 75;

      const tx = await submitPrediction(
        confidence,
        variablesHash,
        expiryBlock,
        description
      );

      console.log(`EntropyBomber prediction #${i + 1} submitted:`);
      console.log("Tx hash:", tx.hash);
      console.log("Confidence:", confidence);
      console.log("Description:", description);
      console.log("Variables Hash:", variablesHash);
      console.log("Expires at block:", expiryBlock);

      // Delay 1-5 seconds before next iteration
      const delayMs = Math.floor(Math.random() * 4000) + 1000;
      await delay(delayMs);
    }
  } catch (err) {
    console.error("Error submitting entropy bomber predictions:", err);
  }
}

module.exports = { run };
