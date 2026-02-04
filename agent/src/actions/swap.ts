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
    parseEther,
    type Hex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import poolSwapTestAbi from '../abis/PoolSwapTest.json';

// --- UPDATED DEPLOYMENT ADDRESSES (from latest deploy) ---
const POOL_MANAGER_ADDRESS = '0xE95946D2BE744fCA83f421DF10615A4fCabD77Ff' as Hex;
const SWAP_ROUTER_ADDRESS = '0x5ed07738cA8398da3008c8320286CD1ddb8C798D' as Hex; // From Swap.s.sol deployment
const TOKEN0_ADDRESS = '0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5' as Hex;
const TOKEN1_ADDRESS = '0xFC92d1864F6Fa41059c793935A295d29b63d9E46' as Hex;
const HOOK_ADDRESS = '0x93031545015f847FC85CD9f8232B742e5188c080' as Hex;

// Arc Testnet Chain Definition
const arcTestnet = {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'] },
    },
    testnet: true,
};

export const executeSwapAction: Action = {
    name: 'EXECUTE_SWAP',
    similes: ['SWAP_TOKENS', 'TRADE_ASSETS', 'BUY_ETH', 'SELL_ETH', 'REBALANCE'],
    description: 'Executes a swap on the Orbit Pool (Uniswap V4) using the OrbitHook with Stork oracle validation.',
    
    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        // Check if private key is configured
        const hasKey = !!(process.env.EVM_PRIVATE_KEY || process.env.PRIVATE_KEY);
        if (!hasKey) {
            logger.warn('Private key not found in environment');
        }
        return hasKey;
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
            logger.info('🔄 Executing Swap via OrbitHook + Stork Oracle...');
            
            if (callback) {
                callback({
                    text: '💫 Initiating autonomous swap on Arc Testnet...\n📊 OrbitHook will validate Stork oracle price',
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

            logger.info(`Wallet: ${account.address}`);

            // Pool Key
            const key = {
                currency0: TOKEN0_ADDRESS,
                currency1: TOKEN1_ADDRESS,
                fee: 3000,
                tickSpacing: 60,
                hooks: HOOK_ADDRESS
            };

            // Swap Params
            // TODO: Make this dynamic based on agent decision logic
            const zeroForOne = true;  // Swap TOKEN0 -> TOKEN1
            const amountSpecified = parseEther('-0.01'); // Exact Input: 0.01 tokens
            
            // sqrtPriceLimitX96 (Price limits for safety)
            const MIN_SQRT_PRICE = 4295128739n + 1n;
            const MAX_SQRT_PRICE = 1461446703485210103287273052203988822378723970342n - 1n;
            const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE : MAX_SQRT_PRICE;

            const params = {
                zeroForOne,
                amountSpecified,
                sqrtPriceLimitX96
            };

            const testSettings = {
                takeClaims: false,
                settleUsingBurn: false
            };

            const hookData = '0x' as Hex; // OrbitHook checks Stork oracle internally

            logger.info('📤 Submitting swap transaction...');

            // Execute Swap through PoolSwapTest router
            const hash = await client.writeContract({
                address: SWAP_ROUTER_ADDRESS,
                abi: poolSwapTestAbi,
                functionName: 'swap',
                args: [key, params, testSettings, hookData]
            });

            logger.info(`✅ Swap submitted! Hash: ${hash}`);

            if (callback) {
                callback({
                    text: `⏳ Transaction submitted: ${hash}\nWaiting for confirmation...`,
                    action: 'EXECUTE_SWAP_PENDING',
                    source: message.content.source,
                });
            }

            // Wait for transaction
            const receipt = await client.waitForTransactionReceipt({ hash });

            logger.info(`✅ Swap confirmed in block ${receipt.blockNumber}`);

            if (callback) {
                callback({
                    text: `✅ Swap executed successfully!\n\n📝 Details:\n- Tx Hash: ${hash}\n- Block: ${receipt.blockNumber}\n- Gas Used: ${receipt.gasUsed}\n\n🔍 Explorer: https://testnet.arcscan.app/tx/${hash}`,
                    action: 'EXECUTE_SWAP_SUCCESS',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: `Swap successful: ${hash}`,
                values: {
                    hash,
                    blockNumber: receipt.blockNumber.toString(),
                    gasUsed: receipt.gasUsed.toString(),
                    status: receipt.status
                },
                data: { 
                    hash,
                    receipt,
                    explorerUrl: `https://testnet.arcscan.app/tx/${hash}`
                }
            };

        } catch (error) {
            logger.error('❌ Swap Failed', error);
            
            // Extract useful error message
            let errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes('OrbitHook')) {
                errorMsg = '🚫 Hook validation failed - likely oracle price issue';
            }
            
            if (callback) {
                callback({
                    text: `❌ Swap failed: ${errorMsg}`,
                    action: 'EXECUTE_SWAP_FAILED',
                    source: message.content.source,
                });
            }
            
            return {
                success: false,
                text: `Swap failed: ${errorMsg}`,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },
    
    examples: [
        [
            {
                name: '{{name1}}',
                content: { text: 'Execute a swap on the Orbit pool' }
            },
            {
                name: 'OrbitAgent',
                content: { text: '💫 Initiating autonomous swap...', action: 'EXECUTE_SWAP' }
            }
        ],
        [
            {
                name: '{{name1}}',
                content: { text: 'Rebalance the treasury' }
            },
            {
                name: 'OrbitAgent',
                content: { text: '🔄 Executing treasury rebalance via Uniswap v4...', action: 'EXECUTE_SWAP' }
            }
        ]
    ]
};
