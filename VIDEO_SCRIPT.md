# Orbit Project Overview - Video Script

## Introduction (0:00 - 0:30)
- **Visual:** Orbit Logo / Project Splash Screen
- **Audio:** "Welcome to Orbit, an intelligent DeFi management system. We've built a three-pillar architecture to automate treasury operations: The Strategy Engine (Arc), The Autonomous Agent (Norbit), and the Execution Layer (Uniswap V4 Hooks)."

## Part 1: Arc - The Strategy Engine (0:30 - 1:30)
- **Visual:** Code snippets of `OrbitVault.sol` or `StrategyManager.sol`
- **Audio:** "First, let's talk about Arc. This is our on-chain strategy engine.
    - It acts as the backbone, managing user deposits and deploying capital.
    - Modular architecture allows us to plug in different yield strategies.
    - Key component: `OrbitVault` which handles the accounting and safety checks before any funds move."

## Part 2: Norbit - The Autonomous Agent (1:30 - 2:30)
- **Visual:** ElizaOS Agent logs, Chat Interface showing "Deposit" action
- **Audio:** "Next is Norbit, our autonomous agent built on ElizaOS.
    - Norbit isn't just a chatbot; it's a treasury manager.
    - It monitors market conditions via CoinGecko and on-chain data.
    - Decision making: It decides *when* to rebalance or execute trades based on predefined risk parameters.
    - Interaction: We just implemented a seamless 'Deposit' flow where users can simply ask to deposit, and Norbit handles the intent, popping up the correct UI modal."

## Part 3: Uniswap V4 Hook - The Execution Layer (2:30 - 3:30)
- **Visual:** Uniswap V4 hook diagram, `OrbitHook.sol` code
- **Audio:** "Finally, the Execution Layer. We utilize Uniswap V4 Hooks for efficient capital efficiency.
    - `OrbitHook.sol`: intercepts swaps to perform just-in-time liquidity provisioning or dynamic fee adjustments.
    - This allows our strategy to react instantly to market volume without manual intervention.
    - It tightly integrates with the `OrbitVault` to ensure capital is always working."

## Conclusion (3:30 - 4:00)
- **Visual:** High-level architecture diagram connecting all three
- **Audio:** "Together, these three components create a self-driving treasury: Arc manages the rules, the Hook handles the execution, and Norbit provides the intelligence. This is the future of automated DeFi management."
