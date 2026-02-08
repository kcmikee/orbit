Create an AI agent that can transfer and swap tokens using ElizaOS
Learn how to create an AI agent that can transfer and swap tokens.

Kingsley Okonkwo
Kingsley Okonkwo
5 mins
March 5, 2025
Create an AI agent that can transfer and swap tokens using ElizaOS
AI agents are autonomous programs designed to perceive their environment, process information, and take actions to achieve specific goals. These agents can range from simple rule-based bots to advanced machine learning systems capable of adapting and optimizing decisions over time.
In blockchain and DeFi, the rise of AI-powered automation has opened new doors for seamless and intelligent on-chain interactions. From automating tasks like trading, risk assessment, and liquidity management to executing complex smart contract interactions, AI agents are changing the way we build dapps by enhancing efficiency and reducing the need for human intervention.
With frameworks like ElizaOS, developers can build AI agents that interact with blockchain protocols and make real-time decisions on token swaps, arbitrage, and portfolio management. In this guide, we'll walk through the design, setup, and implementation of an AI agent that autonomously executes transactions using the ElizaOS built-in functionalities.
Prerequisites
Before we begin building, make sure you have the following setup:
Node.js (v23.3.0 or higher)
PNPM package manager
EVM-compatible wallet with testnet tokens – Needed for transaction execution (e.g., Sepolia ETH)
RPC provider URL – Connects your application to the blockchain, e.g Infura
API keys for the model provider – Required for AI interactions (e.g., OpenAI)
Once you have these ready, you're all set to start building your AI-powered blockchain agent.
Set up the ElizaOS environment
Clone the ElizaOS repository and check out the latest release.
git clone https://github.com/elizaOS/eliza.git
cd eliza
git checkout $(git describe --tags --abbrev=0)
Copy
You can switch to a stable release if the main version does not work. At the time of writing, the stable-11-30 version was recommended. To use it, run:
git fetch --all 
git checkout stable-11-30
Copy
Install dependencies
pnpm install
Configure environment variables
cp .env.example .env
# EVM
EVM_PRIVATE_KEY=
EVM_PROVIDER_URL=

# OPEN AI
OPENAI_API_KEY=
Copy
The details above are essential for ElizaOS to function properly:
EVM_PRIVATE_KEY: Wallet private key for signing transactions. This is the wallet from which Eliza will make token transfers and swaps, so ensure it’s preloaded with some Sepolia testnet ETH.
EVM_PROVIDER_URL: An RPC endpoint that connects to a blockchain node, enabling the AI agent to interact with the network.
OPENAI_API_KEY: Grants access to OpenAI models, enabling the AI agent to make intelligent decisions.
Note: Ensure your private key remains secure and is excluded from version control.
Eliza framework’s core concepts
The Eliza framework consists of four key components:
Characters: JSON configuration files that define the AI’s personality, behavior, and communication style
Agents: These are runtime modules responsible for managing memory, processing inputs, and executing behaviors
Providers: Data sources that supply context and real-time information to enhance interactions.
Actions: Executable functions that enable agents to perform tasks and interact with external systems.
Define a token swap and transfer character
Characters define an AI agent’s communication style, tone, and response consistency, making interactions more natural and engaging. A well-crafted character ensures the AI aligns with its intended purpose.
For this project, the main functionality we want to implement is token transfer and swapping, so we will define an Eliza character that governs how the AI agent interacts with blockchain protocols, executes transactions, and provides feedback to users. This character will ensure the agent communicates transaction details clearly, follows predefined security rules, and maintains a seamless user experience.
Create a new character file.
cd characters
touch degen.character.json
Copy
Copy the following content into the newly created file:
{
    "name": "ETHMaxxer",
    "clients": [],
    "modelProvider": "openai",
    "settings": {
        "chains": {
            "evm": ["sepolia"]
        }
    },
    "plugins": ["@elizaos/plugin-evm"],
    "bio": [
        "ETH Transfers",
        "ETHMaxxer is a crypto-native who lives and breathes Ethereum",
        "Believes every dip is a 'generational buying opportunity'",
        "Always sending ETH and reminding everyone 'gas fees are part of the game'",
        "Claims 'BTC is cool, but ETH is the future of finance'",
        "Frequently checks gas prices but still sends transactions anyway"
    ],
    "lore": [
        "Started stacking ETH in the early days, never looked back",
        "Loves discussing new L2s, staking, and Ethereum upgrades",
        "Firm believer in 'not your keys, not your coins'",
        "Survived multiple bull and bear cycles but still max bullish"
    ],
    "knowledge": [
        "Sending ETH transactions",
        "Gas fee optimization",
        "Ethereum staking",
        "Layer 2 scaling solutions",
        "DeFi applications",
        "Smart contract risks",
        "On-chain security",
        "Bridging assets",
        "Crypto market trends"
    ],
    "messageExamples": [
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "How do I send ETH?"
                }
            },
            {
                "user": "ETHMaxxer",
                "content": {
                    "text": "ser, just fire up your wallet, enter the recipient, and set that gas. if it's an L1 tx, brace for the fees  but ngl, sending ETH is always worth it ",
                    "action": "SEND_ETH"
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Gas fees are high, what do I do?"
                }
            },
            {
                "user": "ETHMaxxer",
                "content": {
                    "text": "fren, welcome to the ETH experience . either wait for a low-gas window, use an L2 like Arbitrum, or just send it and embrace the pain. ngmi if you're scared of gas fees "
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "Is ETH going up?"
                }
            },
            {
                "user": "ETHMaxxer",
                "content": {
                    "text": "anon, ETH is always going up... eventually. if not today, then after the next hard fork or bull cycle. remember, '1 ETH = 1 ETH', just hodl "
                }
            }
        ]
    ],
    "postExamples": [
        "gas is pain, but ETH is life ",
        "sending ETH and feeling rich, until I check my gas fees ",
        "L2s are cool, but real maxxers still send ETH on mainnet "
    ],
    "topics": [
        "eth_transfers",
        "ethereum_news",
        "gas_fees",
        "staking",
        "crypto_markets"
    ],
    "style": {
        "all": [
            "Crypto-maximalist",
            "ETH-focused",
            "Slightly degen",
            "Loves talking about gas fees and upgrades"
        ],
        "chat": [
            "Casual",
            "Crypto-slang heavy",
            "Slightly memetic",
            "Uses emojis frequently"
        ],
        "post": ["Short", "Bullish", "Relatable", "Memetic"]
    },
    "adjectives": [
        "ETH-maxi",
        "Bullish",
        "Crypto-native",
        "Gas-tolerant",
        "Future-focused",
        "Layer 2 curious"
    ]
}
Copy
  The above file defines the configuration for an AI agent named ETHMaxxer, specifying "modelProvider": "openai" and setting Sepolia as the designated blockchain network.
Agents
Agents in the Eliza framework are the core runtime components that bring AI characters to life. They manage behaviors and interactions through the AgentRuntime class. Several key components are required for the AgentRuntime class to function properly, some of which are handled by the Eliza framework out of the box:
Database adapter: Handles storage and retrieval of information for AI agents, including memory storage, relationship tracking, and knowledge management.
Plugins: Extend the functionality of AI agents, enabling integration with external services like blockchain and social media. In this project, we specify our AI agent to use @elizaos/plugin-evm to interact with the blockchain.
Model provider: Defines the AI model source for processing and generating responses. Available options include Anthropic, Grok, and others, but for this project, we’ve opted for OpenAI, as defined in our character file.
Authentication token: Required for the selected model provider. This should be passed as an environment variable, such as OPENAI_API_KEY.
Character configuration file: The character file we defined earlier, which outlines the AI agent’s traits and behavior.
All these components are defined in the /agent/src/index.ts folder. The relevant AgentRuntime code snippet for our agent is as follows:
 
return new AgentRuntime({
        databaseAdapter: db,
        token,
        modelProvider: character.modelProvider,
        evaluators: [],
        character,
        plugins: [
            getSecret(character, "EVM_PUBLIC_KEY") ||
            (getSecret(character, "WALLET_PUBLIC_KEY") &&
                getSecret(character, "WALLET_PUBLIC_KEY")?.startsWith("0x"))
                ? evmPlugin
                : null
        ]
})
Copy
Providers
Providers handle specialized functionality like wallet integrations, blockchain interactions, and data access, ensuring AI agents can seamlessly connect with external systems. They act as gateways for executing transactions, retrieving real-time data, and managing interactions across different services.
In @elizaos/plugin-evm, providers enable AI agents to interact with EVM-compatible blockchains, allowing them to send transactions, query smart contracts, and monitor blockchain activity. By leveraging RPC endpoints from services like Infura, the agent can execute on-chain actions without running a dedicated node.
Here's how providers are implemented in the @elizaos/plugin-evm:
export class WalletProvider {
    private cache: NodeCache;
    private cacheKey: string = "evm/wallet";
    private currentChain: SupportedChain = "mainnet";
    private CACHE_EXPIRY_SEC = 5;
    chains: Record<string, Chain> = { ...viemChains };
    account: PrivateKeyAccount;
    constructor(
        accountOrPrivateKey: PrivateKeyAccount | `0x${string}`,
        private cacheManager: ICacheManager,
        chains?: Record<string, Chain>
    ) {
        this.setAccount(accountOrPrivateKey);
        this.setChains(chains);
        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
        this.cache = new NodeCache({ stdTTL: this.CACHE_EXPIRY_SEC });
    }
    getAddress(): Address {
        return this.account.address;
    }
    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }
    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const transport = this.createHttpTransport(chainName);
        const publicClient = createPublicClient({
            chain: this.chains[chainName],
            transport,
        });
        return publicClient;
    }
    getWalletClient(chainName: SupportedChain): WalletClient {
        const transport = this.createHttpTransport(chainName);
        const walletClient = createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });
        return walletClient;
    }
    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];
        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }
        return chain;
    }
    async getWalletBalance(): Promise<string | null> {
        const cacheKey = "walletBalance_" + this.currentChain;
        const cachedData = await this.getCachedData<string>(cacheKey);
        if (cachedData) {
            elizaLogger.log(
                "Returning cached wallet balance for chain: " +
                    this.currentChain
            );
            return cachedData;
        }
        try {
            const client = this.getPublicClient(this.currentChain);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            const balanceFormatted = formatUnits(balance, 18);
            this.setCachedData<string>(cacheKey, balanceFormatted);
            elizaLogger.log(
                "Wallet balance cached for chain: ",
                this.currentChain
            );
            return balanceFormatted;
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }
    async getWalletBalanceForChain(
        chainName: SupportedChain
    ): Promise<string | null> {
        try {
            const client = this.getPublicClient(chainName);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }
    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }  
}
Copy
Actions
Actions define the specific behaviors that AI agents can execute, enabling them to interact with external systems, process requests, and automate tasks. Each action is designed to perform a distinct function, such as sending transactions, retrieving data, or executing smart contract calls, ensuring the agent operates efficiently within its environment.
In @elizaos/plugin-evm, actions facilitate token transfers, swaps, and blockchain interactions, allowing AI agents to execute transactions directly on EVM-compatible networks. These actions are triggered by user inputs or predefined logic, ensuring seamless execution of blockchain-related operations.
Here's how a token transfer action is implemented in the @elizaos/plugin-evm:
 async transfer(params: TransferParams): Promise<Transaction> {
        console.log(
            `Transferring: ${params.amount} tokens to (${params.toAddress} on ${params.fromChain})`
        );
        if (!params.data) {
            params.data = "0x";
        }
        this.walletProvider.switchChain(params.fromChain);
        const walletClient = this.walletProvider.getWalletClient(
            params.fromChain
        );
        try {
            const hash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: params.toAddress,
                value: parseEther(params.amount),
                data: params.data as Hex,
                kzg: {
                    blobToKzgCommitment: function (_: ByteArray): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                    computeBlobKzgProof: function (
                        _blob: ByteArray,
                        _commitment: ByteArray
                    ): ByteArray {
                        throw new Error("Function not implemented.");
                    },
                },
                chain: undefined,
            });
            return {
                hash,
                from: walletClient.account.address,
                to: params.toAddress,
                value: parseEther(params.amount),
                data: params.data as Hex,
            };
        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }
Copy
Now that we’ve provided the environment variables, character file and specified the Eliza plugin to use, let’s tie everything together and test our AI agent.
Build project
pnpm build
Run character
pnpm start --character="characters/degen.character.json"
Start client
pnpm start:client
Now, let’s interact with our agent and ask it to perform specific tasks.



Conclusion
Building an AI agent that interacts with Ethereum and EVM-compatible blockchains opens up new possibilities for automated and intelligent on-chain interactions. This guide walked through defining Characters, Agents, Providers, and Actions, enabling the agent to transfer and swap tokens autonomously.
By leveraging ElizaOS’s modular framework, developers can create AI-powered DeFi assistants, trading bots, or portfolio managers that interact seamlessly with blockchain networks. Now that you have the foundation, experiment with expanding its capabilities, refining its logic, and integrating new features to enhance on-chain automation.