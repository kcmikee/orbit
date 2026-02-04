import Coingecko from '@coingecko/coingecko-typescript';

// Initialize CoinGecko client (Demo API)
// Note: Demo API uses 'demo' environment and x-cg-demo-api-key header
export const coingeckoClient = new Coingecko({
  demoAPIKey: process.env.COINGECKO_DEMO_API_KEY,
  environment: 'demo',
  maxRetries: 3, // SDK handles retry logic automatically
});
