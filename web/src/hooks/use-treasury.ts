"use client";

import { useCallback, useEffect, useState } from "react";
import { USER_SESSION_KEY } from "@/components/create-wallet";
import type {
  AllocationItem,
  TreasuryStats,
  UserPortfolio,
} from "@/types/treasury";

const MOCK_ALLOCATIONS: AllocationItem[] = [
  {
    label: "USDC",
    symbol: "USDC",
    percent: 45,
    valueUsd: 450_000,
    color: "#2775ca",
  },
  {
    label: "Tokenized T-Bills",
    symbol: "USYC",
    percent: 35,
    valueUsd: 350_000,
    color: "#22c55e",
  },
  {
    label: "WETH",
    symbol: "WETH",
    percent: 20,
    valueUsd: 200_000,
    color: "#8b5cf6",
  },
];

const MOCK_STATS: TreasuryStats = {
  tvl: 1_000_000,
  apy: 4.25,
  allocations: MOCK_ALLOCATIONS,
};

function getMockPortfolio(): UserPortfolio {
  return {
    sharesBalance: "1250000000000",
    sharesBalanceFormatted: 1250,
    usdValue: 1250,
    pendingYield: 12.45,
  };
}

export function useTreasuryStats() {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: replace with real API / contract read
      await new Promise((r) => setTimeout(r, 400));
      setStats(MOCK_STATS);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to load treasury stats",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useTreasuryPortfolio() {
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSession =
    typeof window !== "undefined" &&
    !!window.localStorage.getItem(USER_SESSION_KEY);

  const fetchPortfolio = useCallback(async () => {
    if (!hasSession) {
      setPortfolio(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // TODO: replace with real API / contract read (shares balance, value, yield)
      await new Promise((r) => setTimeout(r, 300));
      setPortfolio(getMockPortfolio());
    } catch {
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [hasSession]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { portfolio, loading, refetch: fetchPortfolio };
}
