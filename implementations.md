# Implementation Plan - Orbit: Agentic RWA Treasury Manager

**Goal**: Build an autonomous AI agent that manages a treasury of Real-World Assets (RWAs) on the Arc L1 blockchain, utilizing Circle Wallets for custody, Stork for data, and Uniswap v4 for yield optimization.

## User Review Required
> [!IMPORTANT]
> **API Keys & Secrets**: We will need valid API keys for Circle Developer Console, Stork, and potentially an RPC endpoint for Arc. These should be stored in a `.env` file (which I will create added to `.gitignore`).

## Proposed Architecture

### 1. The Brain (Agent Service)
*   **Tech**: Python, FastAPI, LangGraph (or similar logic flow).
*   **Role**: Monitors Stork oracles, decides on rebalancing/borrowing, triggers Circle Wallet actions.
*   **Files**:
    *   `agent/main.py`: FastAPI entrypoint.
    *   `agent/brain.py`: Core decision logic (LangGraph).
    *   `agent/integrations/circle.py`: Circle Wallet SDK wrapper.
    *   `agent/integrations/stork.py`: Stork Oracle fetcher.

### 2. The Vault & Commons (Smart Contracts)
*   **Tech**: Solidity, Foundry/Hardhat.
*   **Role**: Uniswap v4 Hooks, any custom treasury logic on Arc.
*   **Files**:
    *   `contracts/src/OrbitHook.sol`: Uniswap v4 Hook for yield injection.
    *   `contracts/script/Deploy.s.sol`: Deployment scripts for Arc.

### 3. The Dashboard (Frontend)
*   **Tech**: Next.js, Tailwind CSS.
*   **Role**: Visualization of the Agent's actions and Treasury status.
*   **Files**:
    *   `web/app/page.tsx`: Main dashboard.
    *   `web/components/TreasuryStats.tsx`: Real-time view of assets.

## Proposed Changes (File Structure)

#### [NEW] [Orbit Repository Structure](file:///Users/user/SuperFranky/orbit)
```text
orbit/
├── agent/                 # Python Agent Service
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── contracts/             # Solidity Contracts (Foundry)
│   ├── lib/
│   ├── src/
│   └── foundry.toml
├── web/                   # Next.js Frontend
│   ├── package.json
│   └── ...
├── docker-compose.yml     # Orchestration (Optional)
└── README.md
```

## Verification Plan

### Automated Tests
*   **Agent**: Unit tests for decision logic (`pytest`). Mock Circle API responses.
*   **Contracts**: Foundry tests (`forge test`) for the Uniswap Hook.

### Manual Verification
*   **Agent Flow**: Run the Python script, verify it "sees" the price from Stork and "logs" a transaction intent.
*   **Chain Interaction**: Verify transactions on the Arc Testnet Explorer (if available) or simulate in local fork.
