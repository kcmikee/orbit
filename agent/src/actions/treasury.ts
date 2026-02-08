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
    createPublicClient,
    createWalletClient,
    http,
    type Hex,
    formatUnits,
    parseUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { treasuryOracleProvider } from '../providers/treasuryOracle';

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

// Contract addresses
const ORBIT_VAULT_ADDRESS = (process.env.ORBIT_VAULT_ADDRESS || '0x9370dDf91b63cF5b2aa0c89BdC9D41209f24615F') as Hex;
const TREASURY_ORACLE_ADDRESS = (process.env.TREASURY_ORACLE_ADDRESS || '0x9e2851a6E9fFA4433a38B74f6bD08e519A782940') as Hex;

// ABIs
const ORBIT_VAULT_ABI = [
    {
        inputs: [],
        name: 'getVaultStats',
        outputs: [
            { name: 'tvl', type: 'uint256' },
            { name: 'totalShares', type: 'uint256' },
            { name: 'currentSharePrice', type: 'uint256' },
            { name: 'apy', type: 'uint256' },
            { name: 'yieldEarned', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalAssets',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Target allocation for the treasury
const TARGET_ALLOCATION = {
    RWA: 60,      // 60% in yield-bearing RWAs (USYC, BUIDL)
    USDC: 25,     // 25% in stablecoin liquidity
    WETH: 15      // 15% in ETH for trading opportunities
};

// Decision thresholds
const THRESHOLDS = {
    BUY_DIP: -5,       // Buy when price drops 5%+
    SELL_RISE: 5,      // Sell when price rises 5%+
    MAX_EXPOSURE: 70,  // Max single asset exposure
    REBALANCE: 10      // Rebalance when off target by 10%+
};

/**
 * GET_TREASURY_STATUS Action
 * Reports the current state of the OrbitVault treasury
 */
export const getTreasuryStatusAction: Action = {
    name: 'GET_TREASURY_STATUS',
    similes: ['TREASURY_STATUS', 'VAULT_STATUS', 'TVL', 'CHECK_VAULT', 'SHOW_TREASURY'],
    description: 'Get the current status of the Orbit Treasury including TVL, APY, and share price',

    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        return true; // Always valid - read-only action
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ): Promise<ActionResult> => {
        try {
            logger.info('Fetching treasury status...');

            const client = createPublicClient({
                chain: arcTestnet,
                transport: http()
            });

            // Get vault stats
            const [tvl, totalShares, sharePrice, apy, yieldEarned] = await client.readContract({
                address: ORBIT_VAULT_ADDRESS,
                abi: ORBIT_VAULT_ABI,
                functionName: 'getVaultStats'
            }) as [bigint, bigint, bigint, bigint, bigint];

            // Format values (USDC has 6 decimals)
            const tvlFormatted = Number(formatUnits(tvl, 6));
            const sharesFormatted = Number(formatUnits(totalShares, 18));
            const sharePriceFormatted = Number(formatUnits(sharePrice, 6));
            const apyFormatted = Number(apy) / 100; // Convert basis points to %
            const yieldFormatted = Number(formatUnits(yieldEarned, 6));

            // Get oracle prices for context
            const oracleData = await treasuryOracleProvider.get(runtime, message, state);

            const statusText = `🏦 **Orbit Treasury Status**\n\n` +
                `💰 **Total Value Locked:** $${tvlFormatted.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
                `📊 **Total Shares:** ${sharesFormatted.toLocaleString('en-US', { minimumFractionDigits: 4 })} oUSDC\n` +
                `💵 **Share Price:** $${sharePriceFormatted.toFixed(4)}\n` +
                `📈 **Current APY:** ${apyFormatted.toFixed(2)}%\n` +
                `✨ **Yield Earned:** $${yieldFormatted.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
                `🎯 **Target Allocation:**\n` +
                `  • RWAs (USYC/BUIDL): ${TARGET_ALLOCATION.RWA}%\n` +
                `  • USDC Liquidity: ${TARGET_ALLOCATION.USDC}%\n` +
                `  • WETH Trading: ${TARGET_ALLOCATION.WETH}%`;

            if (callback) {
                callback({
                    text: statusText,
                    action: 'GET_TREASURY_STATUS',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: statusText,
                values: {
                    tvl: tvlFormatted,
                    totalShares: sharesFormatted,
                    sharePrice: sharePriceFormatted,
                    apy: apyFormatted,
                    yieldEarned: yieldFormatted
                },
                data: {
                    vault: ORBIT_VAULT_ADDRESS,
                    oracle: TREASURY_ORACLE_ADDRESS,
                    oraclePrices: oracleData.values
                }
            };

        } catch (error) {
            logger.error('Failed to get treasury status:', error);

            // Fallback response when vault not accessible
            const fallbackText = `🏦 **Orbit Treasury Status**\n\n` +
                `⚠️ Unable to fetch live vault data.\n\n` +
                `📋 **Vault Address:** ${ORBIT_VAULT_ADDRESS}\n` +
                `🎯 **Target Strategy:**\n` +
                `  • ${TARGET_ALLOCATION.RWA}% in yield-bearing RWAs (4-5% APY)\n` +
                `  • ${TARGET_ALLOCATION.USDC}% USDC for liquidity\n` +
                `  • ${TARGET_ALLOCATION.WETH}% WETH for trading opportunities`;

            if (callback) {
                callback({
                    text: fallbackText,
                    action: 'GET_TREASURY_STATUS',
                    source: message.content.source,
                });
            }

            return {
                success: false,
                text: fallbackText,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },

    examples: [
        [
            { name: '{{name1}}', content: { text: 'What is the treasury status?' } },
            { name: 'Norbit', content: { text: '🏦 Let me check the current treasury state...', action: 'GET_TREASURY_STATUS' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'How much TVL do you manage?' } },
            { name: 'Norbit', content: { text: '📊 Fetching vault statistics...', action: 'GET_TREASURY_STATUS' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'Show me the vault' } },
            { name: 'Norbit', content: { text: '🏦 Here is the current treasury overview...', action: 'GET_TREASURY_STATUS' } }
        ]
    ]
};

/**
 * EXPLAIN_STRATEGY Action
 * Explains the treasury management strategy and reasoning
 */
export const explainStrategyAction: Action = {
    name: 'EXPLAIN_STRATEGY',
    similes: ['INVESTMENT_THESIS', 'WHY_INVEST', 'STRATEGY', 'EXPLAIN_DECISIONS', 'HOW_DO_YOU_INVEST'],
    description: 'Explain the investment strategy, decision logic, and reasoning behind treasury management',

    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ): Promise<ActionResult> => {
        try {
            // Get current prices for context
            const oracleData = await treasuryOracleProvider.get(runtime, message, state);
            const wethChange = oracleData.values?.wethChange24h as number || 0;
            const usycApy = oracleData.values?.usycApy as number || 4.7;
            const buidlApy = oracleData.values?.buidlApy as number || 4.5;

            // Determine current market sentiment
            let marketSentiment = 'neutral';
            let actionRecommendation = 'holding steady';

            if (wethChange <= THRESHOLDS.BUY_DIP) {
                marketSentiment = 'bearish (opportunity)';
                actionRecommendation = 'accumulating ETH on the dip';
            } else if (wethChange >= THRESHOLDS.SELL_RISE) {
                marketSentiment = 'bullish (caution)';
                actionRecommendation = 'taking profits on ETH';
            }

            const strategyText = `📚 **Orbit Investment Strategy**\n\n` +
                `**Core Philosophy:**\n` +
                `I manage your funds with a conservative, yield-focused approach. My primary goal is to generate steady returns through Real World Assets (RWAs) while maintaining liquidity for opportunities.\n\n` +

                `**Asset Allocation:**\n` +
                `🏛️ **${TARGET_ALLOCATION.RWA}% RWAs** - The foundation of our yield\n` +
                `  • USYC (Hashnote): ${usycApy.toFixed(2)}% APY from US Treasuries\n` +
                `  • BUIDL (BlackRock): ${buidlApy.toFixed(2)}% APY institutional grade\n\n` +

                `💵 **${TARGET_ALLOCATION.USDC}% USDC** - Stablecoin liquidity\n` +
                `  • Ready for quick deployment\n` +
                `  • No impermanent loss risk\n\n` +

                `⚡ **${TARGET_ALLOCATION.WETH}% WETH** - Trading position\n` +
                `  • Captures ETH upside\n` +
                `  • Actively managed based on signals\n\n` +

                `**Decision Triggers:**\n` +
                `📉 **Buy Signal:** When ETH drops >${Math.abs(THRESHOLDS.BUY_DIP)}% in 24h\n` +
                `📈 **Sell Signal:** When ETH rises >${THRESHOLDS.SELL_RISE}% in 24h\n` +
                `⚖️ **Rebalance:** When any asset exceeds ${THRESHOLDS.MAX_EXPOSURE}% exposure\n\n` +

                `**Current Market:**\n` +
                `📊 ETH 24h Change: ${wethChange > 0 ? '+' : ''}${wethChange.toFixed(2)}%\n` +
                `🎯 Sentiment: ${marketSentiment}\n` +
                `🔄 Current Action: ${actionRecommendation}`;

            if (callback) {
                callback({
                    text: strategyText,
                    action: 'EXPLAIN_STRATEGY',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: strategyText,
                values: {
                    rwaAllocation: TARGET_ALLOCATION.RWA,
                    usdcAllocation: TARGET_ALLOCATION.USDC,
                    wethAllocation: TARGET_ALLOCATION.WETH,
                    marketSentiment,
                    currentAction: actionRecommendation
                }
            };

        } catch (error) {
            logger.error('Failed to explain strategy:', error);

            const fallbackText = `📚 **Orbit Investment Strategy**\n\n` +
                `I'm a conservative treasury manager focused on:\n` +
                `• ${TARGET_ALLOCATION.RWA}% in yield-bearing RWAs (4-5% APY)\n` +
                `• ${TARGET_ALLOCATION.USDC}% USDC for stability\n` +
                `• ${TARGET_ALLOCATION.WETH}% WETH for growth\n\n` +
                `I buy on dips (>${Math.abs(THRESHOLDS.BUY_DIP)}% drops) and sell on rises (>${THRESHOLDS.SELL_RISE}% gains).`;

            if (callback) {
                callback({
                    text: fallbackText,
                    action: 'EXPLAIN_STRATEGY',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: fallbackText
            };
        }
    },

    examples: [
        [
            { name: '{{name1}}', content: { text: 'How do you invest my money?' } },
            { name: 'Norbit', content: { text: '📚 Let me explain my investment strategy...', action: 'EXPLAIN_STRATEGY' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'What is your strategy?' } },
            { name: 'Norbit', content: { text: '🎯 Here is how I manage the treasury...', action: 'EXPLAIN_STRATEGY' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'Why do you buy USYC?' } },
            { name: 'Norbit', content: { text: '📊 Great question! Let me explain my reasoning...', action: 'EXPLAIN_STRATEGY' } }
        ]
    ]
};

/**
 * GET_PORTFOLIO_BREAKDOWN Action
 * Shows the current portfolio allocation with live prices
 */
export const getPortfolioBreakdownAction: Action = {
    name: 'GET_PORTFOLIO_BREAKDOWN',
    similes: ['PORTFOLIO', 'HOLDINGS', 'ALLOCATION', 'WHAT_DO_YOU_OWN', 'SHOW_ASSETS'],
    description: 'Get a detailed breakdown of current portfolio holdings and their values',

    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ): Promise<ActionResult> => {
        try {
            // Get oracle prices
            const oracleData = await treasuryOracleProvider.get(runtime, message, state);

            const usdcPrice = oracleData.values?.usdc as number || 1.0;
            const usycPrice = oracleData.values?.usyc as number || 1.047;
            const wethPrice = oracleData.values?.weth as number || 2200;
            const buidlPrice = oracleData.values?.buidl as number || 1.045;

            const usycApy = oracleData.values?.usycApy as number || 4.7;
            const buidlApy = oracleData.values?.buidlApy as number || 4.5;

            // For demo, show example holdings (in production, read from contracts)
            const holdings = {
                USDC: { amount: 250000, price: usdcPrice },
                USYC: { amount: 300000, price: usycPrice, apy: usycApy },
                BUIDL: { amount: 280000, price: buidlPrice, apy: buidlApy },
                WETH: { amount: 68.18, price: wethPrice }
            };

            const usdcValue = holdings.USDC.amount * holdings.USDC.price;
            const usycValue = holdings.USYC.amount * holdings.USYC.price;
            const buidlValue = holdings.BUIDL.amount * holdings.BUIDL.price;
            const wethValue = holdings.WETH.amount * holdings.WETH.price;
            const totalValue = usdcValue + usycValue + buidlValue + wethValue;

            const usdcPct = (usdcValue / totalValue * 100);
            const usycPct = (usycValue / totalValue * 100);
            const buidlPct = (buidlValue / totalValue * 100);
            const wethPct = (wethValue / totalValue * 100);
            const rwaPct = usycPct + buidlPct;

            const portfolioText = `📊 **Portfolio Breakdown**\n\n` +
                `**Total Value:** $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +

                `**Holdings:**\n` +
                `💵 **USDC** - ${usdcPct.toFixed(1)}%\n` +
                `   ${holdings.USDC.amount.toLocaleString()} @ $${usdcPrice.toFixed(4)}\n` +
                `   Value: $${usdcValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +

                `🏛️ **USYC** - ${usycPct.toFixed(1)}% (${usycApy}% APY)\n` +
                `   ${holdings.USYC.amount.toLocaleString()} @ $${usycPrice.toFixed(4)}\n` +
                `   Value: $${usycValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +

                `🏦 **BUIDL** - ${buidlPct.toFixed(1)}% (${buidlApy}% APY)\n` +
                `   ${holdings.BUIDL.amount.toLocaleString()} @ $${buidlPrice.toFixed(4)}\n` +
                `   Value: $${buidlValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +

                `⚡ **WETH** - ${wethPct.toFixed(1)}%\n` +
                `   ${holdings.WETH.amount.toFixed(2)} @ $${wethPrice.toLocaleString()}\n` +
                `   Value: $${wethValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +

                `**Summary:**\n` +
                `🏛️ RWA Exposure: ${rwaPct.toFixed(1)}% (Target: ${TARGET_ALLOCATION.RWA}%)\n` +
                `💵 Stablecoin: ${usdcPct.toFixed(1)}% (Target: ${TARGET_ALLOCATION.USDC}%)\n` +
                `⚡ Crypto: ${wethPct.toFixed(1)}% (Target: ${TARGET_ALLOCATION.WETH}%)`;

            if (callback) {
                callback({
                    text: portfolioText,
                    action: 'GET_PORTFOLIO_BREAKDOWN',
                    source: message.content.source,
                });
            }

            return {
                success: true,
                text: portfolioText,
                values: {
                    totalValue,
                    usdcValue,
                    usycValue,
                    buidlValue,
                    wethValue,
                    rwaExposure: rwaPct,
                    stablecoinExposure: usdcPct,
                    cryptoExposure: wethPct
                }
            };

        } catch (error) {
            logger.error('Failed to get portfolio breakdown:', error);

            if (callback) {
                callback({
                    text: `❌ Unable to fetch portfolio data. Please try again.`,
                    action: 'GET_PORTFOLIO_BREAKDOWN',
                    source: message.content.source,
                });
            }

            return {
                success: false,
                text: 'Failed to get portfolio breakdown',
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },

    examples: [
        [
            { name: '{{name1}}', content: { text: 'Show me the portfolio' } },
            { name: 'Norbit', content: { text: '📊 Here is the current portfolio breakdown...', action: 'GET_PORTFOLIO_BREAKDOWN' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'What assets do you hold?' } },
            { name: 'Norbit', content: { text: '💼 Let me show you our current holdings...', action: 'GET_PORTFOLIO_BREAKDOWN' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'What is the allocation?' } },
            { name: 'Norbit', content: { text: '📈 Here is how the treasury is allocated...', action: 'GET_PORTFOLIO_BREAKDOWN' } }
        ]
    ]
};

/**
 * CALCULATE_DEPOSIT Action
 * Calculates shares a user would receive for a deposit
 */
export const calculateDepositAction: Action = {
    name: 'CALCULATE_DEPOSIT',
    similes: ['DEPOSIT_PREVIEW', 'HOW_MANY_SHARES', 'DEPOSIT_CALCULATION'],
    description: 'Calculate how many shares a user would receive for a given USDC deposit amount',

    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback,
        _responses: Memory[]
    ): Promise<ActionResult> => {
        try {
            // Extract amount from message (simple parsing)
            const text = message.content.text?.toLowerCase() || '';
            const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
            const depositAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 1000;

            const client = createPublicClient({
                chain: arcTestnet,
                transport: http()
            });

            // Get current share price from vault
            let sharePrice = 1.0;
            try {
                const [, , currentSharePrice, ,] = await client.readContract({
                    address: ORBIT_VAULT_ADDRESS,
                    abi: ORBIT_VAULT_ABI,
                    functionName: 'getVaultStats'
                }) as [bigint, bigint, bigint, bigint, bigint];
                sharePrice = Number(formatUnits(currentSharePrice, 6));
            } catch {
                sharePrice = 1.0; // Default if vault not accessible
            }

            const sharesReceived = depositAmount / sharePrice;
            const estimatedApy = 4.5; // Target APY
            const oneYearValue = depositAmount * (1 + estimatedApy / 100);
            const estimatedYield = oneYearValue - depositAmount;

            const calcText = `💰 **Deposit Calculation**\n\n` +
                `**Deposit Amount:** $${depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC\n` +
                `**Current Share Price:** $${sharePrice.toFixed(4)}\n` +
                `**Shares You'll Receive:** ${sharesReceived.toLocaleString('en-US', { minimumFractionDigits: 4 })} oUSDC\n\n` +
                `**Projected Returns (${estimatedApy}% APY):**\n` +
                `• 1 Year Value: $${oneYearValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
                `• Estimated Yield: $${estimatedYield.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n` +
                `📝 *Deposit to OrbitVault at:*\n\`${ORBIT_VAULT_ADDRESS}\``;

            if (callback) {
                callback({
                    text: `Initiating deposit of ${depositAmount} USDC...`,
            action: 'DEPOSIT',
            source: message.content.source
        });
            }

            return {
                success: true,
                text: calcText,
                values: {
                    depositAmount,
                    sharePrice,
                    sharesReceived,
                    estimatedApy,
                    oneYearValue,
                    estimatedYield
                }
            };

        } catch (error) {
            logger.error('Failed to calculate deposit:', error);

            if (callback) {
                callback({
                    text: `❌ Unable to calculate deposit. Please try again.`,
                    action: 'CALCULATE_DEPOSIT',
                    source: message.content.source,
                });
            }

            return {
                success: false,
                text: 'Failed to calculate deposit',
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },

    examples: [
        [
            { name: '{{name1}}', content: { text: 'If I deposit 10000 USDC, how many shares?' } },
            { name: 'Norbit', content: { text: '💰 Let me calculate your shares...', action: 'CALCULATE_DEPOSIT' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'What would I get for depositing $5000?' } },
            { name: 'Norbit', content: { text: '📊 Calculating your deposit preview...', action: 'CALCULATE_DEPOSIT' } }
        ]
    ]
};

// Contract addresses for deposits
const MOCK_USDC_ADDRESS = (process.env.MOCK_USDC_ADDRESS || '0x58b0104A9308f5Bff7Cc3fA78705eF81bcf1B26E') as Hex;

// ERC20 ABI for approve
const ERC20_ABI = [
    {
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

// Vault deposit ABI
const VAULT_DEPOSIT_ABI = [
    {
        inputs: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' }
        ],
        name: 'deposit',
        outputs: [{ name: 'shares', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ name: 'assets', type: 'uint256' }],
        name: 'previewDeposit',
        outputs: [{ name: 'shares', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

/**
 * EXECUTE_DEPOSIT Action
 * Actually executes a deposit to the OrbitVault
 */
export const executeDepositAction: Action = {
    name: 'DEPOSIT',
    similes: [
        'DEPOSIT_USDC',
        'INVEST',
        'ADD_FUNDS',
        'STAKE',
        'ENTER_VAULT',
        'BUY_SHARES',
        'MINT_SHARES'
    ],
    description: 'MUST be used when the user wants to deposit USDC, invest funds, or adds money to the vault. Triggers the deposit UI.',

    validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
        logger.info('Validating DEPOSIT action...');
        return true;
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
            // Extract amount from message
            const text = message.content.text?.toLowerCase() || '';
            const amountMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);

            if (!amountMatch) {
                if (callback) {
                    callback({
                        text: `❓ Please specify an amount to deposit. For example: "deposit 1000 USDC"`,
                        action: 'EXECUTE_DEPOSIT',
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: 'No amount specified'
                };
            }

            const depositAmount = parseFloat(amountMatch[1].replace(/,/g, ''));

            if (depositAmount <= 0) {
                if (callback) {
                    callback({
                        text: `❌ Invalid deposit amount. Please specify a positive number.`,
                        action: 'EXECUTE_DEPOSIT',
                        source: message.content.source,
                    });
                }
                return {
                    success: false,
                    text: 'Invalid amount'
                };
            }

            // Instead of executing server-side, we tell the frontend to initiate the flow
            if (callback) {
                callback({
                    text: `💰 Opening deposit flow for ${depositAmount.toLocaleString()} USDC...`,
                    action: 'INITIATE_DEPOSIT',
                    source: message.content.source,
                    content: {
                        amount: depositAmount
                    }
                });
            }

            return {
                success: true,
                text: 'Initiated deposit flow',
                data: {
                    action: 'INITIATE_DEPOSIT',
                    amount: depositAmount
                }
            };
        } catch (error) {
            logger.error('Failed to initiate deposit:', error);
            return {
                success: false,
                text: 'Failed to initiate deposit',
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    },

    },

    examples: [
        [
            { name: '{{name1}}', content: { text: 'Deposit 1000 USDC' } },
            { name: 'Norbit', content: { text: '💰 Initiating deposit of 1000 USDC...', action: 'EXECUTE_DEPOSIT' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'I want to invest 5000 USDC' } },
            { name: 'Norbit', content: { text: '💰 Processing your 5000 USDC deposit...', action: 'EXECUTE_DEPOSIT' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'Add 10000 to the vault' } },
            { name: 'Norbit', content: { text: '💰 Depositing 10000 USDC to OrbitVault...', action: 'EXECUTE_DEPOSIT' } }
        ],
        [
            { name: '{{name1}}', content: { text: 'Deposit funds' } },
            { name: 'Norbit', content: { text: '💰 How much would you like to deposit?', action: 'EXECUTE_DEPOSIT' } }
        ],
        [
             { name: '{{name1}}', content: { text: 'limit order' } },
             { name: 'Norbit', content: { text: 'I can help with depositing funds to the vault', action: 'NONE' } }
        ]
    ]
};
