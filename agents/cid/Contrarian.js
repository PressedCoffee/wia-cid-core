const {
  provider,
  submitPrediction,
  getRandomConfidence,
  getAmbiguousDescription,
  generateFakeVariablesHash,
  getLatestPrediction,
} = require("../utils/AgentUtils");

// Helper to invert confidence (e.g., 100 -> 5, 80 -> 20)
function invertConfidence(confidence) {
  return Math.max(1, 100 - confidence);
}

// Helper to invert description phrases
function invertDescription(description) {
  if (!description) return "No prediction available.";
  if (description.includes("may happen"))
    return description.replace("may happen", "will not happen");
  if (description.includes("might"))
    return description.replace("might", "will not");
  if (description.includes("could"))
    return description.replace("could", "could not");
  if (description.includes("expected"))
    return description.replace("expected", "not expected");
  if (description.includes("Uncertain"))
    return description.replace("Uncertain", "Certain");
  return "Opposite of: " + description;
}

// Helper to slightly mutate variablesHash by changing last char
function mutateVariablesHash(hash) {
  if (!hash || hash.length === 0) return generateFakeVariablesHash();
  const lastChar = hash.slice(-1);
  const newChar = lastChar === "f" ? "e" : "f";
  return hash.slice(0, -1) + newChar;
}

async function run() {
  try {
    const latest = await getLatestPrediction();

    let confidence, description, variablesHash;

    if (latest) {
      confidence = invertConfidence(latest.confidence);
      description = invertDescription(latest.description);
      variablesHash = mutateVariablesHash(latest.variablesHash);
    } else {
      confidence = getRandomConfidence();
      description = getAmbiguousDescription();
      variablesHash = generateFakeVariablesHash();
    }

    const currentBlock = await provider.getBlockNumber();
    const expiryBlock = currentBlock + 75;

    const tx = await submitPrediction(
      confidence,
      variablesHash,
      expiryBlock,
      description
    );

    console.log("CID Contrarian submitted opposing prediction:");
    console.log("Tx hash:", tx.hash);
    console.log("Confidence:", confidence);
    console.log("Description:", description);
    console.log("Variables Hash:", variablesHash);
    console.log("Expires at block:", expiryBlock);
  } catch (err) {
    console.error("Error submitting contrarian prediction:", err);
  }
}

module.exports = { run };
