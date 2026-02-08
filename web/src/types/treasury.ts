export interface AllocationItem {
  label: string;
  symbol: string;
  percent: number;
  valueUsd: number;
  color: string;
}

export interface TreasuryStats {
  tvl: number;
  apy: number;
  allocations: AllocationItem[];
}

export interface UserPortfolio {
  sharesBalance: string;
  sharesBalanceFormatted: number;
  usdValue: number;
  pendingYield: number;
}

export type DepositStep = "amount" | "approve" | "deposit" | "success";

export type RedemptionStep = "amount" | "confirm" | "success";
