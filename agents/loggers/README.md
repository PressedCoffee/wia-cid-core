# Logger Module (`agents/loggers/`)

## Purpose

This module listens to events from specific smart contracts (e.g., `PredictionValidation`) on a target blockchain network (e.g., Sepolia testnet) using an RPC endpoint. It processes these events and logs them to various destinations for monitoring, auditing, and potential interaction.

## Components

- **`EventPoller.js`**: Connects to the configured RPC endpoint, instantiates the target smart contract, listens for specified contract events (e.g., `PredictionSubmitted`, `PredictionResolved`), and triggers appropriate handlers upon receiving events.
- **`logToJson.js`**: (Assumed Handler/Part of Poller) Handles events by appending structured event data (including arguments, block number, timestamp, etc.) to the `audit_log.json` file.
- **`logToIPFS.js`**: A script to upload the current `audit_log.json` file to decentralized storage (web3.storage/IPFS) and record the resulting Content Identifier (CID) in `log_cid_history.json`.
- _(Additional handlers or loggers like `logToDiscord.js` could be added to this framework.)_

## Setup

1.  **Prerequisites:**

    - Node.js (v20.x or later recommended, tested with v20.15.0)
    - npm or yarn package manager

2.  **Installation:**

    - Navigate to the project root directory.
    - Run `npm install` to install all dependencies listed in the main `package.json`, including those required by the loggers (e.g., `ethers`, `dotenv`, `@web3-storage/w3up-client`, `@web-std/file`).

3.  **Environment Variables:**

    - Create a `.env` file in the project root directory (two levels up from `agents/loggers/`, e.g., `../../.env`).
    - Add the following variables:

      ```dotenv
      # Example .env content
      SEPOLIA_RPC_URL=[https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID_OR_OTHER_RPC](https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID_OR_OTHER_RPC)
      CONTRACT_ADDRESS=0xYourDeployedContractAddress # Address of the PredictionValidation contract
      W3_REGISTERED_EMAIL=your_email@example.com    # Email registered with web3.storage CLI
      W3_SPACE_DID=did:key:z6M...your_space_did...    # DID of the web3.storage space for uploads
      # Add any other required variables (e.g., private keys if needed by poller, Discord webhook URL)
      ```

    - Notes:
      - Obtain `CONTRACT_ADDRESS` after deploying your smart contract.
      - Obtain `W3_REGISTERED_EMAIL` and `W3_SPACE_DID` via the `web3.storage CLI Setup` below.

4.  **web3.storage CLI Setup (for `logToIPFS.js`):**
    - Install CLI globally: `npm install -g @web3-storage/w3cli`
    - Login and authorize the agent: `npx @web3-storage/w3cli login your_email@example.com` (Follow email verification link).
    - Create a space (if needed): `npx @web3-storage/w3cli space create your-space-name` (e.g., `audit-logs`)
    - List spaces to get the DID for `.env`: `npx @web3-storage/w3cli space ls`
    - Set the default space (recommended): `npx @web3-storage/w3cli space use did:key:z6M...your_space_did...`
    - _(Troubleshooting: If `w3cli` command is not found, ensure npm global bin directory is in your PATH or use `npx @web3-storage/w3cli ...` for all commands)._

## Usage

- **Start Event Polling:**

  - The `EventPoller.js` script needs to run continuously to listen for new events.
  - Run it in a dedicated terminal:
    ```bash
    node agents/loggers/EventPoller.js
    ```
  - For long-term running, consider using a process manager like `pm2` or `nodemon`.

- **Upload Logs to IPFS:**
  - The `logToIPFS.js` script uploads the _current_ state of `audit_log.json`.
  - Run this script manually when needed, or set it up to run periodically (e.g., using `cron` on Linux/macOS or Task Scheduler on Windows).
    ```bash
    node agents/loggers/logToIPFS.js
    ```

## Output Files

- **`audit_log.json`**: Located in the project root (`../../`). An append-only JSON file containing an array of objects, where each object represents a captured smart contract event. Includes event name, arguments, transaction hash, block number, timestamp, etc.
- **`log_cid_history.json`**: Located in the project root (`../../`). A JSON file containing an array of objects, each recording a successful IPFS upload: `{ "cid": "bafk...", "timestamp": 167... }`.
