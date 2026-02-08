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
    type Hex
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { coinGeckoPriceProvider } from '../providers/coingecko';
import { storkPriceProvider } from '../providers/stork';
import { treasuryMonitorProvider } from '../providers/treasury';
import { executeSwapAction } from './swap';

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

const MOCK_STORK_ADDRESS = process.env.MOCK_STORK_ADDRESS as Hex || '0xff39f62117656Ba09318E2F86467e4aF98526238' as Hex;

// MockStork ABI for updating price
const MOCK_STORK_ABI = [
    {
        inputs: [
            { name: '_val', type: 'int192' },
            { name: '_ts', type: 'uint64' }
        ],
        name: 'set',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

// Rebalancing strategy configuration
const STRATEGY_CONFIG = {
    // Price thresholds
    PRICE_DROP_THRESHOLD: -5.0,      // Buy when price drops >5%
    PRICE_RISE_THRESHOLD: 5.0,       // Sell when price rises >5%
    
    // Portfolio balance thresholds
    MAX_EXPOSURE: 70.0,              // Max % in single asset
    TARGET_BALANCE: 50.0,            // Target 50/50 split
    
    // Trade parameters
    TRADE_SIZE: '0.01',              // Size of rebalance trades
};

export const autonomousRebalanceAction: Action = {
    name: 'AUTONOMOUS_REBALANCE',
    similes: ['AUTO_TRADE', 'REBALANCE_PORTFOLIO', 'OPTIMIZE_TREASURY', 'RUN_DEMO', 'SIMULATE_REBALANCE'],
    description: 'Autonomously monitors market conditions and rebalances treasury based on price movements and exposure thresholds',
    
    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
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
            logger.info('🤖 Starting autonomous rebalancing analysis...');
            
            if (callback) {
                callback({
                    text: '🤖 Autonomous Agent Activated\n📊 Analyzing market conditions and treasury state...',
                    action: 'AUTONOMOUS_REBALANCE',
                    source: message.content.source,
                });
            }

            // DEMO MODE CHECK
            const isDemo = message.content.text?.toLowerCase().includes('demo') || 
                          message.content.text?.toLowerCase().includes('simulate');

            let realPrice, oraclePrice, change24h, token0Exposure, token1Exposure;

            if (isDemo) {
                logger.info('🎬 DEMO MODE ACTIVATED: Simulating market dip...');
                
                // MOCK DATA FOR DEMO
                realPrice = 2150.45;
                oraclePrice = 2280.00; // Old price
                change24h = -5.68;     // Force dip > 5%
                token0Exposure = 45.2;
                token1Exposure = 35.5;

                if (callback) {
                    callback({
                        text: '🎬 **DEMO MODE ACTIVATED**\n\n' +
                              'Simulating market conditions for demonstration...\n' +
                              '📉 Injecting 5.68% ETH price drop...',
                        action: 'DEMO_STARTED',
                        source: message.content.source,
                    });
                }
            } else {
                // REAL DATA
                // Step 1: Gather market intelligence
                const [coinGeckoData, storkData, treasuryData] = await Promise.all([
                    coinGeckoPriceProvider.get(_runtime, message, _state),
                    storkPriceProvider.get(_runtime, message, _state),
                    treasuryMonitorProvider.get(_runtime, message, _state)
                ]);

                realPrice = coinGeckoData.values?.price as number;
                oraclePrice = storkData.values?.price as number;
                change24h = coinGeckoData.values?.change24h as number;
                token0Exposure = treasuryData.values?.token0Exposure as number;
                token1Exposure = treasuryData.values?.token1Exposure as number;
            }

            logger.info(`Market Analysis: Real=$${realPrice}, Oracle=$${oraclePrice}, 24h=${change24h}%, Exposure=${token0Exposure}/${token1Exposure}`);

            // Step 2: Decision logic
            let decision = {
                shouldRebalance: false,
                reason: '',
                action: '',
                targetPrice: 0
            };

            // Check price-based triggers
            if (change24h <= STRATEGY_CONFIG.PRICE_DROP_THRESHOLD) {
                decision = {
                    shouldRebalance: true,
                    reason: `ETH dropped ${change24h.toFixed(2)}% in 24h (below ${STRATEGY_CONFIG.PRICE_DROP_THRESHOLD}% threshold)`,
                    action: 'BUY_ETH',
                    targetPrice: realPrice
                };
            } else if (change24h >= STRATEGY_CONFIG.PRICE_RISE_THRESHOLD) {
                decision = {
                    shouldRebalance: true,
                    reason: `ETH rose ${change24h.toFixed(2)}% in 24h (above ${STRATEGY_CONFIG.PRICE_RISE_THRESHOLD}% threshold)`,
                    action: 'SELL_ETH',
                    targetPrice: realPrice
                };
            }

            // Check exposure-based triggers
            if (token0Exposure > STRATEGY_CONFIG.MAX_EXPOSURE) {
                decision = {
                    shouldRebalance: true,
                    reason: `TOKEN0 exposure ${token0Exposure.toFixed(1)}% exceeds max ${STRATEGY_CONFIG.MAX_EXPOSURE}%`,
                    action: 'REBALANCE_TO_TOKEN1',
                    targetPrice: realPrice
                };
            } else if (token1Exposure > STRATEGY_CONFIG.MAX_EXPOSURE) {
                decision = {
                    shouldRebalance: true,
                    reason: `TOKEN1 exposure ${token1Exposure.toFixed(1)}% exceeds max ${STRATEGY_CONFIG.MAX_EXPOSURE}%`,
                    action: 'REBALANCE_TO_TOKEN0',
                    targetPrice: realPrice
                };
            }

            if (callback) {
                callback({
                    text: `📊 Market Analysis Complete:\n\n` +
                          `💹 Live ETH Price: $${realPrice.toFixed(2)}\n` +
                          `📈 24h Change: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%\n` +
                          `⚖️ Portfolio: ${token0Exposure.toFixed(1)}% / ${token1Exposure.toFixed(1)}%\n\n` +
                          `🤔 Decision: ${decision.shouldRebalance ? '✅ REBALANCE NEEDED' : '⏸️ HOLD POSITION'}`,
                    action: 'ANALYSIS_COMPLETE',
                    source: message.content.source,
                });
            }

            // Step 3: Execute if needed
            if (!decision.shouldRebalance) {
                logger.info('✅ Portfolio is balanced, no action needed');
                return {
                    success: true,
                    text: 'Portfolio analysis complete - no rebalancing needed',
                    values: {
                        rebalanced: false,
                        reason: 'Portfolio within acceptable thresholds'
                    }
                };
            }

            // Update MockStork to real price before swap
            logger.info(`📝 Updating MockStork to real price: $${decision.targetPrice}`);
            
            if (callback) {
                callback({
                    text: `🎯 Rebalancing Decision:\n\n` +
                          `📋 Reason: ${decision.reason}\n` +
                          `🔄 Action: ${decision.action}\n` +
                          `💰 Target Price: $${decision.targetPrice.toFixed(2)}\n\n` +
                          `⏳ Step 1: Updating MockStork oracle...`,
                    action: 'REBALANCE_INITIATED',
                    source: message.content.source,
                });
            }

            const privateKey = (process.env.EVM_PRIVATE_KEY || process.env.PRIVATE_KEY) as Hex;
            const account = privateKeyToAccount(privateKey);
            const client = createWalletClient({
                account,
                chain: arcTestnet,
                transport: http()
            }).extend(publicActions);

            // Update MockStork price
            const priceInSmallestUnits = BigInt(Math.round(decision.targetPrice * 1e18));
            const timestampNs = BigInt(Date.now() * 1e6);

            const oracleUpdateHash = await client.writeContract({
                address: MOCK_STORK_ADDRESS,
                abi: MOCK_STORK_ABI,
                functionName: 'set',
                args: [priceInSmallestUnits, timestampNs]
            });

            await client.waitForTransactionReceipt({ hash: oracleUpdateHash });
            logger.info(`✅ MockStork updated: ${oracleUpdateHash}`);

            if (callback) {
                callback({
                    text: `✅ Oracle Updated!\n\n` +
                          `📝 Tx: ${oracleUpdateHash}\n` +
                          `💹 New Price: $${decision.targetPrice.toFixed(2)}\n\n` +
                          `⏳ Step 2: Executing swap...`,
                    action: 'ORACLE_UPDATED',
                    source: message.content.source,
                });
            }

            // Execute swap
            const swapResult = await executeSwapAction.handler(
                _runtime,
                message,
                _state,
                _options,
                callback,
                _responses
            );

            if (swapResult && swapResult.success) {
                logger.info('✅ Autonomous rebalancing complete!');
                return {
                    success: true,
                    text: `Autonomous rebalancing executed successfully!`,
                    values: {
                        rebalanced: true,
                        reason: decision.reason,
                        action: decision.action,
                        price: decision.targetPrice,
                        oracleUpdateTx: oracleUpdateHash,
                        swapTx: swapResult.values?.hash
                    },
                    data: {
                        decision,
                        oracleUpdate: oracleUpdateHash,
                        swap: swapResult.data
                    }
                };
            } else {
                const errorMsg = swapResult?.error instanceof Error ? swapResult.error.message : 
                                typeof swapResult?.error === 'string' ? swapResult.error : 
                                'Swap execution failed';
                throw new Error(errorMsg);
            }

        } catch (error) {
            logger.error('❌ Autonomous rebalancing failed', error);
            
            if (callback) {
                callback({
                    text: `❌ Autonomous rebalancing failed: ${error instanceof Error ? error.message : String(error)}`,
                    action: 'REBALANCE_FAILED',
                    source: message.content.source,
                });
            }
            
            return {
                success: false,
                text: `Rebalancing failed: ${error instanceof Error ? error.message : String(error)}`,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },
    
    examples: [
        [
            {
                name: '{{name1}}',
                content: { text: 'Check if treasury needs rebalancing' }
            },
            {
                name: 'OrbitAgent',
                content: { text: '🤖 Analyzing market conditions and portfolio exposure...', action: 'AUTONOMOUS_REBALANCE' }
            }
        ],
        [
            {
                name: '{{name1}}',
                content: { text: 'Run autonomous rebalancing' }
            },
            {
                name: 'OrbitAgent',
                content: { text: '📊 Fetching real-time prices and treasury state...', action: 'AUTONOMOUS_REBALANCE' }
            }
        ]
    ]
};
