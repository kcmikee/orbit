"use client";

import {
  WalletIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTreasuryPortfolio } from "@/hooks/use-treasury";
import type { UserPortfolio } from "@/types/treasury";

function PortfolioCard({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div
      className={clsx(
        "p-4 rounded-xl border border-zinc-200 dark:border-zinc-800",
        "bg-white dark:bg-zinc-900/50",
      )}
    >
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
      ) : (
        <>
          <p className="text-xl font-semibold text-zinc-900 dark:text-white">
            {value}
          </p>
          {sub != null && sub !== "" && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {sub}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PortfolioContent({
  portfolio,
  loading,
}: {
  portfolio: UserPortfolio | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!portfolio) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">
        Connect your wallet and deposit to see your portfolio.
      </p>
    );
  }

  const { sharesBalanceFormatted, usdValue, pendingYield } = portfolio;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <PortfolioCard
        icon={WalletIcon}
        label="Your shares"
        value={sharesBalanceFormatted.toLocaleString()}
        sub="vault share tokens"
      />
      <PortfolioCard
        icon={CurrencyDollarIcon}
        label="USD value"
        value={`$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      />
      <PortfolioCard
        icon={SparklesIcon}
        label="Pending yield"
        value={`$${pendingYield.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        sub="accrued, not yet claimed"
      />
    </div>
  );
}

export function PortfolioView() {
  const isConnected = useWalletConnection();
  const { portfolio, loading } = useTreasuryPortfolio();

  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800",
        "bg-white dark:bg-zinc-900/80 p-6 sm:p-8",
      )}
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
        <WalletIcon className="w-5 h-5 text-emerald-500" />
        Your portfolio
      </h2>
      {!isConnected ? (
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Connect your wallet to view your shares and yield.
        </p>
      ) : (
        <PortfolioContent portfolio={portfolio} loading={loading} />
      )}
    </section>
  );
}
