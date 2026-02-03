import {
    type Action,
    type IAgentRuntime,
    type Memory,
    type State,
    type HandlerCallback,
    logger,
    type Content,
    type ActionResult
} from '@elizaos/core';
import { OrbitService, type TreasuryStats } from '../services/orbitService.ts';

export const getTreasuryStatsAction: Action = {
    name: 'GET_TREASURY_STATS',
    similes: ['CHECK_TREASURY', 'TREASURY_STATUS', 'CHECK_APY', 'CHECK_TVL'],
    description: 'Fetch the current stats (TVL, APY) of the Orbit Treasury.',
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        const orbitService = runtime.getService<OrbitService>('ORBIT_SERVICE');
        return !!orbitService;
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: any,
        callback: HandlerCallback
    ): Promise<ActionResult> => {
        logger.info('Executing GET_TREASURY_STATS action');
        const orbitService = runtime.getService<OrbitService>('ORBIT_SERVICE');
        
        if (!orbitService) {
            throw new Error('Orbit Service not found');
        }
        
        try {
            const stats: TreasuryStats = await orbitService.getTreasuryStats();
            
            const text = `Orbit Treasury Status:\n💰 TVL: ${stats.tvl}\n📈 Current APY: ${stats.apy}\n💼 Assets: ${stats.totalAssets}`;
            
            callback({
                text: text,
                content: {
                    tvl: stats.tvl,
                    apy: stats.apy,
                    assets: stats.totalAssets
                }
            });

            return {
                success: true,
                text: text,
                data: stats as unknown as Record<string, unknown>
            };
        } catch (error) {
            logger.error('Error fetching treasury stats:', error);
            callback({
                text: "I couldn't fetch the treasury data right now. My connection to the blockchain seems slightly unstable.",
                error: true
            });
            return {
                success: false,
                text: "Error fetching stats",
                error: error
            };
        }
    },
    examples: [
        [
            {
                name: 'user',
                content: { text: "How is the treasury doing?" }
            },
            {
                name: 'Norbit',
                content: { text: "Orbit Treasury Status:\n💰 TVL: $5.2M\n📈 Current APY: 5.2%\n💼 Assets: USDC, sDai" }
            }
        ],
        [
            {
                name: 'user',
                content: { text: "What's the current APY?" }
            },
            {
                name: 'Norbit',
                content: { text: "Current APY is 5.2%." }
            }
        ]
    ]
};
