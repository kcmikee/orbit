import {
  type IAgentRuntime,
  type Memory,
  type Provider,
  type State,
  type ProviderResult,
  logger,
} from "@elizaos/core";
import Coingecko from "@coingecko/coingecko-typescript";
import { coingeckoClient } from "../api/coingecko";

export const coinGeckoPriceProvider: Provider = {
  name: "COINGECKO_PRICE_PROVIDER",
  description: "Provides real-time asset prices from CoinGecko API",

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State,
  ): Promise<ProviderResult> => {
    try {
      const requestedIds = "ethereum,bitcoin,solana,dogecoin,usdc,usdt";

      const params: Coingecko.Simple.PriceGetParams = {
        ids: requestedIds,
        vs_currencies: "usd",
        include_24hr_change: true,
        include_market_cap: true,
      };

      const priceData = await coingeckoClient.simple.price.get(params);

      if (!priceData || Object.keys(priceData).length === 0) {
        return {
          text: "CoinGecko Market Data: Price data unavailable",
          values: {},
          data: { error: "No price data returned" },
        };
      }

      const timestamp = new Date().toISOString();

      // Process all returned coins
      const coinSummaries = Object.entries(priceData).map(
        ([id, stats]: [string, any]) => {
          const price = stats.usd;
          const change24h = stats.usd_24h_change || 0;
          const marketCap = stats.usd_market_cap || 0;

          // Determine market sentiment per coin
          let sentiment = "📊 Neutral";
          if (change24h > 5) sentiment = "🚀 Bullish";
          else if (change24h > 2) sentiment = "📈 Positive";
          else if (change24h < -5) sentiment = "📉 Bearish";
          else if (change24h < -2) sentiment = "⚠️ Negative";

          return {
            id: id.toUpperCase(),
            text: `${id.toUpperCase()}: $${price.toLocaleString()} (${change24h > 0 ? "+" : ""}${change24h.toFixed(2)}%) | ${sentiment}`,
            values: {
              price,
              change24h,
              marketCap,
              sentiment,
            },
          };
        },
      );

      const fullDisplayText =
        `🌐 CoinGecko Market Data (${timestamp}):\n` +
        coinSummaries.map((c) => `- ${c.text}`).join("\n");

      logger.info(
        `CoinGecko: Successfully fetched data for ${coinSummaries.length} assets.`,
      );

      return {
        text: fullDisplayText,
        values: {
          assets: coinSummaries,
          timestamp: timestamp,
        },
        data: {
          source: "CoinGecko API",
          raw: priceData,
          fetchedAt: Date.now(),
        },
      };
    } catch (err) {
      // Error handling remains the same for SDK consistency
      if (err instanceof Coingecko.RateLimitError) {
        logger.error("CoinGecko rate limit exceeded");
        return {
          text: "⚠️ CoinGecko: Rate limit exceeded. Please try again later.",
          values: { error: "RATE_LIMIT" },
          data: { error: "Rate limit exceeded" },
        };
      } else if (err instanceof Coingecko.APIError) {
        logger.error(
          { error: err },
          `CoinGecko API error: ${err.name} (Status: ${err.status})`,
        );
        return {
          text: `⚠️ CoinGecko API Error: ${err.name} (Status: ${err.status})`,
          values: { error: "API_ERROR" },
          data: { error: err.message, status: err.status },
        };
      } else {
        logger.error(
          { error: err },
          "Unexpected error fetching CoinGecko prices",
        );
        return {
          text: `⚠️ CoinGecko: Unexpected error (${err instanceof Error ? err.message : String(err)})`,
          values: { error: "UNKNOWN" },
          data: { error: err instanceof Error ? err.message : String(err) },
        };
      }
    }
  },
};
