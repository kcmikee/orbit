import os
import sys
import json
import requests
from web3 import Web3
from eth_account import Account
import time

# Configuration
STORK_API_URL = "https://rest.jp.stork-oracle.network/v1"
CONTRACT_ADDRESS = "0xacC0a0cF13571d30B4b8637996F5D6D774d4fd62"
RPC_URL = "https://rpc.testnet.arc.network"
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
STORK_API_KEY = os.getenv("STORK_API_KEY")

if not PRIVATE_KEY:
    print("Error: PRIVATE_KEY not found in environment")
    sys.exit(1)

if not STORK_API_KEY:
    # Try to get from args
    if len(sys.argv) > 1:
        STORK_API_KEY = sys.argv[1]
    else:
        print("Error: STORK_API_KEY not found in environment or arguments")
        print("Usage: python3 scripts/fetch_and_push_stork.py <STORK_API_KEY>")
        sys.exit(1)

# ABI for Stork Contract (Minimal)
STORK_ABI = [
    {
        "inputs": [
            {
                "components": [
                    {
                        "components": [
                            {"internalType": "uint64", "name": "timestampNs", "type": "uint64"},
                            {"internalType": "int192", "name": "quantizedValue", "type": "int192"}
                        ],
                        "internalType": "struct StorkStructs.TemporalNumericValue",
                        "name": "temporalNumericValue",
                        "type": "tuple"
                    },
                    {"internalType": "bytes32", "name": "id", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "publisherMerkleRoot", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "valueComputeAlgHash", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "r", "type": "bytes32"},
                    {"internalType": "bytes32", "name": "s", "type": "bytes32"},
                    {"internalType": "uint8", "name": "v", "type": "uint8"}
                ],
                "internalType": "struct StorkStructs.TemporalNumericValueInput[]",
                "name": "updateData",
                "type": "tuple[]"
            }
        ],
        "name": "updateTemporalNumericValuesV1",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
        "name": "getTemporalNumericValueV1",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint64", "name": "timestampNs", "type": "uint64"},
                    {"internalType": "int192", "name": "quantizedValue", "type": "int192"}
                ],
                "internalType": "struct StorkStructs.TemporalNumericValue",
                "name": "value",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

def fetch_price(asset_pair="ETHUSD"):
    print(f"Fetching price for {asset_pair} from Stork API...")
    headers = {"Authorization": f"Basic {STORK_API_KEY}"}
    resp = requests.get(f"{STORK_API_URL}/prices/latest?assets={asset_pair}", headers=headers)
    
    if resp.status_code != 200:
        print(f"Error fetching price: {resp.text}")
        sys.exit(1)
    
    # Handle large ints in JSON
    # Python's json usually handles them fine, but Stork returns big ints.
    # We load as string then parse carefully if needed, but requests.json() might default to float on some.
    # Safe regex replace not fully needed for standard extraction if we are careful.
    data = resp.json()
    
    # The API returns a map by Asset ID, we take the first key
    first_key = list(data["data"].keys())[0]
    asset_data = data["data"][first_key]
    signed_price = asset_data["stork_signed_price"]
    
    # Construct input struct
    update_item = {
        "temporalNumericValue": {
            "timestampNs": int(signed_price["timestamped_signature"]["timestamp"]),
            "quantizedValue": int(signed_price["price"])
        },
        "id": signed_price["encoded_asset_id"],
        "publisherMerkleRoot": signed_price["publisher_merkle_root"],
        "valueComputeAlgHash": "0x" + signed_price["calculation_alg"]["checksum"],
        "r": signed_price["timestamped_signature"]["signature"]["r"],
        "s": signed_price["timestamped_signature"]["signature"]["s"],
        "v": signed_price["timestamped_signature"]["signature"]["v"]
    }
    
    return [update_item], signed_price["encoded_asset_id"]

def push_to_chain(updates, asset_id):
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("Error: Could not connect to RPC")
        sys.exit(1)
        
    account = Account.from_key(PRIVATE_KEY)
    print(f"Using account: {account.address}")
    
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=STORK_ABI)
    
    # 1. Update Price
    print(f"Submitting updateTemporalNumericValuesV1...")
    
    # Estimate gas?
    # fee = contract.functions.getUpdateFeeV1(updates).call() # Optional if fee is 0
    
    tx = contract.functions.updateTemporalNumericValuesV1(updates).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction sent: {w3.to_hex(tx_hash)}")
    
    # Wait for receipt
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status == 1:
        print("Transaction successful!")
    else:
        print("Transaction failed!")
        sys.exit(1)
        
    # 2. Verify Read
    print("Verifying on-chain data...")
    val_struct = contract.functions.getTemporalNumericValueV1(asset_id).call()
    
    print(f"Success! On-chain price for {asset_id.hex()}:")
    print(f"  Value: {val_struct[1]} (Quantized)")
    print(f"  Timestamp: {val_struct[0]}")

if __name__ == "__main__":
    updates, asset_id = fetch_price("ETHUSD")
    push_to_chain(updates, bytes.fromhex(asset_id[2:]))
