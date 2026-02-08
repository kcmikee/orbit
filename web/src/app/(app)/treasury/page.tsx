"use client";

import { useCallback } from "react";
import {
  TreasuryStats,
  DepositFlow,
  PortfolioView,
  RedemptionFlow,
} from "@/components/treasury";
import { useTreasuryStats, useTreasuryPortfolio } from "@/hooks/use-treasury";

export default function TreasuryPage() {
  const { stats, loading, error } = useTreasuryStats();
  const { refetch: refetchPortfolio } = useTreasuryPortfolio();

  const onDepositSuccess = useCallback(() => {
    refetchPortfolio();
  }, [refetchPortfolio]);

  const onRedeemSuccess = useCallback(() => {
    refetchPortfolio();
  }, [refetchPortfolio]);

  // USDC balance could come from ConnectWallet / api; placeholder for now
  const usdcBalance: string | undefined = undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Treasury
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Deposit USDC, earn yield, and redeem your shares anytime.
        </p>
      </div>

      <div className="space-y-8">
        <TreasuryStats stats={stats} loading={loading} error={error} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DepositFlow
            onDepositSuccess={onDepositSuccess}
            usdcBalance={usdcBalance}
          />
          <RedemptionFlow onRedeemSuccess={onRedeemSuccess} />
        </div>

        <PortfolioView />
      </div>
    </div>
  );
}
