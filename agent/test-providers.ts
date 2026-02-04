import { storkPriceProvider } from './src/providers/stork';
import { treasuryMonitorProvider } from './src/providers/treasury';

async function testProviders() {
    console.log('🧪 Testing Orbit Agent Providers\n');
    
    // Test Stork Price Provider
    console.log('📊 Testing Stork Price Provider...');
    try {
        const priceResult = await storkPriceProvider.get(null as any, null as any, null as any);
        console.log('✅ Price Provider Result:');
        console.log(priceResult.text);
        console.log('Values:', priceResult.values);
        console.log('');
    } catch (error) {
        console.error('❌ Price Provider Error:', error);
    }
    
    // Test Treasury Monitor Provider
    console.log('🏦 Testing Treasury Monitor Provider...');
    try {
        const treasuryResult = await treasuryMonitorProvider.get(null as any, null as any, null as any);
        console.log('✅ Treasury Monitor Result:');
        console.log(treasuryResult.text);
        console.log('Values:', treasuryResult.values);
        console.log('');
    } catch (error) {
        console.error('❌ Treasury Monitor Error:', error);
    }
    
    console.log('✅ Provider tests complete!');
}

testProviders().catch(console.error);
