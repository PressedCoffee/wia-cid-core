/**
 * driftDetector.js - Threshold Drift Detector for WIA/CID
 * Scans audit_log.json and looks for entropy drift, anomalous prediction patterns,
 * or potential emergent behavior signals.
 */

const fs = require("fs");
const path = require("path");

const LOG_PATH = path.resolve(__dirname, "../../audit_log.json");

function analyzeDrift() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log("No audit_log.json found. Nothing to analyze.");
    return;
  }

  const events = JSON.parse(fs.readFileSync(LOG_PATH));

  const confidenceBuckets = {
    low: 0,
    medium: 0,
    high: 0
  };

  const agentActivity = {};

  events.forEach(event => {
    if (event.type === "PredictionSubmitted") {
      const confidence = parseInt(event.confidence);
      if (confidence < 34) confidenceBuckets.low++;
      else if (confidence < 67) confidenceBuckets.medium++;
      else confidenceBuckets.high++;

      agentActivity[event.agent] = (agentActivity[event.agent] || 0) + 1;
    }
  });

  const totalPredictions = confidenceBuckets.low + confidenceBuckets.medium + confidenceBuckets.high;

  const entropyScore = (
    (confidenceBuckets.low ? -confidenceBuckets.low / totalPredictions * Math.log2(confidenceBuckets.low / totalPredictions) : 0) +
    (confidenceBuckets.medium ? -confidenceBuckets.medium / totalPredictions * Math.log2(confidenceBuckets.medium / totalPredictions) : 0) +
    (confidenceBuckets.high ? -confidenceBuckets.high / totalPredictions * Math.log2(confidenceBuckets.high / totalPredictions) : 0)
  );

  console.log("Drift Analysis Report:");
  console.log("----------------------");
  console.log("Total Predictions:", totalPredictions);
  console.log("Confidence Distribution:", confidenceBuckets);
  console.log("Entropy Score:", entropyScore.toFixed(4));
  console.log("Top Active Agents:");
  const sortedAgents = Object.entries(agentActivity).sort((a, b) => b[1] - a[1]);
  sortedAgents.slice(0, 5).forEach(([agent, count]) => {
    console.log(`- ${agent}: ${count} predictions`);
  });

  if (entropyScore < 1.2) {
    console.log("⚠️  Warning: Low entropy detected. Prediction confidence may be unnaturally clustered.");
  } else if (entropyScore > 1.5) {
    console.log("✅ Entropy within normal range.");
  } else {
    console.log("ℹ️  Entropy is borderline. Monitor closely.");
  }
}

analyzeDrift();
