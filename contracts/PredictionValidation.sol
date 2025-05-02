// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Prediction Validation Contract for WIA/CID Core Pulse
/// @author WIA/CID Architect Agent (Roo)
/// @notice This contract allows agents to submit predictions and resolve their outcomes before expiry.
/// @dev Designed for Phase 1 with strict expiry resolution and agent-only access control.
contract PredictionValidation {
    /// @notice Possible outcomes for a prediction
    enum PredictionOutcome {
        Pending,      // Default state upon submission
        Success,      // Prediction validated as correct
        Failure,      // Prediction validated as incorrect
        Undetermined  // Outcome could not be determined
    }

    /// @notice Represents a submitted prediction
    struct Prediction {
        uint256 id;              // Unique identifier for the prediction
        address agent;           // Address of the submitting agent
        uint8 confidence;        // Agent's confidence level (1-100)
        bytes32 variablesHash;   // Hash commitment to prediction variables (not validated in Phase 1)
        uint256 submissionBlock; // Block number of submission
        uint256 expiryBlock;     // Block number after which prediction can no longer be resolved
        string description;      // Textual description (keep concise)
        PredictionOutcome outcome; // Current outcome status (starts Pending)
        uint256 resolutionBlock; // Block number of resolution (0 if Pending)
    }

    /// @notice Emitted when a new prediction is submitted
    /// @param predictionId The unique ID of the prediction
    /// @param agent The address of the submitting agent
    /// @param confidence The confidence level of the prediction (1-100)
    /// @param variablesHash The hash commitment to prediction variables
    /// @param expiryBlock The block number after which the prediction expires
    /// @param description The textual description of the prediction
    event PredictionSubmitted(
        uint256 indexed predictionId,
        address indexed agent,
        uint8 confidence,
        bytes32 variablesHash,
        uint256 expiryBlock,
        string description
    );

    /// @notice Emitted when a prediction outcome is resolved by the agent before expiry
    /// @param predictionId The unique ID of the prediction
    /// @param resolver The address resolving the prediction (must be the original agent)
    /// @param outcome The resolved outcome of the prediction
    /// @param resolutionBlock The block number when the prediction was resolved
    event PredictionResolved(
        uint256 indexed predictionId,
        address indexed resolver,
        PredictionOutcome outcome,
        uint256 resolutionBlock
    );

    /// @param provided The confidence value provided by the user
    error InvalidConfidence(uint8 provided);
    /// @param predictionId The ID of the prediction that was not found
    error PredictionNotFound(uint256 predictionId);
    /// @param predictionId The ID of the prediction being accessed
    /// @param caller The address attempting the action
    /// @param expectedAgent The address authorized to perform the action
    error NotAgent(uint256 predictionId, address caller, address expectedAgent);
    /// @param predictionId The ID of the prediction that is already resolved
    error AlreadyResolved(uint256 predictionId);
    /// @param predictionId The ID of the prediction that has expired
    /// @param currentBlock The current block number
    /// @param expiryBlock The prediction's expiry block number
    error PredictionExpired(uint256 predictionId, uint256 currentBlock, uint256 expiryBlock);
    /// @param predictionId The ID of the prediction
    error CannotResolvePending(uint256 predictionId);
    /// @param provided The expiry block provided by the user
    /// @param current The current block number
    error InvalidExpiryBlock(uint256 provided, uint256 current);

    uint256 private _nextPredictionId = 1;
    mapping(uint256 => Prediction) private predictions;

    /// @notice Submit a new prediction
    /// @param confidence Confidence level (1-100)
    /// @param variablesHash Hash commitment to prediction variables
    /// @param expiryBlock Block number after which prediction expires (must be > current block)
    /// @param description Textual description of the prediction
    /// @return predictionId The unique ID assigned to the prediction
    function submitPrediction(
        uint8 confidence,
        bytes32 variablesHash,
        uint256 expiryBlock,
        string calldata description
    ) external returns (uint256 predictionId) {
        if (confidence == 0 || confidence > 100) {
            revert InvalidConfidence(confidence);
        }
        if (expiryBlock <= block.number) {
            revert InvalidExpiryBlock(expiryBlock, block.number);
        }

        predictionId = _nextPredictionId++;
        predictions[predictionId] = Prediction({
            id: predictionId,
            agent: msg.sender,
            confidence: confidence,
            variablesHash: variablesHash,
            submissionBlock: block.number,
            expiryBlock: expiryBlock,
            description: description,
            outcome: PredictionOutcome.Pending,
            resolutionBlock: 0
        });

        emit PredictionSubmitted(predictionId, msg.sender, confidence, variablesHash, expiryBlock, description);
    }

    /// @notice Resolve the outcome of a prediction before expiry
    /// @param predictionId The ID of the prediction to resolve
    /// @param outcome The outcome to set (cannot be Pending)
    function resolvePrediction(uint256 predictionId, PredictionOutcome outcome) external {
        Prediction storage prediction = predictions[predictionId];
        if (prediction.agent == address(0)) {
            revert PredictionNotFound(predictionId);
        }
        if (msg.sender != prediction.agent) {
            revert NotAgent(predictionId, msg.sender, prediction.agent);
        }
        if (prediction.outcome != PredictionOutcome.Pending) {
            revert AlreadyResolved(predictionId);
        }
        if (block.number > prediction.expiryBlock) {
            revert PredictionExpired(predictionId, block.number, prediction.expiryBlock);
        }
        if (outcome == PredictionOutcome.Pending) {
            revert CannotResolvePending(predictionId);
        }

        prediction.outcome = outcome;
        prediction.resolutionBlock = block.number;

        emit PredictionResolved(predictionId, msg.sender, outcome, block.number);
    }

    /// @notice Get the full prediction metadata by ID
    /// @param predictionId The ID of the prediction to retrieve
    /// @return prediction The Prediction struct with all metadata
    function getPrediction(uint256 predictionId) external view returns (Prediction memory prediction) {
        prediction = predictions[predictionId];
    }
}