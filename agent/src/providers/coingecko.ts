import {
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
    type ProviderResult,
    logger,
} from '@elizaos/core';
import Coingecko from '@coingecko/coingecko-typescript';
import { coingeckoClient } from '../api/coingecko';

export const coinGeckoPriceProvider: Provider = {
    name: 'COINGECKO_PRICE_PROVIDER',
    description: 'Provides real-time asset prices from CoinGecko API',

    get: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State
    ): Promise<ProviderResult> => {
        try {
            // Fetch ETH/USD price using official SDK
            const params: Coingecko.Simple.PriceGetParams = {
                ids: 'ethereum',
                vs_currencies: 'usd',
                include_24hr_change: true,
                include_market_cap: true,
            };

            const priceData = await coingeckoClient.simple.price.get(params);

            if (!priceData?.ethereum?.usd) {
                return {
                    text: 'CoinGecko Market Data: Price data unavailable',
                    values: {},
                    data: { error: 'No price data returned' }
                };
            }

            const price = priceData.ethereum.usd;
            const change24h = priceData.ethereum.usd_24h_change || 0;
            const marketCap = priceData.ethereum.usd_market_cap || 0;

            // Determine market sentiment
            let sentiment = '📊 Neutral';
            if (change24h > 5) sentiment = '🚀 Bullish';
            else if (change24h > 2) sentiment = '📈 Positive';
            else if (change24h < -5) sentiment = '📉 Bearish';
            else if (change24h < -2) sentiment = '⚠️ Negative';

            const timestamp = new Date().toISOString();

            logger.info(`CoinGecko: ETH/USD $${price.toFixed(2)} (${change24h.toFixed(2)}%)`);

            return {
                text: `🌐 CoinGecko Market Data:\n- ETH/USD: $${price.toFixed(2)}\n- 24h Change: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%\n- Market Cap: $${(marketCap / 1e9).toFixed(2)}B\n- Sentiment: ${sentiment}\n- Updated: ${timestamp}`,
                values: {
                    price: price,
                    change24h: change24h,
                    marketCap: marketCap,
                    sentiment: sentiment,
                    timestamp: timestamp,
                    isBullish: change24h > 0,
                    isVolatile: Math.abs(change24h) > 5
                },
                data: {
                    source: 'CoinGecko API',
                    raw: priceData.ethereum,
                    fetchedAt: Date.now()
                }
            };

        } catch (err) {
            // Handle specific SDK errors as per requirements
            if (err instanceof Coingecko.RateLimitError) {
                logger.error('CoinGecko rate limit exceeded');
                return {
                    text: '⚠️ CoinGecko: Rate limit exceeded. Please try again later.',
                    values: { error: 'RATE_LIMIT' },
                    data: { error: 'Rate limit exceeded' }
                };
            } else if (err instanceof Coingecko.APIError) {
                logger.error({ error: err }, `CoinGecko API error: ${err.name} (Status: ${err.status})`);
                return {
                    text: `⚠️ CoinGecko API Error: ${err.name} (Status: ${err.status})`,
                    values: { error: 'API_ERROR' },
                    data: { error: err.message, status: err.status }
                };
            } else {
                logger.error({ error: err }, 'Unexpected error fetching CoinGecko prices');
                return {
                    text: `⚠️ CoinGecko: Unexpected error (${err instanceof Error ? err.message : String(err)})`,
                    values: { error: 'UNKNOWN' },
                    data: { error: err instanceof Error ? err.message : String(err) }
                };
            }
        }
    },
};
