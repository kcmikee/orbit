import { autonomousRebalanceAction } from './src/actions/rebalance';

async function testAutonomousRebalance() {
    console.log('🤖 Testing Autonomous Rebalancing Engine\n');
    console.log('This will:');
    console.log('1. Fetch real-time CoinGecko prices');
    console.log('2. Check MockStork oracle price');  
    console.log('3. Analyze treasury exposure');
    console.log('4. Make autonomous decision');
    console.log('5. Execute rebalancing if needed\n');

    const mockMessage = {
        id: 'test-msg',
        content: { text: 'Test autonomous rebalance', source: 'test' }
    } as any;

    try {
        const result = await autonomousRebalanceAction.handler(
            null as any, // runtime
            mockMessage,
            {} as any, // state
            {},
            (response) => {
                // Callback to show agent thinking
                console.log(`\n💭 Agent: ${response.text}\n`);
            },
            [] // responses
        );

        console.log('\n\n📊 FINAL RESULT:');
        console.log('================');
        console.log(`Success: ${result.success}`);
        console.log(`Text: ${result.text}`);
        if (result.values) {
            console.log('Values:', JSON.stringify(result.values, null, 2));
        }

    } catch (error) {
        console.error('\n❌ Test Failed:', error);
    }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('          ORBIT AUTONOMOUS AGENT - DECISION ENGINE         ');
console.log('═══════════════════════════════════════════════════════════\n');

testAutonomousRebalance().catch(console.error);
