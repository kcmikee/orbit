# Orbit Project - Comprehensive Audit Findings

> **Generated:** February 7, 2026
> **Purpose:** Track all issues, discrepancies, and improvements needed before production/demo

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Agent Folder Findings](#1-agent-folder-findings)
3. [Arc Contracts Findings](#2-arc-contracts-findings)
4. [Web Dashboard Findings](#3-web-dashboard-findings)
5. [Scripts Folder Findings](#4-scripts-folder-findings)
6. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
7. [Priority Action Items](#6-priority-action-items)

---

## Project Overview

**Orbit** is an Agentic RWA Treasury Manager - an autonomous AI agent that manages Real-World Assets on the Arc L1 blockchain, using Circle Wallets, Stork/Pyth oracles, and Uniswap v4.

### Repository Structure
```
orbit/
├── agent/     # ElizaOS-based AI Agent ("Norbit")
├── arc/       # Solidity Smart Contracts (Foundry)
├── web/       # Next.js Dashboard
└── scripts/   # Python utilities for oracle integration
```

---

## 1. AGENT FOLDER FINDINGS

### Architecture
- **Framework**: ElizaOS v1.7.2 with TypeScript
- **Agent Name**: "Norbit" - autonomous treasury manager
- **Decision Logic**: BUY on 5% dips, SELL on 5% rises, REBALANCE at 70% exposure

### Critical Issues

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| CRITICAL | **Exposed private key in .env** | `.env` file committed to git | [ ] |
| CRITICAL | **Exposed OpenAI API key** | `.env` file | [ ] |
| CRITICAL | **Exposed ElizaOS API key** | `.env` file | [ ] |
| CRITICAL | **Build errors** - Missing `orbit.cron.ts` module | `src/plugins/orbit/index.ts:4` | [ ] |
| CRITICAL | Type errors in Pyth provider (`publish_time` is unknown) | `src/providers/pyth.ts:44-47` | [ ] |
| HIGH | Hardcoded swap amount (0.01) - TODO left in code | `src/actions/swap.ts:93` | [ ] |
| HIGH | **Dead code** - 290 lines unused starter plugin | `src/plugin.ts` | [ ] |
| HIGH | 14 files fail Prettier formatting | Multiple files | [ ] |
| MEDIUM | Mock data fallback without warning to user | `src/plugins/orbit/services/orbitService.ts:129` | [ ] |
| MEDIUM | No input validation on external data | `src/actions/rebalance.ts` | [ ] |
| MEDIUM | Unvalidated contract addresses (no checksum) | Multiple files | [ ] |
| LOW | Type casting abuse (`as unknown as Record<...>`) | `getTreasuryStats.ts:52` | [ ] |
| LOW | Inconsistent naming patterns | Providers | [ ] |

### Missing Functionality

| Feature | Status | Priority |
|---------|--------|----------|
| Dynamic trade size calculation | Not implemented | HIGH |
| Periodic cron-based rebalancing | Referenced but file missing | HIGH |
| Risk management (max loss, cooldown) | Not implemented | MEDIUM |
| Historical data tracking | Not implemented | MEDIUM |
| Multi-token portfolio support | Not implemented | LOW |
| Gas price optimization | Not implemented | LOW |
| Transaction audit logging | Not implemented | LOW |

### Environment Variables Required
```env
OPENAI_API_KEY=         # For AI model
ARC_TESTNET_RPC_URL=    # Arc blockchain RPC
EVM_PRIVATE_KEY=        # Transaction signing (KEEP SECRET!)
WALLET_ADDRESS=         # Treasury wallet
ORBIT_HOOK_ADDRESS=     # Smart contract hook
COINGECKO_DEMO_API_KEY= # Market data
ELIZAOS_API_KEY=        # ElizaOS service
```

---

## 2. ARC CONTRACTS FINDINGS

### Architecture
- **Framework**: Foundry with Uniswap v4 integration
- **Main Contract**: `OrbitHook.sol` - Uniswap v4 hook with Stork oracle
- **Total Production Code**: 102 lines (minimal)

### Contract Inventory

| Contract | Lines | Purpose | Status |
|----------|-------|---------|--------|
| OrbitHook.sol | 78 | Uniswap v4 hook with Stork oracle | Production |
| HelloArchitect.sol | 24 | Demo contract | Test only |
| MockERC20.sol | 16 | Test token | Test only |
| MockStork.sol | 34 | Oracle mock | Test only |

### Critical Issues

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| CRITICAL | **Using unsafe oracle method** - no staleness check | `OrbitHook.sol:59` | [ ] |
| CRITICAL | Staleness validation is **commented out** | `OrbitHook.sol:64-66` | [ ] |
| HIGH | No flash loan protection | Hook contract | [ ] |
| HIGH | MockStork used in deployment script (not real oracle) | `DeployAndSwap.s.sol` | [ ] |
| HIGH | No price bounds validation (only checks > 0) | `_beforeSwap()` | [ ] |
| MEDIUM | No event logging for swaps/oracle queries | OrbitHook.sol | [ ] |
| MEDIUM | No access control or pause mechanism | OrbitHook.sol | [ ] |
| MEDIUM | No circuit breaker for extreme prices | OrbitHook.sol | [ ] |
| LOW | Magic numbers not documented | Multiple files | [ ] |
| LOW | No NatSpec documentation | All contracts | [ ] |

### Test Coverage

| File | Tests | Coverage |
|------|-------|----------|
| OrbitHook.t.sol | 2 | ~30% |
| HelloArchitect.sol | 3 | 100% |

**Missing Tests:**
- [ ] `_beforeSwap()` execution flow
- [ ] PoolManager integration
- [ ] Staleness validation
- [ ] Edge cases (negative prices, overflow)
- [ ] Flash loan scenarios
- [ ] Multiple sequential swaps

### Missing Contracts (For Full RWA Treasury)

| Contract | Purpose | Priority |
|----------|---------|----------|
| **Vault.sol** | ERC4626 vault for deposits/withdrawals | CRITICAL |
| **ShareToken.sol** | ERC20 shares for depositors | CRITICAL |
| **TreasuryManager.sol** | Asset allocation logic | HIGH |
| **RedemptionNFT.sol** | NFT receipts for deposits | MEDIUM |
| Multi-hop routing | Complex swaps | LOW |
| Governance | DAO voting | LOW |

### Deployed Addresses (Arc Testnet)

```
PoolManager:  0xE95946D2BE744fCA83f421DF10615A4fCabD77Ff
OrbitHook:    0x93031545015f847FC85CD9f8232B742e5188c080
MockStork:    0xff39f62117656Ba09318E2F86467e4aF98526238
Token0 (USDC): 0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5
Token1 (WETH): 0xFC92d1864F6Fa41059c793935A295d29b63d9E46
```

---

## 3. WEB DASHBOARD FINDINGS

### Architecture
- **Framework**: Next.js 15.3.1 with React 19
- **Real-time**: Socket.IO for chat messaging
- **Wallet**: Circle Developer Controlled Wallets
- **Styling**: Tailwind CSS v4 beta

### Critical Issues

| Priority | Issue | Location | Status |
|----------|-------|----------|--------|
| CRITICAL | **Exposed API keys** (OpenAI, Circle) | `.env` file | [ ] |
| CRITICAL | **Socket.IO wrong default port** (4000 instead of 3000) | `src/lib/socketio-manager.ts:18` | [ ] |
| CRITICAL | No CSRF protection on API routes | `/api/*` routes | [ ] |
| HIGH | No error boundaries in Chat component | `src/components/chat-simple.tsx` | [ ] |
| HIGH | **120+ console.log statements** in production | chat-simple.tsx | [ ] |
| HIGH | TypeScript strict mode disabled | `tsconfig.json` | [ ] |
| HIGH | No input validation on API routes | All API routes | [ ] |
| MEDIUM | Race conditions in scroll logic | Multiple useEffects | [ ] |
| MEDIUM | 15+ runtime assertions in ChatMessages | `chat-messages.tsx` | [ ] |
| MEDIUM | No rate limiting on API routes | All routes | [ ] |
| MEDIUM | localStorage for sensitive tokens | Wallet session | [ ] |
| LOW | Tailwind v4 beta (stability risk) | package.json | [ ] |

### Test Coverage
- **Current**: 0% - No test files exist
- **vitest** configured but unused

### Missing Features

| Feature | Status | Priority |
|---------|--------|----------|
| Treasury dashboard (TVL, APY, holdings) | Not implemented | CRITICAL |
| Deposit USDC flow | Not implemented | CRITICAL |
| Share/NFT balance display | Not implemented | CRITICAL |
| Redemption flow | Not implemented | CRITICAL |
| Message search | Not implemented | MEDIUM |
| Offline mode | Not implemented | MEDIUM |
| Dark mode toggle | CSS exists, no UI | LOW |
| Keyboard shortcuts | Not implemented | LOW |
| Session pagination | Not implemented | LOW |

### API Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/eliza/[...path]` | CORS proxy to ElizaOS | Working |
| `/api/chat-session/*` | Session management | Working |
| `/api/dm-channel/*` | DM channel management | Working |
| `/api/endpoints` | Circle wallet integration | Working |
| `/api/treasury/*` | Treasury stats | NOT IMPLEMENTED |
| `/api/deposit/*` | USDC deposits | NOT IMPLEMENTED |
| `/api/redeem/*` | Share redemption | NOT IMPLEMENTED |

---

## 4. SCRIPTS FOLDER FINDINGS

### Scripts

| File | Purpose | Issues |
|------|---------|--------|
| `fetch_and_push_stork.py` | Push Stork oracle prices to Arc | Hardcoded addresses, no retry logic, no logging |
| `verify_pyth.py` | Verify Pyth oracle on Arc | No error handling, hardcoded IDs |

### Issues

| Priority | Issue | Status |
|----------|-------|--------|
| HIGH | No logging framework (just print()) | [ ] |
| HIGH | No retry mechanisms for API calls | [ ] |
| HIGH | No tests | [ ] |
| MEDIUM | Inconsistent env variable loading | [ ] |
| MEDIUM | Hardcoded contract addresses | [ ] |
| LOW | No `.env.example` for scripts | [ ] |

---

## 5. CROSS-CUTTING CONCERNS

### Security Summary

| Issue | Severity | Components | Status |
|-------|----------|------------|--------|
| Exposed credentials in `.env` files | CRITICAL | Agent, Web | [ ] |
| Unsafe oracle reads (no staleness) | CRITICAL | Arc | [ ] |
| No CSRF protection | HIGH | Web | [ ] |
| No input validation | HIGH | Web, Agent | [ ] |
| localStorage for tokens | MEDIUM | Web | [ ] |
| No rate limiting | MEDIUM | Web | [ ] |

### Missing Infrastructure

| Item | Status |
|------|--------|
| CI/CD pipeline (GitHub Actions) | NOT IMPLEMENTED |
| Pre-commit hooks | NOT IMPLEMENTED |
| Automated testing | NOT IMPLEMENTED |
| Deployment automation | NOT IMPLEMENTED |

### Configuration Inconsistencies

| Issue | Details |
|-------|---------|
| Package managers | Agent uses `bun`, Web has both npm and bun lock files |
| Env loading | Scripts use different patterns |
| Port defaults | Socket.IO defaults to wrong port |

### Documentation Quality

| File | Quality | Notes |
|------|---------|-------|
| README.md | Minimal | Only 18 lines, needs expansion |
| task.md | Good | Clear progress tracking |
| implementations.md | Excellent | Detailed architecture |
| deploy.md | Good | Step-by-step guide |
| issues.md | Good | GitHub issue templates |

---

## 6. PRIORITY ACTION ITEMS

### CRITICAL (Must Fix Immediately)

- [ ] **Rotate all exposed API keys** (OpenAI, Circle, ElizaOS, private key)
- [ ] **Add `.env` to `.gitignore`** and remove from git history
- [ ] **Enable oracle staleness validation** in OrbitHook.sol
- [ ] **Fix Socket.IO port** default (change 4000 to 3000)
- [ ] **Fix TypeScript build errors** (missing module, type errors)

### HIGH PRIORITY (Fix Before Demo/Production)

- [ ] Delete unused `src/plugin.ts` (290 lines dead code)
- [ ] Add error boundaries to Chat component
- [ ] Remove 120+ console.log statements
- [ ] Enable TypeScript strict mode
- [ ] Add CSRF protection to API routes
- [ ] Implement dynamic swap amounts
- [ ] Add comprehensive tests

### MEDIUM PRIORITY (Should Fix)

- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Implement Vault system for RWA treasury (ERC4626)
- [ ] Add multi-oracle fallback mechanism
- [ ] Create troubleshooting documentation
- [ ] Standardize on single package manager
- [ ] Add architecture diagrams

### LOW PRIORITY (Nice to Have)

- [ ] Add keyboard shortcuts
- [ ] Implement dark mode toggle
- [ ] Add message search
- [ ] Session pagination
- [ ] Historical analytics

---

## Progress Tracking

Use this section to track fixes as they're completed:

```
[ ] = Not started
[~] = In progress
[x] = Completed
```

### Sprint 1: Security & Build Fixes
- [ ] Rotate API keys
- [ ] Fix .gitignore
- [ ] Fix build errors
- [ ] Enable oracle staleness

### Sprint 2: Core Functionality
- [ ] Implement Vault contract
- [ ] Add deposit flow
- [ ] Add share token
- [ ] Treasury dashboard

### Sprint 3: Polish & Testing
- [ ] Add tests
- [ ] CI/CD pipeline
- [ ] Documentation
- [ ] Demo video

---

*Last updated: February 7, 2026*
