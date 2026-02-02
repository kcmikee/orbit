import {
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
    type ProviderResult,
} from '@elizaos/core';
import { HermesClient } from '@pythnetwork/hermes-client';

// ETH/USD Price Feed ID on Pyth Network
const ETH_USD_PRICE_ID = 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
const HERMES_URL = 'https://hermes.pyth.network';

export const pythPriceProvider: Provider = {
    name: 'PYTH_PRICE_PROVIDER',
    description: 'Provides real-time asset prices from Pyth Network',

    get: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State
    ): Promise<ProviderResult> => {
        try {
            const connection = new HermesClient(HERMES_URL, {});
            const priceUpdates = await connection.getLatestPriceUpdates([
                ETH_USD_PRICE_ID,
            ]);

            if (!priceUpdates || !priceUpdates.parsed || priceUpdates.parsed.length === 0) {
                return {
                    text: 'Pyth Market Data: Unavailable',
                    values: {},
                    data: { error: 'No price updates found' }
                };
            }

            const parsed = priceUpdates.parsed[0];
            const price = parsed.price;
            const conf = parsed.conf;
            
            // Format price (price * 10^expo)
            const formattedPrice = (Number(price.price) * Math.pow(10, price.expo)).toFixed(2);
            const formattedConf = (Number(conf) * Math.pow(10, price.expo)).toFixed(2);
            const publishTime = new Date(parsed.publish_time * 1000).toISOString();
            
            // Calculate staleness
            const staleness = (Date.now() / 1000) - parsed.publish_time;

            return {
                text: `Pyth Market Data:\n- ETH/USD: $${formattedPrice} (±$${formattedConf})\n- Timestamp: ${publishTime}\n- Staleness: ${staleness.toFixed(1)}s`,
                values: {
                    price: Number(formattedPrice),
                    confidence: Number(formattedConf),
                    timestamp: parsed.publish_time,
                    staleness: Number(staleness.toFixed(1))
                },
                data: {
                    raw: parsed,
                    service: 'Pyth Hermes'
                }
            };

        } catch (error) {
            return {
                text: `Pyth Market Data: Error fetching prices (${error instanceof Error ? error.message : String(error)})`,
                values: {},
                data: { error: error instanceof Error ? error.message : String(error) }
            };
        }
    },
};
