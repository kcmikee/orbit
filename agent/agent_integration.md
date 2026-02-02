# Orbit Agent Integration Plan

## 1. Overview
We have transitioned from a Python-based script to a robust **ElizaOS Agent** (TypeScript/Node.js). This allows us to leverage specific "Plugins" for our DeFi logic.

**Current State**:
- **Agent Framework**: ElizaOS (v1.7.2)
- **Runtime**: Bun
- **Capabilities**: Currently "Hello World" (Default). Needs to be upgraded to "DeFi Portfolio Manager".

---

## 2. Oracle Strategy: Pyth Network (Pivot)

The user has opted to use **Pyth Network** instead of Stork to ensure a working live demo without waiting for restricted API keys.

### 🔄 Changes Required
1.  **Smart Contract (`OrbitHook.sol`)**:
    *   **Old**: `StorkConsumer` (Verifies Stork Signatures).
    *   **New**: `PythConsumer` (Calls `IPyth.getPrice` / `updatePriceFeeds`).
    *   **Action**: Install `pyth-sdk-solidity` and refactor the Hook.

2.  **Agent (`StorkPriceProvider` -> `PythPriceProvider`)**:
    *   **Source**: Fetch price updates from Pyth Hermes API (Public).
    *   **Action**: Implement `PythProvider` in ElizaOS to inject `price` for the Agent context and `priceUpdateData` for the transaction.

### ✅ Why Pyth works here
*   **Pull Oracle**: Like Stork, Pyth is a "Pull Oracle". The Agent fetches a signed "Update Blob" from the web and pushes it on-chain.
*   **Public Access**: Pyth's "Hermes" API is generally open for development without high-friction keys.
*   **On-Chain Safety**: The Hook still acts as a guard, verifying the Pyth signature on-chain.

---

## 3. Implementation Plan (ElizaOS + Contracts)

### A. Contract Refactor (`OrbitHook.sol`)
*   Replace `IStorkVerify` with `IPyth`.
*   Update `beforeSwap` to call `pyth.getPrice(priceFeedId)`.

### B. The "Orbit Plugin" (`agent/src/plugins/orbit/`)

#### **1. Provider: `PythPriceProvider`**
*   **Role**: Injects market data.
*   **Implementation**: Fetches from `https://hermes.pyth.network`.

#### **2. Action: `EXECUTE_SWAP`**
*   **Logic update**: When constructing the transaction, include the `pythUpdateData` (hex string) so the Hook can verify the price.

---

## 3. Implementation Plan (ElizaOS)

### A. The "Orbit Plugin" (`agent/src/plugin-orbit/`)
We will create a custom plugin to encapsulate our logic.

#### **1. Provider: `StorkPriceProvider`**
*   **Role**: Injects market data into the Agent's context.
*   **Behavior**: Periodically checks `ETH/USDC` price.
*   **Prompt Injection**: "The current market price of ETH is $2500. The spread is 0.1%."

#### **2. Action: `EXECUTE_SWAP`**
*   **Role**: The "Hands" of the Agent.
*   **Trigger**: User says "Swap 10 USDC for ETH".
*   **Logic**:
    1.  Get Quote.
    2.  **Sign Stork Update** (using the Provider data).
    3.  Call **Circle Wallet API** to execute the transaction on Arc.

#### **3. Action: `GET_BALANCE`**
*   **Role**: Checks Treasury health.
*   **Logic**: Calls `ERC20.balanceOf` on Arc.

---

## 4. Next Steps
1.  Create `agent/src/plugins/orbit.ts` (The skeleton).
2.  Implement `StorkPriceProvider` (Mock Mode).
3.  Implement `ExecuteSwapAction` (stubbed for Circle/Arc).
