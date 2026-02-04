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
    formatEther,
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

// Deployed contracts
const TOKEN0_ADDRESS = '0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5' as Hex; // USDC
const TOKEN1_ADDRESS = '0xFC92d1864F6Fa41059c793935A295d29b63d9E46' as Hex; // WETH

// ERC20 ABI - just balanceOf
const ERC20_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

export const treasuryMonitorProvider: Provider = {
    name: 'TREASURY_MONITOR',
    description: 'Monitors treasury balances and provides portfolio insights',

    get: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State
    ): Promise<ProviderResult> => {
        try {
            // Get wallet address from env
            const walletAddress = process.env.WALLET_ADDRESS as Hex;
            if (!walletAddress) {
                return {
                    text: 'Treasury Monitor: Wallet address not configured',
                    values: {},
                    data: { error: 'WALLET_ADDRESS not set in environment' }
                };
            }

            const client = createPublicClient({
                chain: arcTestnet,
                transport: http()
            });

            // Read balances
            const [token0Balance, token1Balance, token0Symbol, token1Symbol] = await Promise.all([
                client.readContract({
                    address: TOKEN0_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                }),
                client.readContract({
                    address: TOKEN1_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                }),
                client.readContract({
                    address: TOKEN0_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'symbol'
                }),
                client.readContract({
                    address: TOKEN1_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: 'symbol'
                })
            ]);

            const formatted0 = formatEther(token0Balance as bigint);
            const formatted1 = formatEther(token1Balance as bigint);

            // Calculate total exposure (assuming 1:1 for simplicity in demo)
            const total = parseFloat(formatted0) + parseFloat(formatted1);
            const exposure0 = total > 0 ? (parseFloat(formatted0) / total * 100).toFixed(1) : '0.0';
            const exposure1 = total > 0 ? (parseFloat(formatted1) / total * 100).toFixed(1) : '0.0';

            logger.info(`Treasury Status: ${formatted0} ${token0Symbol}, ${formatted1} ${token1Symbol}`);

            return {
                text: `🏦 Treasury Status:\n\n💰 Balances:\n- ${token0Symbol}: ${parseFloat(formatted0).toFixed(4)} (${exposure0}%)\n- ${token1Symbol}: ${parseFloat(formatted1).toFixed(4)} (${exposure1}%)\n\n📊 Portfolio:\n- Total Value: ${total.toFixed(4)} units\n- Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
                values: {
                    token0Balance: formatted0,
                    token1Balance: formatted1,
                    token0Symbol,
                    token1Symbol,
                    token0Exposure: parseFloat(exposure0),
                    token1Exposure: parseFloat(exposure1),
                    totalValue: total,
                    walletAddress
                },
                data: {
                    balances: {
                        [token0Symbol as string]: formatted0,
                        [token1Symbol as string]: formatted1
                    },
                    exposure: {
                        [token0Symbol as string]: exposure0,
                        [token1Symbol as string]: exposure1
                    }
                }
            };

        } catch (error) {
            logger.error({ error }, 'Error monitoring treasury');
            return {
                text: `🏦 Treasury Monitor: Error fetching balances (${error instanceof Error ? error.message : String(error)})`,
                values: {},
                data: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    },
};
