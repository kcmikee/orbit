"use client";

import {
  BanknotesIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { TreasuryStats as TreasuryStatsType } from "@/types/treasury";

function formatTvl(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toLocaleString()}`;
}

export function TreasuryStats({
  stats,
  loading,
  error,
}: {
  stats: TreasuryStatsType | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section
        className={clsx(
          "rounded-2xl border border-zinc-200 dark:border-zinc-800",
          "bg-white dark:bg-zinc-900/80 p-6 sm:p-8",
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
        <div className="mt-6 h-40 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        className={clsx(
          "rounded-2xl border border-red-200 dark:border-red-900/50",
          "bg-red-50 dark:bg-red-950/20 p-6",
        )}
      >
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!stats) return null;

  const { tvl, apy, allocations } = stats;

  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800",
        "bg-white dark:bg-zinc-900/80 p-6 sm:p-8",
      )}
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
        <ChartPieIcon className="w-5 h-5 text-emerald-500" />
        Treasury overview
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <BanknotesIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total value locked
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {formatTvl(tvl)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Current APY
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {apy.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Assets
            </p>
            <p className="text-xl font-semibold text-zinc-900 dark:text-white">
              {allocations.length}
            </p>
          </div>
        </div>
      </div>

      {/* Allocation chart */}
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
          Allocation
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700">
            {allocations.map((a) => (
              <div
                key={a.symbol}
                className="transition-all duration-300"
                style={{
                  width: `${a.percent}%`,
                  backgroundColor: a.color,
                }}
                title={`${a.label} ${a.percent}%`}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-y-2 sm:flex-col min-w-[180px]">
            {allocations.map((a) => (
              <li
                key={a.symbol}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: a.color }}
                />
                <span className="font-medium">{a.symbol}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {a.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
