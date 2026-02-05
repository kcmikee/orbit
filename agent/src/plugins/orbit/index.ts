import { type Plugin } from "@elizaos/core";
import { OrbitService } from "./services/orbitService.ts";
import { getTreasuryStatsAction } from "./actions/getTreasuryStats.ts";
import { OrbitPriceCronService } from "./actions/orbit.cron.ts";
import { coinGeckoPriceProvider } from "src/providers/coingecko.ts";

export const orbitPlugin: Plugin = {
  name: "orbit",
  description: "Orbit Protocol RWA Treasury Manager Plugin",
  // services: [OrbitService, OrbitPriceCronService],
  services: [OrbitService],
  actions: [getTreasuryStatsAction],
  providers: [coinGeckoPriceProvider],
};

export default orbitPlugin;
