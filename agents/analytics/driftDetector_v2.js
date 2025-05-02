/**
 * driftDetector.js (v2) - Temporal Drift Tracker
 * Extends the basic Threshold Drift Detector by storing historical entropy values
 * and comparing the current scan against the last to track entropy drift over time.
 */

const fs = require("fs");
const path = require("path");

const LOG_PATH = path.resolve(__dirname, "../../audit_log.json");
const HISTORY_PATH = path.resolve(__dirname, "../../drift_history.json");

function calculateEntropy(buckets, total) {
  return (
    (buckets.low ? -buckets.low / total * Math.log2(buckets.low / total) : 0) +
    (buckets.medium ? -buckets.medium / total * Math.log2(buckets.medium / total) : 0) +
    (buckets.high ? -buckets.high / total * Math.log2(buckets.high / total) : 0)
  );
}

function analyzeDrift() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log("No audit_log.json found. Nothing to analyze.");
    return;
  }

  const events = JSON.parse(fs.readFileSync(LOG_PATH));

  const confidenceBuckets = { low: 0, medium: 0, high: 0 };
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
  const entropyScore = calculateEntropy(confidenceBuckets, totalPredictions);

  console.log("Drift Analysis Report:");
  console.log("----------------------");
  console.log("Total Predictions:", totalPredictions);
  console.log("Confidence Distribution:", confidenceBuckets);
  console.log("Entropy Score:", entropyScore.toFixed(4));

  const sortedAgents = Object.entries(agentActivity).sort((a, b) => b[1] - a[1]);
  console.log("Top Active Agents:");
  sortedAgents.slice(0, 5).forEach(([agent, count]) => {
    console.log(`- ${agent}: ${count} predictions`);
  });

  // Load and update history
  const history = fs.existsSync(HISTORY_PATH)
    ? JSON.parse(fs.readFileSync(HISTORY_PATH))
    : [];

  const timestamp = new Date().toISOString();
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;

  const drift = lastEntry ? entropyScore - lastEntry.entropy : null;
  history.push({ timestamp, totalPredictions, confidenceBuckets, entropy: entropyScore });

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));

  if (drift !== null) {
    console.log("Entropy Drift Since Last Scan:", drift.toFixed(4));
    if (Math.abs(drift) > 0.2) {
      console.log("⚠️  Significant entropy change detected.");
    } else {
      console.log("Entropy change within normal range.");
    }
  } else {
    console.log("First recorded scan. No prior data for drift comparison.");
  }
}

analyzeDrift();
