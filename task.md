# Orbit - Team Task List

## 🟢 Shared / Infrastructure
- [ ] **[P0]** Initialize Monorepo (Agent, Contracts, Web) <!-- id: 0 -->
- [ ] **[P0]** Setup Shared Types & Environment Variables (.env.example) <!-- id: 1 -->

## 🤖 Agent Dev (Python/Backend)
- [ ] **[P1]** **Agent Core Setup** <!-- id: 2 -->
    - [ ] Setup Python env & install `langgraph`, `circle-sdk`, `stork-sdk`
    - [ ] Create `agent/main.py` entrypoint (FastAPI)
- [ ] **[P1]** **Integrations** <!-- id: 3 -->
    - [ ] Implement `StorkClient` to fetch RWA prices
    - [ ] Implement `CircleClient` for Wallet actions (check balance, transfer)
- [ ] **[P1]** **Brain Logic** <!-- id: 4 -->
    - [ ] Build Monitor Node (Checks Stork)
    - [ ] Build Decider Node (LangGraph logic: If Yield < X -> Bridge)
    - [ ] Build Executor Node (Calls Circle API)

## ⚡ Contract & Web Dev (Solidity/Next.js)
- [ ] **[P1]** **Smart Contracts** <!-- id: 5 -->
    - [ ] Setup Foundry project
    - [ ] implement `OrbitHook.sol` (Uniswap v4 Hook for yield)
    - [ ] Write tests for Hook
- [ ] **[P1]** **Frontend Dashboard** <!-- id: 6 -->
    - [ ] Scaffold Next.js App with Tailwind
    - [ ] Create `TreasuryView` component (Stats)
    - [ ] Visualizer for "Agent Activity" (Logs from API)

## 🚀 Final Integration
- [ ] **[P2]** Connect Front-end to Agent API <!-- id: 7 -->
- [ ] **[P2]** End-to-End Demo Recording <!-- id: 8 -->
