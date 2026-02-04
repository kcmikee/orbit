# Testing ElizaOS Chat Interface

## Quick Test Commands

To test if the agent works through chat UI:

```bash
cd agent
elizaos dev
```

Or with bun:
```bash
cd agent
bun run dev
```

## Expected Chat Interactions

Once the agent is running, you can interact via chat:

### Test 1: Check Market Price
**User:** "What's the current ETH price?"
**Expected:** Agent calls CoinGecko provider and reports real-time price

### Test 2: Check Treasury
**User:** "Show me the treasury status"
**Expected:** Agent calls treasury monitor and shows balances

### Test 3: Request Analysis
**User:** "Should we rebalance the portfolio?"
**Expected:** Agent runs autonomous decision engine and explains reasoning

### Test 4: Execute Rebalance
**User:** "Execute autonomous rebalancing"
**Expected:** Agent analyzes market, makes decision, and executes if needed

## How Providers Work in Chat

ElizaOS automatically injects provider data into the conversation context:
- `coinGeckoPriceProvider` → Adds market data to context
- `storkPriceProvider` → Adds oracle price to context  
- `treasuryMonitorProvider` → Adds portfolio state to context

The agent can reference this data when responding to questions.

## How Actions Work in Chat

Actions are triggered by user messages that match similes:
- `EXECUTE_SWAP` → Triggered by "swap", "trade", "buy", "sell"
- `AUTONOMOUS_REBALANCE` → Triggered by "rebalance", "auto trade", "optimize"

## Testing Without Full ElizaOS

If you just want to test the core logic without the chat UI, use:
```bash
# Test providers only
bun run test-providers.ts

# Test autonomous decision
bun run test-autonomous.ts

# Test everything
bun run verify-all.ts
```
