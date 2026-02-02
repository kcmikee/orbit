import {
    type IAgentRuntime,
    type Memory,
    type Action,
    type HandlerCallback,
    type State,
    type ActionResult,
    logger,
} from '@elizaos/core';
import { 
    createWalletClient, 
    http, 
    publicActions, 
    getContract, 
    parseEther,
    type Hex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arc } from 'viem/chains'; // Likely need to define custom chain if not in viem/chains, Arc Testnet might not be standard. using generic definition below.
import poolSwapTestAbi from '../abis/PoolSwapTest.json';

// --- Configuration ---
const ROUTER_ADDRESS = '0xd008402c0ff6ca1f2e60e8df12324540e402ac5e';
const TOKEN0 = '0x8Ad8467aDb93F705ADB008f2719c16a2733Df758';
const TOKEN1 = '0xb16cadd174034aBAB6af36DC8320714e35a15f25';
const HOOK = '0x61646A74c7eEEFCf870eBd0a9c239249FF4cC080';

// Arc Testnet Chain Definition
const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.ARC_TESTNET_RPC_URL || process.env.EVM_PROVIDER_URL || 'https://rpc.testnet.arc.network'] },
    },
    testnet: true,
};

export const executeSwapAction: Action = {
    name: 'EXECUTE_SWAP',
    similes: ['SWAP_TOKENS', 'TRADE_ASSETS', 'BUY_ETH', 'SELL_ETH'],
    description: 'Executes a swap on the Orbit Pool (Uniswap V4) using the OrbitHook.',
    
    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        // Check if private key is configured
        return !!(process.env.EVM_PRIVATE_KEY || process.env.PRIVATE_KEY);
    },

    handler: async (
        _runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ): Promise<ActionResult> => {
        try {
            logger.info('Executing Swap via OrbitHook...');
            
            if (callback) {
                callback({
                    text: 'Initiating swap on Arc Testnet...',
                    action: 'EXECUTE_SWAP',
                    source: message.content.source,
                });
            }

            const privateKey = (process.env.EVM_PRIVATE_KEY || process.env.PRIVATE_KEY) as Hex;
            if (!privateKey) throw new Error('Private key not found');

            const account = privateKeyToAccount(privateKey);
            const client = createWalletClient({
                account,
                chain: arcTestnet,
                transport: http()
            }).extend(publicActions);

            // Pool Key
            const key = {
                currency0: TOKEN0,
                currency1: TOKEN1,
                fee: 3000,
                tickSpacing: 60,
                hooks: HOOK
            };

            // Swap Params (Exact Input 0.01 for now as a demo)
            // In a real agent, we'd parse this from the message content
            const zeroForOne = true; 
            const amountSpecified = parseEther('-0.01'); // Negative for exact input
            
            // sqrtPriceLimitX96 (Example limits)
            const MIN_SQRT_PRICE = 4295128739n + 1n;
            const MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342n - 1n;
            const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE : MAX_SQRT_PRICE;

            const params = {
                zeroForOne,
                amountSpecified: amountSpecified,
                sqrtPriceLimitX96
            };

            const testSettings = {
                takeClaims: false,
                settleUsingBurn: false
            };

            const hookData = '0x'; // No specific hook data needed for this trade, OrbitHook checks Pyth internally

            // Execute Swap
            // Note: In strict V4, we probably need IO allowance/minting. 
            // For this MVP, we assume the wallet has Mock Tokens minted and approved to the router.
            // (We might need an approval step here if it fails).
            
            const hash = await client.writeContract({
                address: ROUTER_ADDRESS as Hex,
                abi: poolSwapTestAbi,
                functionName: 'swap',
                args: [key, params, testSettings, hookData]
            });

            logger.info(`Swap submitted. Hash: ${hash}`);

            await client.waitForTransactionReceipt({ hash });

            if (callback) {
                callback({
                    text: `Swap executed successfully! Tx Hash: ${hash}\nExplorer: https://explorer.testnet.arc.network/tx/${hash}`,
                    action: 'EXECUTE_SWAP_SUCCESS',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: `Swap executed: ${hash}`,
                data: { hash }
            };

        } catch (error) {
            logger.error('Swap Failed', error);
            if (callback) {
                callback({
                    text: `Swap failed: ${error instanceof Error ? error.message : String(error)}`,
                    action: 'EXECUTE_SWAP_FAILED',
                    source: message.content.source,
                });
            }
            return {
                success: false,
                text: 'Swap failed',
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },
    examples: [
        [
            {
                name: '{{name1}}',
                content: { text: 'Execute a swap on Orbit' }
            },
            {
                name: 'Eliza',
                content: { text: 'Initiating swap...', action: 'EXECUTE_SWAP' }
            }
        ]
    ]
};
