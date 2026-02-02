import os
import sys
import json
import time
import requests
from web3 import Web3
from dotenv import load_dotenv

# Load env
load_dotenv(dotenv_path="arc/.env")

RPC_URL = os.getenv("ARC_TESTNET_RPC_URL")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
PYTH_ADDR = "0x2880aB155794e7179c9eE2e38200202908C17B43"
PRICE_ID = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace" # ETH/USD

# Minimal Pyth ABI
PYTH_ABI = [
    {
        "inputs": [{"internalType": "bytes[]", "name": "updateData", "type": "bytes[]"}],
        "name": "updatePriceFeeds",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes[]", "name": "updateData", "type": "bytes[]"}],
        "name": "getUpdateFee",
        "outputs": [{"internalType": "uint256", "name": "feeAmount", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "id", "type": "bytes32"}],
        "name": "getPrice",
        "outputs": [
            {
                "components": [
                    {"internalType": "int64", "name": "price", "type": "int64"},
                    {"internalType": "uint64", "name": "conf", "type": "uint64"},
                    {"internalType": "int32", "name": "expo", "type": "int32"},
                    {"internalType": "uint256", "name": "publishTime", "type": "uint256"}
                ],
                "internalType": "struct PythStructs.Price",
                "name": "price",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

def main():
    if not RPC_URL or not PRIVATE_KEY:
        print("Missing RPC_URL or PRIVATE_KEY")
        return

    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    account = w3.eth.account.from_key(PRIVATE_KEY)
    
    print(f"Connected to {RPC_URL}")
    print(f"Account: {account.address}")
    print(f"Pyth: {PYTH_ADDR}")

    pyth = w3.eth.contract(address=PYTH_ADDR, abi=PYTH_ABI)

    # 1. Fetch Update from Hermes
    print("Fetching update from Hermes...")
    url = f"https://hermes.pyth.network/v2/updates/price/latest?ids[]={PRICE_ID}"
    resp = requests.get(url)
    data = resp.json()
    
    binary_data = data["binary"]["data"][0]
    update_data = [bytes.fromhex(binary_data)]
    
    # 2. Estimate Fee
    fee = pyth.functions.getUpdateFee(update_data).call()
    print(f"Update Fee: {fee} wei")

    # 3. Update Price
    print("Submitting Update Transaction...")
    nonce = w3.eth.get_transaction_count(account.address)
    tx = pyth.functions.updatePriceFeeds(update_data).build_transaction({
        'from': account.address,
        'value': fee,
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price,
        'nonce': nonce,
    })
    
    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Tx Sent: {tx_hash.hex()}")
    
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status == 1:
        print("Update Success!")
    else:
        print("Update Failed!")
        return

    # 4. Verify Price
    price_data = pyth.functions.getPrice(bytes.fromhex(PRICE_ID[2:])).call()
    price_fmt = price_data[0] * (10 ** price_data[2])
    print(f"New On-Chain Price: ${price_fmt} (Time: {price_data[3]})")
    print(f"Staleness: {time.time() - price_data[3]}s")

if __name__ == "__main__":
    main()
