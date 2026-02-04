import {
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
    type ProviderResult,
    logger,
} from '@elizaos/core';
import { 
    createPublicClient, 
    http,
    type Hex
} from 'viem';

// Arc Testnet Configuration
const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'] },
    },
    testnet: true,
};

// OrbitHook ABI - just the getPrice function we need
const ORBIT_HOOK_ABI = [
    {
        inputs: [],
        name: 'getPrice',
        outputs: [
            { name: 'price', type: 'int192' },
            { name: 'timestamp', type: 'uint64' }
        ],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Deployed contracts from latest deployment
const ORBIT_HOOK_ADDRESS = '0x93031545015f847FC85CD9f8232B742e5188c080' as Hex;

export const storkPriceProvider: Provider = {
    name: 'STORK_PRICE_PROVIDER',
    description: 'Provides real-time asset prices from Stork Oracle via OrbitHook',

    get: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State
    ): Promise<ProviderResult> => {
        try {
            const client = createPublicClient({
                chain: arcTestnet,
                transport: http()
            });

            // Read price from OrbitHook
            const [price, timestamp] = await client.readContract({
                address: ORBIT_HOOK_ADDRESS,
                abi: ORBIT_HOOK_ABI,
                functionName: 'getPrice'
            }) as [bigint, bigint];

            // Convert from smallest units (18 decimals) to readable price
            const formattedPrice = (Number(price) / 1e18).toFixed(2);
            
            // Convert timestamp from nanoseconds to milliseconds
            const timestampMs = Number(timestamp) / 1e6;
            const publishTime = new Date(timestampMs).toISOString();
            
            // Calculate staleness in seconds
            const staleness = (Date.now() - timestampMs) / 1000;

            logger.info(`Stork Price: $${formattedPrice}, Staleness: ${staleness.toFixed(1)}s`);

            return {
                text: `Stork Market Data (via OrbitHook):\n- ETH/USD: $${formattedPrice}\n- Timestamp: ${publishTime}\n- Staleness: ${staleness.toFixed(1)}s\n- Source: MockStork Oracle on Arc`,
                values: {
                    price: Number(formattedPrice),
                    priceRaw: price.toString(),
                    timestamp: Number(timestamp),
                    staleness: Number(staleness.toFixed(1)),
                    isStale: staleness > 3600 // Consider stale if > 1 hour
                },
                data: {
                    hookAddress: ORBIT_HOOK_ADDRESS,
                    service: 'Stork via OrbitHook',
                    chainId: arcTestnet.id
                }
            };

        } catch (error) {
            logger.error({ error }, 'Error fetching price from OrbitHook');
            return {
                text: `Stork Market Data: Error fetching prices (${error instanceof Error ? error.message : String(error)})`,
                values: {},
                data: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    },
};
