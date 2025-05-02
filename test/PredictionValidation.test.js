const { expect } = require("chai");
const { ethers } = require("hardhat");

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("PredictionValidation", function () {
  let PredictionValidation;
  let predictionValidation;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    PredictionValidation = await ethers.getContractFactory(
      "PredictionValidation"
    );
    [owner, addr1, addr2] = await ethers.getSigners();
    predictionValidation = await PredictionValidation.deploy();
    await predictionValidation.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the initial prediction ID to 1", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      const expiryBlock = blockNumber + 10;
      const confidence = 50;
      const description = "Test prediction";

      await expect(
        predictionValidation
          .connect(addr1)
          .submitPrediction(confidence, ZERO_BYTES32, expiryBlock, description)
      )
        .to.emit(predictionValidation, "PredictionSubmitted")
        .withArgs(
          1,
          addr1.address,
          confidence,
          ZERO_BYTES32,
          expiryBlock,
          description
        );
    });
  });
});
