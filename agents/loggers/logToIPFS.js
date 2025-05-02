/**
 * logToIPFS.js - Pins audit_log.json to IPFS by executing w3cli
 * Requires: dotenv
 * Prerequisites: Run `npm install -g @web3-storage/w3cli`, `w3cli login YOUR_EMAIL`, `w3cli space create YOUR_SPACE_NAME`, `w3cli space ls` (to get Space DID)
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const { exec } = require("node:child_process"); // Import exec
const util = require("node:util"); // Import util for promisify
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Convert exec to return a Promise
const execPromise = util.promisify(exec);

// --- Configuration ---
const W3_SPACE_DID = process.env.W3_SPACE_DID;
const LOG_PATH = path.resolve(__dirname, "../../audit_log.json");
const HISTORY_PATH = path.resolve(__dirname, "../../log_cid_history.json");
// --- End Configuration ---

/**
 * Pins the audit log file to IPFS using web3.storage CLI.
 */
async function pinToIPFS() {
  if (!W3_SPACE_DID) {
    console.error(
      "W3_SPACE_DID environment variable is not set. Get DID from `npx @web3-storage/w3cli space ls`."
    );
    return;
  }

  try {
    // --- Check Log File Exists ---
    console.log(`Checking log file at: ${LOG_PATH}`);
    try {
      await fs.access(LOG_PATH); // Check if file exists and is accessible
    } catch (readErr) {
      if (readErr.code === "ENOENT") {
        console.error(
          `Log file not found at ${LOG_PATH}. Make sure it exists before pinning.`
        );
      } else {
        console.error(`Error accessing log file: ${readErr.message}`);
      }
      return;
    }
    console.log(`Log file found.`);

    // --- Construct w3cli command ---
    // Use npx to ensure the correct package is executed
    // Escape the file path in case it contains spaces
    const command = `npx @web3-storage/w3cli upload "${LOG_PATH}" --space ${W3_SPACE_DID} --json --no-wrap`;
    console.log(`Executing command: ${command}`);

    // --- Execute w3cli upload command ---
    // Note: Ensure your shell environment where Node runs can find 'npx'
    const { stdout, stderr } = await execPromise(command, { timeout: 120000 }); // 2 min timeout

    if (stderr) {
      console.error(`w3cli stderr: ${stderr}`);
      // Check stderr for common errors if stdout parsing fails later
    }

    console.log(`w3cli stdout: ${stdout}`);

    // --- Parse Response ---
    // w3cli with --json should output JSON containing the root CID
    let outputData;
    try {
      // Find the line containing the JSON output (w3cli might add other logs)
      const jsonLine = stdout
        .split("\n")
        .find((line) => line.trim().startsWith("{"));
      if (!jsonLine) {
        throw new Error("Could not find JSON output line from w3cli.");
      }
      outputData = JSON.parse(jsonLine);
    } catch (parseError) {
      console.error("Failed to parse JSON output from w3cli:", parseError);
      console.error("Raw stdout:", stdout); // Log raw output for debugging
      return;
    }

    if (outputData && outputData.root && outputData.root["/"]) {
      const cidString = outputData.root["/"];
      console.log("File uploaded successfully via w3cli.");
      console.log("CID:", cidString);

      // --- Log CID History (Async) ---
      let existing = []; // Default to empty array
      try {
        // Try reading the existing history file
        const historyContent = await fs.readFile(HISTORY_PATH, "utf8");
        // Try parsing it as JSON
        existing = JSON.parse(historyContent);
        // Basic check to ensure it's an array (robustness)
        if (!Array.isArray(existing)) {
          console.warn(
            `History file ${HISTORY_PATH} did not contain a valid JSON array. Resetting.`
          );
          existing = [];
        }
      } catch (readError) {
        // If reading failed because the file doesn't exist, that's okay!
        if (readError.code === "ENOENT") {
          console.log(
            `History file ${HISTORY_PATH} not found. Creating new one.`
          );
          // Keep existing = []
        } else {
          // For any other read error (permissions, corrupt data), log it and reset
          console.error(
            `Error reading history file ${HISTORY_PATH}:`,
            readError
          );
          console.warn(`Proceeding with empty history due to read error.`);
          existing = []; // Reset on other errors too, just to be safe
        }
      }

      // Add the new entry
      existing.push({
        cid: cidString,
        timestamp: Date.now(),
      });

      // Try writing the updated history back
      try {
        await fs.writeFile(HISTORY_PATH, JSON.stringify(existing, null, 2));
        console.log("CID logged to log_cid_history.json");
      } catch (writeError) {
        console.error(
          `Error writing history file ${HISTORY_PATH}:`,
          writeError
        );
        // Decide if you want the whole script to fail here or just log the error
      }
      // --- End Log CID History ---
    } else {
      console.error("Unexpected JSON structure in w3cli output:", outputData);
    }
  } catch (err) {
    console.error("Error executing w3cli command:");
    console.error("Error Code:", err.code); // Exit code
    console.error("Error Signal:", err.signal); // Signal if killed
    console.error("Stderr:", err.stderr); // Captured standard error
    console.error("Stdout:", err.stdout); // Captured standard output
    console.error("Full Error Message:", err.message);
  }
}

pinToIPFS();
