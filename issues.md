# Orbit - GitHub Issues

Here are pre-written issues you can copy-paste into GitHub to populate your board.

---

## Issue 1: 🏗️ Project Scaffolding
**Title:** `[Setup] Initialize Monorepo & Environment`
**Body:**
```markdown
### Objective
Initialize the repository structure for Orbit.

### Tasks
- [ ] Create `orbit/` root directory
- [ ] Initialize `agent/` (Python)
- [ ] Initialize `contracts/` (Foundry)
- [ ] Initialize `web/` (Next.js)
- [ ] Create `.env.example` with placeholders for:
  - `CIRCLE_API_KEY`
  - `STORK_API_KEY`
  - `ARC_RPC_URL`
```

---

## Issue 2: 🤖 Agent Core Logic (LangGraph)
**Title:** `[Agent] Implement LangGraph Decision Loop`
**Body:**
```markdown
### Objective
Build the "Brain" of the autonomous agent.

### Tasks
- [ ] Install LangGraph & LangChain
- [ ] Create the Graph State (Balance, CurrentYield, TargetChain)
- [ ] Implement Nodes:
    1. **Monitor**: Fetch data from Stork
    2. **Decide**: Check if rebalance is needed
    3. **Execute**: Trigger Circle Wallet Transfer
```

---

## Issue 3: 💳 Circle Wallet Integration
**Title:** `[Integration] Integrate Circle Developer Controlled Wallets`
**Body:**
```markdown
### Objective
Allow the agent to control a programmable wallet.

### Resources
- Circle Web3 Services SDK (Python)

### Tasks
- [ ] Create `CircleClient` class
- [ ] Implement `get_balance()`
- [ ] Implement `transfer_usdc(to_address, amount, chain)`
- [ ] Add error handling for API failures
```

---

## Issue 4: 🦄 Uniswap v4 Hook
**Title:** `[Contracts] Build Yield-Injection Hook`
**Body:**
```markdown
### Objective
Create a Uniswap v4 Hook that diverts a portion of swap fees to the Treasury.

### Tasks
- [ ] Setup v4-periphery dependencies
- [ ] Implement `afterSwap` hook
- [ ] Logic: logic to take distinct action on swap
- [ ] Test with `forge test`
```

---

## Issue 5: 🖥️ Treasury Dashboard
**Title:** `[Frontend] Build Main Dashboard`
**Body:**
```markdown
### Objective
A visual interface to see what the Agent is doing.

### Tasks
- [ ] Setup Next.js + Tailwind
- [ ] Component: `TreasuryBalance` (Total Value)
- [ ] Component: `AgentLog` (Live feed of "Thoughts")
- [ ] Connect to Agent FastAPI backend
```
