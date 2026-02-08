# Orbit - RWA Treasury Manager

## Target Bounties

### 1. Arc: Best Agentic Commerce App ($2,500)
**"AI agents using RWAs as productive capital for onchain commerce"**

| Requirement | Status |
|-------------|--------|
| AI agents that rebalance against RWA collateral | ✅ Implemented |
| Autonomous treasury management | ⚠️ Trading works, no deposits |
| USDC-denominated cash flow backed by RWAs | ❌ Missing vault |
| Clear agent decision logic tied to oracle signals | ✅ Implemented |
| Functional MVP (frontend + backend) | ⚠️ Chat works, no treasury UI |
| Architecture diagram | ❌ Missing |
| Video demonstration | ❌ Missing |
| Uses: Arc, USDC, Circle Wallets, Stork | ✅ All integrated |

### 2. Uniswap: v4 Agentic Finance ($5,000 pool)
**"Agent-driven financial systems on Uniswap v4"**

| Requirement | Status |
|-------------|--------|
| Uniswap v4 integration | ✅ OrbitHook deployed |
| Custom Hook implementation | ✅ beforeSwap with oracle |
| Agent interacts with v4 pools | ✅ EXECUTE_SWAP action |
| Trade execution | ✅ Works on testnet |
| Liquidity management | ❌ Not implemented |
| Routing/coordination | ❌ Single pool only |
| Reliability & transparency | ⚠️ No afterSwap logging |
| TxID evidence | ✅ Deployed to Arc testnet |
| Demo video (3 min) | ❌ Missing |

**Current competitiveness: 3rd place territory**

#### Quick Wins to Improve Hook
- [ ] **Dynamic fees** - Adjust based on oracle volatility (HIGH IMPACT)
- [ ] **afterSwap logging** - Emit events for transparency (EASY)
- [ ] **Slippage protection** - Reject swaps deviating from oracle (MEDIUM)
- [ ] **Price bounds** - Validate oracle price is realistic (EASY)

---

---

## Current Readiness: ~35%

| Requirement | Status | Score |
|-------------|--------|-------|
| Functional MVP | Partial - chat works, trading works, no deposits | 40% |
| Architecture diagram | Missing | 0% |
| Video demonstration | Not created | 0% |
| Documentation | Partial | 50% |
| Uses Arc | Yes | 100% |
| Uses USDC | Partially (in swaps only) | 30% |
| Uses Circle Wallets | Yes | 100% |
| Uses Stork Oracle | Yes | 100% |
| Agent decision logic | Implemented | 80% |
| RWA backing | Not implemented | 0% |

---

## The Vision (Full User Flow)

```
1. User visits platform → Landing page ✅
2. User chats with Norbit agent → Chat interface ✅
3. Agent explains what assets it manages → ❌ Missing
4. Agent explains WHY it manages them → ❌ Missing
5. Agent explains basis for fund shifting → ❌ Missing (has logic, can't explain)
6. User decides to deposit USDC → ❌ No deposit mechanism
7. User receives shares/NFTs as proof → ❌ No share token
8. User can redeem at maturity with yield → ❌ No redemption
```

---

## Implementation Status

### PHASE 1: Agent Core ✅ COMPLETE

- [x] ElizaOS agent setup ("Norbit" personality)
- [x] Character definition with trading philosophy
- [x] CoinGecko price provider (real market data)
- [x] Stork oracle provider (on-chain price from OrbitHook)
- [x] Pyth oracle provider (backup)
- [x] Treasury balance provider (reads token balances)
- [x] EXECUTE_SWAP action (swaps on Uniswap v4)
- [x] AUTONOMOUS_REBALANCE action (decision logic)
- [x] Decision thresholds: BUY at -5%, SELL at +5%, REBALANCE at 70%

### PHASE 2: Smart Contracts - Partial ⚠️

**Completed:**
- [x] OrbitHook.sol - Uniswap v4 hook with Stork oracle
- [x] Uniswap v4 pool integration
- [x] Stork oracle reading
- [x] Deploy to Arc testnet with MockStork
- [x] Verify swap functionality

**Missing (Critical for Treasury):**
- [ ] OrbitVault.sol - ERC4626 vault to accept USDC deposits
- [ ] ShareToken.sol - ERC20 representing user's stake in treasury
- [ ] OR RedemptionNFT.sol - NFT receipt for deposits (alternative)
- [ ] RWA integration - Connect to tokenized T-bills (e.g., USYC)
- [ ] Redemption logic - Burn shares, return USDC + yield
- [ ] Maturity tracking - Lock periods, yield calculation

**Deployed Addresses (Arc Testnet):**
```
PoolManager:   0xE95946D2BE744fCA83f421DF10615A4fCabD77Ff
OrbitHook:     0x93031545015f847FC85CD9f8232B742e5188c080
MockStork:     0xff39f62117656Ba09318E2F86467e4aF98526238
Token0 (USDC): 0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5
Token1 (WETH): 0xFC92d1864F6Fa41059c793935A295d29b63d9E46
```

### PHASE 3: Web Dashboard - Partial ⚠️

**Completed:**
- [x] Next.js 15 app with React 19
- [x] Landing page with Orbit branding
- [x] Chat interface with Norbit agent
- [x] Real-time messaging via Socket.IO
- [x] Circle wallet creation flow
- [x] Session history

**Missing (Critical for Treasury):**
- [ ] Treasury dashboard showing:
  - [ ] Total Value Locked (TVL)
  - [ ] Current APY
  - [ ] Asset allocation breakdown
  - [ ] RWA holdings display
- [ ] Deposit USDC flow (button + transaction)
- [ ] User's share/NFT balance display
- [ ] Redemption request flow
- [ ] Transaction history
- [ ] Yield earnings tracker

### PHASE 4: Agent Intelligence Gaps ❌

**Missing Actions:**
- [ ] GET_PORTFOLIO_BREAKDOWN - Agent explains current holdings
- [ ] GET_INVESTMENT_THESIS - Agent explains WHY it made decisions
- [ ] GET_HISTORICAL_PERFORMANCE - Track and report past trades
- [ ] ACCEPT_DEPOSIT - Acknowledge user deposits
- [ ] CALCULATE_SHARES - Compute shares for deposit amount
- [ ] PROCESS_REDEMPTION - Handle withdrawal requests

### PHASE 5: Demo Requirements ❌

- [ ] Architecture diagram (required by bounty)
- [ ] 3-minute demo video
- [ ] README documentation
- [ ] Product feedback document

---

## Critical Bugs to Fix First

### Security (MUST FIX)
- [ ] Rotate all exposed API keys (OpenAI, Circle, ElizaOS)
- [ ] Remove private key from .env (committed to git!)
- [ ] Add .env to .gitignore properly
- [ ] Enable oracle staleness validation in OrbitHook.sol

### Build Errors
- [ ] Fix missing `orbit.cron.ts` module import
- [ ] Fix type errors in Pyth provider
- [ ] Fix Socket.IO default port (4000 → 3000)

### Code Cleanup
- [ ] Delete unused `src/plugin.ts` (290 lines dead code)
- [ ] Remove 120+ console.log statements
- [ ] Fix Prettier formatting (14 files)

---

## Development Phases

### Phase A: Fix Critical Issues (Day 1)
Priority: Security and build fixes

```
[ ] 1. Rotate API keys and regenerate
[ ] 2. Fix .gitignore for .env files
[ ] 3. Fix TypeScript build errors
[ ] 4. Enable oracle staleness check
[ ] 5. Fix Socket.IO port
```

### Phase B: Core Treasury Contracts (Days 2-3)
Priority: Enable deposits and shares

```
[ ] 1. Create OrbitVault.sol (ERC4626)
     - Accept USDC deposits
     - Mint share tokens
     - Track user balances

[ ] 2. Create ShareToken.sol (ERC20)
     - Represent user stake
     - Transferable

[ ] 3. Add agent-only rebalance function
     - onlyAgent modifier
     - Move funds to RWA pools

[ ] 4. Deploy to Arc testnet
[ ] 5. Write tests
```

### Phase C: Dashboard Treasury UI (Days 3-4)
Priority: User can see and interact with treasury

```
[ ] 1. Treasury stats component
     - TVL display
     - APY display
     - Allocation chart

[ ] 2. Deposit flow
     - Connect wallet
     - Enter amount
     - Approve USDC
     - Deposit transaction
     - Show shares received

[ ] 3. Portfolio view
     - Your shares balance
     - Your USD value
     - Pending yield

[ ] 4. Redemption flow
     - Enter shares to redeem
     - Show USDC to receive
     - Execute redemption
```

### Phase D: Agent Enhancement (Day 4)
Priority: Agent can explain treasury state

```
[ ] 1. Add GET_TREASURY_STATUS action
     "I'm managing $X in the vault..."

[ ] 2. Add EXPLAIN_STRATEGY action
     "I bought RWAs because ETH dropped 5%..."

[ ] 3. Add portfolio knowledge to character
     - Current holdings
     - Recent decisions
     - Performance metrics
```

### Phase E: Demo & Documentation (Day 5)
Priority: Submission materials

```
[ ] 1. Create architecture diagram
     - System components
     - Data flow
     - User journey

[ ] 2. Record 3-min demo video
     - User deposits USDC
     - Agent explains strategy
     - Show rebalancing
     - User redeems shares

[ ] 3. Write comprehensive README
     - Project overview
     - Setup instructions
     - Architecture explanation

[ ] 4. Product feedback document
     - Circle tools used
     - What worked well
     - Suggestions for improvement
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Landing Page │  │ Chat w/Agent │  │ Treasury Dashboard   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NORBIT AI AGENT                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Providers │  │   Actions   │  │   Decision Engine       │ │
│  │ - CoinGecko │  │ - Swap      │  │ - Buy on dips (-5%)     │ │
│  │ - Stork     │  │ - Rebalance │  │ - Sell on rises (+5%)   │ │
│  │ - Treasury  │  │ - Deposit   │  │ - Rebalance at 70%      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SMART CONTRACTS (Arc L1)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ OrbitVault   │  │ OrbitHook    │  │ Uniswap v4 Pool    │    │
│  │ (ERC4626)    │  │ (v4 Hook)    │  │ USDC/WETH          │    │
│  │              │  │              │  │                    │    │
│  │ - deposit()  │  │ - beforeSwap │  │ - swap()           │    │
│  │ - withdraw() │  │ - getPrice() │  │ - addLiquidity()   │    │
│  │ - shares     │  │ - validate   │  │                    │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│         │                  │                   │                │
│         └──────────────────┼───────────────────┘                │
│                            ▼                                    │
│                   ┌────────────────┐                            │
│                   │  Stork Oracle  │                            │
│                   │  (RWA Prices)  │                            │
│                   └────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Circle       │  │ CoinGecko    │  │ Arc Testnet RPC    │    │
│  │ Wallets      │  │ API          │  │                    │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Commands

```bash
# Agent
cd agent && bun install && bun run dev

# Web
cd web && bun install && bun run dev

# Contracts
cd arc && forge build && forge test
```

### Key Files

```
agent/src/character.ts          # Norbit personality
agent/src/actions/rebalance.ts  # Decision logic
agent/src/providers/stork.ts    # Oracle provider

arc/src/OrbitHook.sol           # Uniswap v4 hook
arc/script/Swap.s.sol           # Deployment script

web/src/components/chat-simple.tsx  # Chat UI
web/src/app/api/endpoints/route.ts  # Circle wallet API
```

---

## Progress Log

| Date | Milestone | Status |
|------|-----------|--------|
| Feb 1 | Project initialized | ✅ |
| Feb 2 | ElizaOS agent setup | ✅ |
| Feb 3 | OrbitHook deployed | ✅ |
| Feb 4 | Providers created | ✅ |
| Feb 5 | Autonomous rebalance | ✅ |
| Feb 6 | Web dashboard chat | ✅ |
| Feb 7 | Audit & gap analysis | ✅ |
| Feb ? | Vault contract | ⏳ |
| Feb ? | Treasury UI | ⏳ |
| Feb ? | Demo video | ⏳ |
| Feb ? | Submission | ⏳ |

---

## Notes

### What We Have (Strengths)
- Working AI agent with trading personality
- Real oracle integration (Stork + Pyth + CoinGecko)
- Uniswap v4 hook implementation
- Circle wallet integration
- Real-time chat interface

### What We're Missing (Critical Gaps)
- No way for users to deposit money (no Vault)
- No proof of deposit (no Shares/NFTs)
- No RWA allocation (just trading between 2 tokens)
- Agent can't explain its portfolio to users
- No redemption mechanism

### Key Insight
Current implementation = **Autonomous Trading Bot**
Bounty requirement = **RWA Treasury System**

We have the "brain" (agent) but not the "vault" (treasury contracts).
