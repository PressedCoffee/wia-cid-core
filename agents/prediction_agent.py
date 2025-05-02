"""
WIA/CID - Prediction Agent (Python)

This agent connects to an Ethereum smart contract (PredictionValidation.sol),
submits a prediction, and optionally resolves it later based on off-chain analysis.

Requirements:
- web3.py
- python-dotenv (for loading environment variables securely)
"""

import os
import time
import json
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

# Load environment variables
RPC_URL = os.getenv("SEPOLIA_URL")
PRIVATE_KEY = os.getenv("SEPOLIA_PRIVATE_KEY")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
# Updated relative path
ABI_PATH = "../artifacts/contracts/PredictionValidation.sol/PredictionValidation.json"

# Connect to Sepolia
web3 = Web3(Web3.HTTPProvider(RPC_URL))
assert web3.is_connected(), "Failed to connect to Web3 provider"

# Load ABI
with open(ABI_PATH) as f:
    contract_abi = json.load(f)["abi"]

contract = web3.eth.contract(address=Web3.to_checksum_address(
    CONTRACT_ADDRESS), abi=contract_abi)


def submit_prediction(confidence, variables_hash, expiry_block, description):
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.submitPrediction(confidence, variables_hash, expiry_block, description).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 300000,
        'gasPrice': web3.to_wei('20', 'gwei')
    })

    signed_txn = web3.eth.account.sign_transaction(
        txn, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
    print(f"Prediction submitted. Tx hash: {web3.to_hex(tx_hash)}")


def resolve_prediction(prediction_id, outcome):
    nonce = web3.eth.get_transaction_count(WALLET_ADDRESS)
    txn = contract.functions.resolvePrediction(prediction_id, outcome).build_transaction({
        'from': WALLET_ADDRESS,
        'nonce': nonce,
        'gas': 300000,
        'gasPrice': web3.to_wei('20', 'gwei')
    })

    signed_txn = web3.eth.account.sign_transaction(
        txn, private_key=PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(f"Prediction resolved. Tx hash: {web3.to_hex(tx_hash)}")


if __name__ == "__main__":
    # Example usage: Submit a prediction
    description = "Wallet 0xabc123... will send 2 ETH to a known mixer in the next 50 blocks"
    variables_text = "wallet:0xabc123|amount:2ETH|mixer:Tornado"
    variables_hash = web3.keccak(text=variables_text)
    current_block = web3.eth.block_number
    expiry = current_block + 50

    submit_prediction(
        confidence=87,
        variables_hash=variables_hash,
        expiry_block=expiry,
        description=description
    )

    # To resolve later:
    # resolve_prediction(prediction_id=1, outcome=1)  # 1 = Success
