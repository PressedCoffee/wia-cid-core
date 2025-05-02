/**
 * logToJson.js - JSON audit logger for WIA/CID
 * Logs contract events to a local audit_log.json file in append-only format.
 */

const fs = require("fs");
const path = require("path");
const { subscribeToEvents } = require("./EventPoller");

const LOG_PATH = path.resolve(__dirname, "../../audit_log.json");

function appendToLog(event) {
  const currentLogs = fs.existsSync(LOG_PATH)
    ? JSON.parse(fs.readFileSync(LOG_PATH))
    : [];

  currentLogs.push(event);
  fs.writeFileSync(LOG_PATH, JSON.stringify(currentLogs, null, 2));
  console.log(`Logged event: ${event.type} #${event.id}`);
}

subscribeToEvents({
  onPredictionSubmitted: appendToLog,
  onPredictionResolved: appendToLog
});
