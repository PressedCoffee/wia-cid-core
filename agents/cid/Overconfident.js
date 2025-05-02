const {
  provider,
  submitPrediction,
  getAmbiguousDescription,
  generateFakeVariablesHash,
} = require("../utils/AgentUtils");

async function run() {
  try {
    const confidence = 100; // Always 100%
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

    console.log("CID Overconfident submitted prediction:");
    console.log("Tx hash:", tx.hash);
    console.log("Confidence:", confidence);
    console.log("Description:", description);
    console.log("Variables Hash:", variablesHash);
    console.log("Expires at block:", expiryBlock);
  } catch (err) {
    console.error("Error submitting overconfident prediction:", err);
  }
}

module.exports = { run };
