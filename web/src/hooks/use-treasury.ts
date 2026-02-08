"use client";

import { useCallback, useEffect, useState } from "react";
import { USER_SESSION_KEY } from "@/components/create-wallet";
import type {
  AllocationItem,
  TreasuryStats,
  UserPortfolio,
} from "@/types/treasury";

// Contract addresses
export const MOCK_USDC_ADDRESS = "0x58b0104A9308f5Bff7Cc3fA78705eF81bcf1B26E";
export const ORBIT_VAULT_ADDRESS = "0x9370dDf91b63cF5b2aa0c89BdC9D41209f24615F";

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

// Faucet hook - mints USDC to user's wallet
export function useFaucet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestFaucet = useCallback(
    async (
      address: string,
      amount: number = 10000
    ): Promise<{ txHash: string; balanceAfter: string } | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/faucet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, amount }),
        });
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Faucet request failed");
          return null;
        }

        return {
          txHash: data.data.txHash,
          balanceAfter: data.data.balanceAfter,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Faucet request failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { requestFaucet, loading, error };
}

// Deposit hook - creates Circle contract execution challenge
export function useDeposit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDepositChallenge = useCallback(
    async (
      userToken: string,
      walletId: string,
      walletAddress: string,
      amount: number
    ): Promise<{ challengeId: string } | null> => {
      try {
        setLoading(true);
        setError(null);

        // Amount in smallest units (6 decimals for USDC)
        const amountInUnits = BigInt(Math.floor(amount * 1e6)).toString();

        // Create deposit challenge (approve + deposit in one)
        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createContractExecutionChallenge",
            userToken,
            walletId,
            contractAddress: ORBIT_VAULT_ADDRESS,
            abiFunctionSignature: "deposit(uint256,address)",
            abiParameters: [amountInUnits, walletAddress],
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || data.message || "Failed to create deposit challenge");
          return null;
        }

        return { challengeId: data.challengeId };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create deposit");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createApproveChallenge = useCallback(
    async (
      userToken: string,
      walletId: string,
      amount: number
    ): Promise<{ challengeId: string } | null> => {
      try {
        setLoading(true);
        setError(null);

        const amountInUnits = BigInt(Math.floor(amount * 1e6)).toString();

        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createContractExecutionChallenge",
            userToken,
            walletId,
            contractAddress: MOCK_USDC_ADDRESS,
            abiFunctionSignature: "approve(address,uint256)",
            abiParameters: [ORBIT_VAULT_ADDRESS, amountInUnits],
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error || data.message || "Failed to create approve challenge");
          return null;
        }

        return { challengeId: data.challengeId };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create approval");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createDepositChallenge, createApproveChallenge, loading, error };
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
