import { type Plugin } from '@elizaos/core';
import { OrbitService } from './services/orbitService.ts';
import { getTreasuryStatsAction } from './actions/getTreasuryStats.ts';

export const orbitPlugin: Plugin = {
  name: 'orbit',
  description: 'Orbit Protocol RWA Treasury Manager Plugin',
  services: [OrbitService],
  actions: [getTreasuryStatsAction],
  providers: [],
};

export default orbitPlugin;
