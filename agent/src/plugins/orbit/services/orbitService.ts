import { Service, type IAgentRuntime, logger } from '@elizaos/core';
import { createPublicClient, http, getAddress, defineChain } from 'viem';

// Define Arc Testnet Chain
const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'USDC',
        symbol: 'USDC',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.arc.network'],
        },
    },
    blockExplorers: {
        default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
    },
    testnet: true,
});

export interface TreasuryStats {
    tvl: string;
    apy: string;
    totalAssets: string;
}

export class OrbitService extends Service {
    static serviceType = 'ORBIT_SERVICE';
    capabilityDescription = 'Provides access to Orbit Protocol treasury data including TVL and APY.';
    private client;
    private hookAddress: `0x${string}`;

    constructor(runtime: IAgentRuntime) {
        super(runtime);
        const rawAddress = process.env.ORBIT_HOOK_ADDRESS || '0x0000000000000000000000000000000000000000';
        this.hookAddress = getAddress(rawAddress);
        
        // Initialize Viem Client with Custom Chain
        this.client = createPublicClient({
            chain: arcTestnet,
            transport: http(process.env.RPC_URL)
        });
    }

    async stop() {
        logger.info('Stopping Orbit Service instance...');
    }

    static async start(runtime: IAgentRuntime): Promise<OrbitService> {
        logger.info('Initializing Orbit Service...');
        return new OrbitService(runtime);
    }

    static async stop(_runtime: IAgentRuntime) {
        logger.info('Stopping Orbit Service...');
    }

    async getTreasuryStats(): Promise<TreasuryStats> {
        try {
            logger.info('Fetching Treasury Stats from Hook: ' + this.hookAddress);

            // 1. Get Pyth Address and PriceFeedId from Hook
            const hookAbi = [
                { inputs: [], name: "pyth", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
                { inputs: [], name: "priceFeedId", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" }
            ] as const;

            const [pythAddress, priceFeedId] = await Promise.all([
                this.client.readContract({
                    address: this.hookAddress,
                    abi: hookAbi,
                    functionName: 'pyth'
                }),
                this.client.readContract({
                    address: this.hookAddress,
                    abi: hookAbi,
                    functionName: 'priceFeedId'
                })
            ]);

            logger.info(`OrbitHook linked to Pyth at: ${pythAddress} for Feed: ${priceFeedId}`);

            // 2. Get Price from Pyth
            // Pyth ABI for getPrice
            const pythAbi = [
                {
                    inputs: [{ name: "id", type: "bytes32" }],
                    name: "getPrice",
                    outputs: [
                        {
                            components: [
                                { name: "price", type: "int64" },
                                { name: "conf", type: "uint64" },
                                { name: "expo", type: "int32" },
                                { name: "publishTime", type: "uint256" }
                            ],
                            name: "price",
                            type: "tuple"
                        }
                    ],
                    stateMutability: "view",
                    type: "function"
                }
            ] as const;

            const priceData = await this.client.readContract({
                address: pythAddress as `0x${string}`,
                abi: pythAbi,
                functionName: 'getPrice',
                args: [priceFeedId as `0x${string}`]
            });

            // 3. Format Price
            const price = Number(priceData.price) * (10 ** Number(priceData.expo));
            const formattedPrice = `$${price.toFixed(2)}`;

            return {
                tvl: "N/A (Hook Only)", 
                apy: formattedPrice + " (Asset Price)",
                totalAssets: "Oracle Feed: " + String(priceFeedId).substring(0, 10) + "..."
            };

        } catch (error) {
            logger.error('Failed to fetch data from blockchain:', error);
            // Fallback to mock if chain call fails (e.g. invalid RPC or contract)
            return {
                tvl: "$5,240,000 (Mock)",
                apy: "5.2% (Mock)",
                totalAssets: "USDC, sDai (Mock)"
            };
        }
    }
}
