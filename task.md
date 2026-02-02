# Orbit - Team Task List

## 🟢 Shared / Infrastructure
> **Target Bounty**: 🏆 Best Agentic Commerce App Powered by Real-World Assets on Arc ($2,500)
> **Requirements**: Arc, USDC, Circle Wallets, Circle Contracts, Stork

- [x] **[P0]** Contracts: `OrbitHook` (Uniswap v4 Hook) - Refactored to Pyth Oracle & Verified <!-- id: 2 -->
- [x] **[P0]** Scripts: Deployment & Swap Verification on Arc Testnet - **SUCCESS** <!-- id: 3 -->
- [ ] **[P1]** Agent: Implement `PythPriceProvider` & `Agent` Logic <!-- id: 4 -->

## 🤖 Agent Dev (Python/Backend)
- [x] **[P1]** **Agent Core Setup** <!-- id: 2 -->
    - [x] Setup Python env & install `viem`, `pyth-sdk`
    - [x] Create `agent/src/providers/pyth.ts` & `agent/src/actions/swap.ts`
- [x] **[P1]** **Integrations** <!-- id: 3 -->
    - [x] Implement `PythPriceProvider` (ElizaOS Plugin)
    - [ ] Implement `CircleClient` for Wallet actions (check balance, transfer)
- [ ] **[P1]** **Brain Logic** <!-- id: 4 -->
    - [x] Register Providers & Actions in `plugin.ts`
    - [ ] Build Decider Node (LangGraph logic: If Yield < X -> Bridge)

## ⚡ Contract & Web Dev (Solidity/Next.js)
- [x] **[P1]** **Smart Contracts** <!-- id: 5 -->
    - [x] Setup Foundry project
    - [x] implement `OrbitHook.sol` (Uniswap v4 Hook for yield)
    - [x] Write tests for Hook
- [ ] **[P1]** **Frontend Dashboard** <!-- id: 6 -->
    - [ ] Scaffold Next.js App with Tailwind
    - [ ] Create `TreasuryView` component (Stats)
    - [ ] Visualizer for "Agent Activity" (Logs from API)

## 🚀 Final Integration
- [ ] **[P2]** Connect Front-end to Agent API <!-- id: 7 -->
- [ ] **[P2]** End-to-End Demo Recording <!-- id: 8 -->
