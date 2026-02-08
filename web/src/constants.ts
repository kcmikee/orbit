// --- Constants ---
export const USER_NAME = "User";

// Source identifier for this Next.js application
export const CHAT_SOURCE = "API";

// Treasury (Arc Testnet) – set NEXT_PUBLIC_VAULT_ADDRESS when OrbitVault is deployed
export const USDC_ADDRESS =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_USDC_ADDRESS) ||
  "0x01BB3A79deFc363d2316c8c395F2FAF20B3697D5";
export const VAULT_ADDRESS =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_VAULT_ADDRESS) ||
  "0x0000000000000000000000000000000000000000";
