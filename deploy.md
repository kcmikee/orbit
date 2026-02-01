# Deployment Guide & Log

This document tracks the deployment steps and command history for the Orbit project.

## Activity Log

| Date | Component | Action | Command |
|------|-----------|--------|---------|
| 2026-02-01 | Documentation | Created deploy.md | - |

## Deployment Instructions

### 1. Smart Contracts (Arc)
Located in `arc/`. This module contains the Solidity smart contracts (Vaults, Hooks).

**Prerequisites:**
- Foundry (`forge`, `cast`, `anvil`)

**Build:**
```sh
cd arc
forge build
```

**Test:**
```sh
forge test
```

**Deploy:**
1. Copy `.env.example` to `.env` and fill in `RPC_URL`, `PRIVATE_KEY`, etc.
2. Run deployment script:
```sh
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

### 2. AI Agent (Python)
Located in `agent/`. This module contains the Python-based AI agent using LangGraph.

**Prerequisites:**
- Python 3.10+

**Setup:**
```sh
cd agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Run:**
```sh
python main.py
```

### 3. Web Dashboard
Located in `web/`. (Planned)
