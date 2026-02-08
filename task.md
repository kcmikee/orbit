# Orbit - RWA Treasury Manager

## Target Bounties

### 1. Arc: Best Agentic Commerce App ($2,500)
**"AI agents using RWAs as productive capital for onchain commerce"**

| Requirement | Status |
|-------------|--------|
| AI agents that rebalance against RWA collateral | ✅ Implemented |
| Autonomous treasury management | ✅ OrbitVault deployed |
| USDC-denominated cash flow backed by RWAs | ✅ ERC4626 vault accepts USDC |
| Clear agent decision logic tied to oracle signals | ✅ Implemented |
| Functional MVP (frontend + backend) | ⚠️ Chat works, treasury UI pending |
| Architecture diagram | ✅ Added below |
| Video demonstration | ❌ Missing |
| Uses: Arc, USDC, Circle Wallets, Stork | ✅ All integrated |

### 2. Uniswap: v4 Agentic Finance ($5,000 pool)
**"Agent-driven financial systems on Uniswap v4"**

| Requirement | Status |
|-------------|--------|
| Uniswap v4 integration | ✅ OrbitHook deployed |
| Custom Hook implementation | ✅ beforeSwap + afterSwap with oracle |
| Agent interacts with v4 pools | ✅ EXECUTE_SWAP action |
| Trade execution | ✅ Works on testnet |
| Liquidity management | ❌ Not implemented |
| Routing/coordination | ❌ Single pool only |
| Reliability & transparency | ✅ afterSwap logging + events |
| TxID evidence | ✅ Deployed to Arc testnet |
| Demo video (3 min) | ❌ Missing |

**Current competitiveness: 2nd place territory (improved from 3rd)**

#### Quick Wins to Improve Hook
- [ ] **Dynamic fees** - Adjust based on oracle volatility (HIGH IMPACT)
- [x] **afterSwap logging** - Emit events for transparency (EASY) ✅
- [x] **Staleness protection** - Reject stale oracle prices (MEDIUM) ✅
- [x] **Price bounds** - Validate oracle price is realistic (EASY) ✅

---

## Current Readiness: ~75% (improved from 35%)

| Requirement | Status | Score |
|-------------|--------|-------|
| Functional MVP | Chat + trading + vault deployed | 70% |
| Architecture diagram | ✅ Complete | 100% |
| Video demonstration | Not created | 0% |
| Documentation | Improved | 70% |
| Uses Arc | Yes | 100% |
| Uses USDC | ✅ Vault accepts USDC deposits | 100% |
| Uses Circle Wallets | Yes | 100% |
| Uses Stork Oracle | ✅ TreasuryOracle implements IStork | 100% |
| Agent decision logic | Implemented + RWA knowledge | 90% |
| RWA backing | ✅ MockUSYC (4.7% APY), MockBUILD simulated | 80% |

---

## Deployed Contracts (Arc Testnet - Chain ID: 5042002)

### Core Infrastructure
```
PoolManager:      0xE95946D2BE744fCA83f421DF10615A4fCabD77Ff
OrbitHook:        0x93031545015f847FC85CD9f8232B742e5188c080
MockStork:        0xff39f62117656Ba09318E2F86467e4aF98526238
```

### Treasury System (Deployed Feb 8, 2026)
```
MockUSDC:         0x58b0104A9308f5Bff7Cc3fA78705eF81bcf1B26E (6 decimals)
MockUSYC:         0x972E50035f9Cdc7F866Aff947b656D3eF6E002E8 (4.7% APY)
MockWETH:         0xEC03f1284DBe333894a724D5744D21CdfAa51ACa
TreasuryOracle:   0x9e2851a6E9fFA4433a38B74f6bD08e519A782940
OrbitVault:       0x9370dDf91b63cF5b2aa0c89BdC9D41209f24615F (ERC4626)
```

### Legacy Tokens (from initial deployment)
```
Token0 (USDC):    0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5
Token1 (WETH):    0xFC92d1864F6Fa41059c793935A295d29b63d9E46
```

---

## The Vision (Full User Flow)

```
1. User visits platform → Landing page ✅
2. User chats with Norbit agent → Chat interface ✅
3. Agent explains what assets it manages → ✅ Character updated with RWA knowledge
4. Agent explains WHY it manages them → ✅ Character has decision logic
5. Agent explains basis for fund shifting → ✅ Threshold explanations
6. User decides to deposit USDC → ✅ OrbitVault.deposit() available
7. User receives shares as proof → ✅ ERC4626 shares (oUSDC)
8. User can redeem with yield → ✅ OrbitVault.withdraw() + agentRebalance()
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
- [x] **TreasuryOracle provider** (reads RWA prices from on-chain oracle)
- [x] EXECUTE_SWAP action (swaps on Uniswap v4)
- [x] AUTONOMOUS_REBALANCE action (decision logic)
- [x] Decision thresholds: BUY at -5%, SELL at +5%, REBALANCE at 70%
- [x] **Comprehensive RWA knowledge** (USDC, USYC, WETH, BUIDL details)

### PHASE 2: Smart Contracts ✅ COMPLETE

**Completed:**
- [x] OrbitHook.sol - Uniswap v4 hook with Stork oracle
- [x] **Updated to OpenZeppelin BaseHook** (proper v4 integration)
- [x] **afterSwap logging with events** (SwapValidated event)
- [x] **Staleness check** (MAX_STALENESS = 1 hour)
- [x] **checkPriceHealth()** function for monitoring
- [x] Uniswap v4 pool integration
- [x] Stork oracle reading
- [x] Deploy to Arc testnet with MockStork
- [x] Verify swap functionality

**Treasury Contracts (NEW):**
- [x] **OrbitVault.sol** - ERC4626 vault for USDC deposits
  - deposit() / withdraw() with share minting
  - agentRebalance() for fund management
  - agentWithdraw() for agent-controlled withdrawals
  - getVaultStats() for TVL, share price, APY
  - Pause/unpause functionality
- [x] **TreasuryOracle.sol** - Multi-asset price oracle
  - Implements IStork interface
  - Supports USDC, USYC, WETH, BUIDL feeds
  - 24h price change tracking
  - APY tracking for yield assets
  - Batch price updates for efficiency
- [x] **MockUSDC.sol** - Test stablecoin (6 decimals)
  - faucet() for testnet usage
  - 1M minted to deployer
- [x] **MockUSYC.sol** - Yield-bearing token
  - Simulates 4.7% APY via price appreciation
  - getCurrentPrice() with time-based yield
  - 100K minted to deployer
- [x] **MockWETH.sol** - Wrapped ETH
  - Standard deposit/withdraw
  - 100 minted to deployer
- [x] **HookMiner.sol** - Local utility (moved from v4-periphery)

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
- [ ] User's share balance display
- [ ] Redemption request flow
- [ ] Transaction history
- [ ] Yield earnings tracker

### PHASE 4: Agent Intelligence ✅ COMPLETE

**Completed:**
- [x] RWA asset knowledge in character.ts
- [x] Decision logic explanations
- [x] Target allocation knowledge (60% RWAs, 25% USDC, 15% WETH)

**New Actions (treasury.ts):**
- [x] GET_TREASURY_STATUS - Reports vault TVL, shares, APY, yield earned
- [x] EXPLAIN_STRATEGY - Explains investment thesis and decision triggers
- [x] GET_PORTFOLIO_BREAKDOWN - Shows current holdings with live prices
- [x] CALCULATE_DEPOSIT - Previews shares for deposit amount

**Remaining (Nice to Have):**
- [ ] GET_HISTORICAL_PERFORMANCE - Track and report past trades
- [ ] PROCESS_REDEMPTION - Handle withdrawal requests

### PHASE 5: Demo Requirements - Partial ⚠️

- [x] Architecture diagram (see below)
- [ ] 3-minute demo video
- [x] README documentation (task.md)
- [ ] Product feedback document

---

## Critical Bugs Fixed ✅

### Security
- [x] ~~Rotate all exposed API keys~~ (user responsibility)
- [x] ~~Remove private key from .env~~ (using testnet key)
- [x] Enable oracle staleness validation in OrbitHook.sol ✅

### Build Errors
- [x] Fix v4-periphery BaseHook missing → Using OpenZeppelin uniswap-hooks ✅
- [x] Fix HookMiner missing → Created local implementation ✅
- [x] Contracts compile successfully ✅
- [x] Agent builds successfully ✅

### Code Quality
- [x] Added proper git submodules for dependencies
- [x] Updated foundry.toml with correct remappings

---

## Development Phases (Updated)

### Phase A: Fix Critical Issues ✅ COMPLETE

```
[x] 1. Fix v4-periphery dependency (BaseHook removed)
[x] 2. Add OpenZeppelin uniswap-hooks library
[x] 3. Fix HookMiner missing
[x] 4. Enable oracle staleness check
[x] 5. Build passes for all components
```

### Phase B: Core Treasury Contracts ✅ COMPLETE

```
[x] 1. Create OrbitVault.sol (ERC4626)
     - Accept USDC deposits ✅
     - Mint share tokens (oUSDC) ✅
     - Track user balances ✅
     - Agent rebalance functions ✅

[x] 2. Create TreasuryOracle.sol
     - Multi-asset price feeds ✅
     - IStork interface compatible ✅
     - APY tracking ✅

[x] 3. Create Mock tokens
     - MockUSDC (6 decimals) ✅
     - MockUSYC (4.7% APY simulation) ✅
     - MockWETH ✅

[x] 4. Deploy to Arc testnet ✅
[x] 5. Add TreasuryOracle provider to agent ✅
```

### Phase C: Dashboard Treasury UI (In Progress)

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

### Phase D: Agent Enhancement ✅ COMPLETE

```
[x] 1. Add GET_TREASURY_STATUS action ✅
     "I'm managing $X in the vault..."

[x] 2. Add EXPLAIN_STRATEGY action ✅
     "I bought RWAs because ETH dropped 5%..."

[x] 3. Add GET_PORTFOLIO_BREAKDOWN action ✅
     - Shows current holdings
     - Live prices from oracle

[x] 4. Add CALCULATE_DEPOSIT action ✅
     - Preview shares for deposit
     - Projected APY returns
```

### Phase E: Demo & Documentation (Pending)

```
[x] 1. Architecture diagram ✅

[ ] 2. Record 3-min demo video
     - User deposits USDC
     - Agent explains strategy
     - Show rebalancing
     - User redeems shares

[ ] 3. Product feedback document
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
│  │      ✅      │  │      ✅      │  │        ⏳            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NORBIT AI AGENT ✅                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Providers  │  │   Actions   │  │   Decision Engine       │ │
│  │ - CoinGecko │  │ - Swap      │  │ - Buy on dips (-5%)     │ │
│  │ - Stork     │  │ - Rebalance │  │ - Sell on rises (+5%)   │ │
│  │ - Treasury  │  │             │  │ - Target: 60% RWA       │ │
│  │ - Oracle ✅ │  │             │  │          25% USDC       │ │
│  └─────────────┘  └─────────────┘  │          15% WETH       │ │
│                                     └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SMART CONTRACTS (Arc Testnet) ✅              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    TREASURY SYSTEM                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │ │
│  │  │ OrbitVault   │  │TreasuryOracle│  │  Mock Tokens   │   │ │
│  │  │ (ERC4626) ✅ │  │  (IStork) ✅ │  │ USDC/USYC/WETH │   │ │
│  │  │              │  │              │  │      ✅        │   │ │
│  │  │ - deposit()  │  │ - getPriceData│ │                │   │ │
│  │  │ - withdraw() │  │ - getTreasury│  │ - 4.7% APY sim │   │ │
│  │  │ - rebalance  │  │   Prices()   │  │ - faucet()     │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    UNISWAP V4 SYSTEM                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │ │
│  │  │  OrbitHook   │  │ PoolManager  │  │   MockStork    │   │ │
│  │  │ (BaseHook) ✅│  │      ✅      │  │      ✅        │   │ │
│  │  │              │  │              │  │                │   │ │
│  │  │ - beforeSwap │  │ - swap()     │  │ - getPrice()   │   │ │
│  │  │ - afterSwap  │  │ - initialize │  │ - setPrice()   │   │ │
│  │  │ - staleness  │  │              │  │                │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Circle       │  │ CoinGecko    │  │ Arc Testnet RPC    │    │
│  │ Wallets ✅   │  │ API ✅       │  │       ✅           │    │
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

# Deploy Treasury (already done)
cd arc && source .env && forge script script/DeployTreasury.s.sol:DeployTreasury --rpc-url $ARC_TESTNET_RPC_URL --broadcast
```

### Key Files

```
agent/src/character.ts              # Norbit personality + RWA knowledge
agent/src/actions/rebalance.ts      # Decision logic
agent/src/actions/treasury.ts       # Treasury status/strategy actions ✅ NEW
agent/src/providers/stork.ts        # Oracle provider
agent/src/providers/treasuryOracle.ts # TreasuryOracle provider

arc/src/OrbitHook.sol               # Uniswap v4 hook (updated)
arc/src/OrbitVault.sol              # ERC4626 vault ✅ NEW
arc/src/TreasuryOracle.sol          # Multi-asset oracle ✅ NEW
arc/src/tokens/MockUSDC.sol         # Test USDC ✅ NEW
arc/src/tokens/MockUSYC.sol         # Yield-bearing token ✅ NEW
arc/src/tokens/MockWETH.sol         # Test WETH ✅ NEW
arc/script/DeployTreasury.s.sol     # Treasury deployment script

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
| Feb 8 | **OrbitVault deployed** | ✅ |
| Feb 8 | **TreasuryOracle deployed** | ✅ |
| Feb 8 | **Mock tokens deployed** | ✅ |
| Feb 8 | **Agent updated with RWA knowledge** | ✅ |
| Feb 8 | **TreasuryOracle provider added** | ✅ |
| Feb 8 | **Agent treasury actions added** | ✅ |
| Feb ? | Treasury UI | ⏳ |
| Feb ? | Demo video | ⏳ |
| Feb ? | Submission | ⏳ |

---

## What's Left

### High Priority (Before Submission)
1. [ ] Treasury dashboard UI components
2. [ ] Demo video (3 minutes)
3. [ ] Product feedback document

### Medium Priority (Nice to Have)
1. [ ] Dynamic fees in OrbitHook
2. [ ] Agent actions for vault interaction
3. [ ] Historical performance tracking

### Complete ✅
- Full treasury contract system
- Multi-asset oracle with yield tracking
- ERC4626 vault for deposits
- Agent with comprehensive RWA knowledge
- All contracts deployed to Arc testnet
- Build system working
- Agent treasury actions (status, strategy, portfolio, deposit calc)
