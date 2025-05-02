const {
  provider,
  submitPrediction,
  getRandomConfidence,
  getAmbiguousDescription,
  generateFakeVariablesHash,
} = require("../utils/AgentUtils");

async function run() {
  try {
    const confidence = getRandomConfidence();
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

module.exports = { run };
