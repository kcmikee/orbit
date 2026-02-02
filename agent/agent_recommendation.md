# Arc Agent Integration Recommendation

## Validation Findings

1.  **Arc Official Support**: Arc does **not** have a proprietary "Agent Kit". Their documentation recommends building **Autonomous Wallet Agents** using **LangChain** combined with **Circle Developer Controlled Wallets**.
2.  **ElizaOS on Arc**: Arc is EVM-compatible. ElizaOS has a robust `@elizaos/plugin-evm` that works with any EVM chain (Arbitrum, Base, etc.). We can simply configure it with Arc's RPC URL `https://rpc.testnet.arc.network`.

## Recommendation: Pivot to ElizaOS

Since you have interest in ElizaOS (and it has superior features for "personality" and "social" vs raw LangChain), I recommend we use **ElizaOS** as the core "Brain".

### Proposed Stack
*   **Core**: ElizaOS (`@elizaos/core`)
*   **Chain Interaction**: `@elizaos/plugin-evm` (Configured for Arc)
*   **Decision Logic**: Custom Plugin (`plugin-orbit`) to fetch Stork prices and trigger swaps.
*   **Wallet**: Circle Developer Wallet (integrated via the custom plugin or raw EVM plugin).

### Next Steps
1.  Initialize ElizaOS in the `agent/` folder.
2.  Install `@elizaos/plugin-evm`.
3.  Create a custom `orbit.character.ts`.
