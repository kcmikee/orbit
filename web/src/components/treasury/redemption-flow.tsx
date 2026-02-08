"use client";

import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { InputGroup } from "@/components/input";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useTreasuryPortfolio } from "@/hooks/use-treasury";
import type { RedemptionStep } from "@/types/treasury";

export function RedemptionFlow({
  onRedeemSuccess,
}: {
  onRedeemSuccess?: () => void;
}) {
  const isConnected = useWalletConnection();
  const { portfolio } = useTreasuryPortfolio();
  const [step, setStep] = useState<RedemptionStep>("amount");
  const [sharesInput, setSharesInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcReceived, setUsdcReceived] = useState("");

  const sharesNum = parseFloat(sharesInput) || 0;
  const maxShares = portfolio?.sharesBalanceFormatted ?? 0;
  const isValidShares = sharesNum > 0 && sharesNum <= maxShares;
  // 1:1 for mock; in reality use vault.convertToAssets(shares)
  const usdcToReceive = sharesNum;

  const handleRedeem = useCallback(async () => {
    setError(null);
    setRedeeming(true);
    try {
      // TODO: call vault.redeem(shares)
      await new Promise((r) => setTimeout(r, 2000));
      setUsdcReceived(usdcToReceive.toFixed(2));
      setStep("success");
      onRedeemSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Redemption failed");
    } finally {
      setRedeeming(false);
    }
  }, [usdcToReceive, onRedeemSuccess]);

  const reset = useCallback(() => {
    setStep("amount");
    setSharesInput("");
    setError(null);
    setUsdcReceived("");
  }, []);

  if (!isConnected) {
    return (
      <section
        className={clsx(
          "rounded-2xl border border-zinc-200 dark:border-zinc-800",
          "p-6 bg-white dark:bg-zinc-900/80 sm:p-8",
        )}
      >
        <h2 className="flex gap-2 items-center mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
          <ArrowUturnLeftIcon className="w-5 h-5 text-amber-500" />
          Redeem shares
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect your wallet to redeem vault shares for USDC.
        </p>
      </section>
    );
  }

  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800",
        "p-6 bg-white dark:bg-zinc-900/80 sm:p-8",
      )}
    >
      <h2 className="flex gap-2 items-center mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
        <ArrowUturnLeftIcon className="w-5 h-5 text-amber-500" />
        Redeem shares
      </h2>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Burn vault shares to receive USDC (and any accrued yield).
      </p>

      {step === "amount" && (
        <>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Shares to redeem
            </label>
            <InputGroup>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={sharesInput}
                onChange={(e) => setSharesInput(e.target.value)}
                className="w-full"
              />
            </InputGroup>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Max: {maxShares.toLocaleString()} shares
            </p>
          </div>
          <div className="p-4 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You will receive approximately{" "}
              <strong className="text-zinc-900 dark:text-white">
                $
                {usdcToReceive.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </strong>
            </p>
          </div>
          <Button
            color="amber"
            disabled={!isValidShares}
            onClick={() => setStep("confirm")}
          >
            Continue
          </Button>
        </>
      )}

      {step === "confirm" && (
        <>
          <div className="p-4 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Redeem <strong>{sharesInput}</strong> shares for{" "}
              <strong>${usdcToReceive.toFixed(2)} USDC</strong>.
            </p>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button color="zinc" onClick={() => setStep("amount")}>
              Back
            </Button>
            <Button color="amber" disabled={redeeming} onClick={handleRedeem}>
              {redeeming ? "Redeeming…" : "Confirm redemption"}
            </Button>
          </div>
        </>
      )}

      {step === "success" && (
        <>
          <div className="flex gap-3 items-center p-4 mb-4 bg-amber-50 rounded-xl dark:bg-amber-950/30">
            <CheckCircleIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Redemption successful
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                You received {usdcReceived} USDC.
              </p>
            </div>
          </div>
          <Button color="amber" onClick={reset}>
            Redeem more
          </Button>
        </>
      )}
    </section>
  );
}
