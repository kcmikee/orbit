import { storkPriceProvider } from './src/providers/stork';
import { treasuryMonitorProvider } from './src/providers/treasury';
import { coinGeckoPriceProvider } from './src/providers/coingecko';

async function testProviders() {
    console.log('🧪 Testing Orbit Agent Providers\n');
    
    // Test CoinGecko Real Price Provider
    console.log('🌐 Testing CoinGecko Real Price Provider...');
    try {
        const coinGeckoResult = await coinGeckoPriceProvider.get(null as any, null as any, null as any);
        console.log('✅ CoinGecko Result:');
        console.log(coinGeckoResult.text);
        console.log('Values:', coinGeckoResult.values);
        console.log('');
    } catch (error) {
        console.error('❌ CoinGecko Error:', error);
    }
    
    // Test Stork Price Provider (MockStork)
    console.log('📊 Testing Stork Price Provider (MockStork)...');
    try {
        const priceResult = await storkPriceProvider.get(null as any, null as any, null as any);
        console.log('✅ Stork Result:');
        console.log(priceResult.text);
        console.log('');
    } catch (error) {
        console.error('❌ Stork Error:', error);
    }
    
    // Test Treasury Monitor Provider
    console.log('🏦 Testing Treasury Monitor Provider...');
    try {
        const treasuryResult = await treasuryMonitorProvider.get(null as any, null as any, null as any);
        console.log('✅ Treasury Result:');
        console.log(treasuryResult.text);
        console.log('');
    } catch (error) {
        console.error('❌ Treasury Error:', error);
    }
    
    console.log('✅ All provider tests complete!\n');
    console.log('📈 Summary:');
    console.log('- CoinGecko: Live market data from real API');
    console.log('- Stork: On-chain oracle price from MockStork');
    console.log('- Treasury: Portfolio balances and exposure');
}

testProviders().catch(console.error);
