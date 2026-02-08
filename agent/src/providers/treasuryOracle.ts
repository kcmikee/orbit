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
    type Hex,
    keccak256,
    toHex
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

// TreasuryOracle contract address (to be updated after deployment)
const TREASURY_ORACLE_ADDRESS = (process.env.TREASURY_ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000') as Hex;

// Feed IDs (keccak256 of asset symbols)
const FEED_IDS = {
    USDC: keccak256(toHex('USDC')),
    USYC: keccak256(toHex('USYC')),
    WETH: keccak256(toHex('WETH')),
    BUIDL: keccak256(toHex('BUIDL')),
} as const;

// TreasuryOracle ABI - functions we need
const TREASURY_ORACLE_ABI = [
    {
        inputs: [{ name: 'feedId', type: 'bytes32' }],
        name: 'getPriceData',
        outputs: [
            { name: 'price', type: 'int192' },
            { name: 'timestampNs', type: 'uint64' },
            { name: 'change24h', type: 'int192' },
            { name: 'apy', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getTreasuryPrices',
        outputs: [
            { name: 'usdcPrice', type: 'int192' },
            { name: 'usycPrice', type: 'int192' },
            { name: 'wethPrice', type: 'int192' },
            { name: 'buidlPrice', type: 'int192' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            { name: 'feedId', type: 'bytes32' },
            { name: 'amount', type: 'uint256' }
        ],
        name: 'getUSDValue',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const;

interface AssetData {
    symbol: string;
    price: number;
    change24h: number;
    apy: number;
    staleness: number;
    isYieldBearing: boolean;
}

export const treasuryOracleProvider: Provider = {
    name: 'TREASURY_ORACLE_PROVIDER',
    description: 'Provides real-time RWA treasury asset prices from TreasuryOracle contract',

    get: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State
    ): Promise<ProviderResult> => {
        try {
            // Check if oracle address is configured
            if (TREASURY_ORACLE_ADDRESS === '0x0000000000000000000000000000000000000000') {
                return {
                    text: '📊 Treasury Oracle: Not yet deployed. Using default prices.',
                    values: {
                        deployed: false,
                        usdc: 1.00,
                        usyc: 1.047,
                        weth: 2200,
                        buidl: 1.045
                    },
                    data: {
                        status: 'not_deployed',
                        defaultPrices: true
                    }
                };
            }

            const client = createPublicClient({
                chain: arcTestnet,
                transport: http()
            });

            // Fetch price data for all assets in parallel
            const [usdcData, usycData, wethData, buidlData] = await Promise.all([
                client.readContract({
                    address: TREASURY_ORACLE_ADDRESS,
                    abi: TREASURY_ORACLE_ABI,
                    functionName: 'getPriceData',
                    args: [FEED_IDS.USDC]
                }),
                client.readContract({
                    address: TREASURY_ORACLE_ADDRESS,
                    abi: TREASURY_ORACLE_ABI,
                    functionName: 'getPriceData',
                    args: [FEED_IDS.USYC]
                }),
                client.readContract({
                    address: TREASURY_ORACLE_ADDRESS,
                    abi: TREASURY_ORACLE_ABI,
                    functionName: 'getPriceData',
                    args: [FEED_IDS.WETH]
                }),
                client.readContract({
                    address: TREASURY_ORACLE_ADDRESS,
                    abi: TREASURY_ORACLE_ABI,
                    functionName: 'getPriceData',
                    args: [FEED_IDS.BUIDL]
                })
            ]) as [[bigint, bigint, bigint, bigint], [bigint, bigint, bigint, bigint], [bigint, bigint, bigint, bigint], [bigint, bigint, bigint, bigint]];

            const now = Date.now();

            // Parse asset data
            const parseAssetData = (
                symbol: string,
                data: [bigint, bigint, bigint, bigint],
                isYieldBearing: boolean
            ): AssetData => {
                const [price, timestampNs, change24h, apy] = data;
                const priceNum = Number(price) / 1e18;
                const changeNum = Number(change24h) / 100; // Convert basis points to percentage
                const apyNum = Number(apy) / 100; // Convert basis points to percentage
                const timestampMs = Number(timestampNs) / 1e6;
                const staleness = (now - timestampMs) / 1000;

                return {
                    symbol,
                    price: priceNum,
                    change24h: changeNum,
                    apy: apyNum,
                    staleness,
                    isYieldBearing
                };
            };

            const assets: AssetData[] = [
                parseAssetData('USDC', usdcData, false),
                parseAssetData('USYC', usycData, true),
                parseAssetData('WETH', wethData, false),
                parseAssetData('BUIDL', buidlData, true)
            ];

            // Calculate portfolio metrics
            const yieldAssets = assets.filter(a => a.isYieldBearing);
            const avgYield = yieldAssets.reduce((sum, a) => sum + a.apy, 0) / yieldAssets.length;

            // Format display text
            const formatChange = (change: number) => {
                const sign = change >= 0 ? '+' : '';
                return `${sign}${change.toFixed(2)}%`;
            };

            const formatPrice = (asset: AssetData) => {
                if (asset.symbol === 'WETH') {
                    return `$${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return `$${asset.price.toFixed(4)}`;
            };

            const assetLines = assets.map(a => {
                let line = `• ${a.symbol}: ${formatPrice(a)} (${formatChange(a.change24h)})`;
                if (a.isYieldBearing) {
                    line += ` 📈 ${a.apy.toFixed(2)}% APY`;
                }
                return line;
            }).join('\n');

            logger.info(`Treasury Oracle: Fetched ${assets.length} asset prices`);

            return {
                text: `📊 Treasury Oracle - RWA Prices\n\n${assetLines}\n\n💰 Average RWA Yield: ${avgYield.toFixed(2)}% APY\n🔗 Oracle: ${TREASURY_ORACLE_ADDRESS.slice(0, 8)}...${TREASURY_ORACLE_ADDRESS.slice(-6)}`,
                values: {
                    deployed: true,
                    usdc: assets[0].price,
                    usyc: assets[1].price,
                    weth: assets[2].price,
                    buidl: assets[3].price,
                    usycApy: assets[1].apy,
                    buidlApy: assets[3].apy,
                    avgYield,
                    usdcChange24h: assets[0].change24h,
                    usycChange24h: assets[1].change24h,
                    wethChange24h: assets[2].change24h,
                    buidlChange24h: assets[3].change24h
                },
                data: {
                    assets: assets.reduce((acc, a) => ({
                        ...acc,
                        [a.symbol]: {
                            price: a.price,
                            change24h: a.change24h,
                            apy: a.apy,
                            staleness: a.staleness,
                            isYieldBearing: a.isYieldBearing
                        }
                    }), {}),
                    oracleAddress: TREASURY_ORACLE_ADDRESS,
                    chainId: arcTestnet.id,
                    timestamp: now
                }
            };

        } catch (error) {
            logger.error({ error }, 'Error fetching from TreasuryOracle');

            // Return fallback data on error
            return {
                text: `📊 Treasury Oracle: Error fetching prices (${error instanceof Error ? error.message : String(error)})\n\nUsing fallback prices:\n• USDC: $1.00\n• USYC: $1.047 (4.70% APY)\n• WETH: $2,200.00\n• BUIDL: $1.045 (4.50% APY)`,
                values: {
                    deployed: false,
                    usdc: 1.00,
                    usyc: 1.047,
                    weth: 2200,
                    buidl: 1.045,
                    usycApy: 4.70,
                    buidlApy: 4.50,
                    error: true
                },
                data: {
                    error: error instanceof Error ? error.message : String(error),
                    fallback: true
                }
            };
        }
    },
};
