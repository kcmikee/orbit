"use client";

import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { InputGroup } from "@/components/input";
import { USER_SESSION_KEY } from "@/components/create-wallet";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { USDC_ADDRESS, VAULT_ADDRESS } from "@/constants";
import type { DepositStep } from "@/types/treasury";

const USDC_DECIMALS = 6;

type CircleWallet = { id: string; address: string; blockchain: string };

function getSession(): { userToken: string; encryptionKey: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as { userToken?: string; encryptionKey?: string };
    if (s.userToken && s.encryptionKey)
      return { userToken: s.userToken, encryptionKey: s.encryptionKey };
    return null;
  } catch {
    return null;
  }
}

async function getArcWallet(): Promise<CircleWallet | null> {
  const session = getSession();
  if (!session) return null;
  const res = await fetch("/api/endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "listWallets",
      userToken: session.userToken,
    }),
  });
  const data = await res.json();
  const list = data?.wallets;
  if (!Array.isArray(list) || list.length === 0) return null;
  const arc = list.find(
    (w: { blockchain?: string }) => w.blockchain === "ARC-TESTNET",
  );
  const w = (arc ?? list[0]) as {
    id?: string;
    address?: string;
    blockchain?: string;
  };
  return w?.id && w?.address
    ? {
        id: w.id,
        address: w.address,
        blockchain: w.blockchain ?? "ARC-TESTNET",
      }
    : null;
}

async function createContractExecutionChallenge(params: {
  userToken: string;
  walletId: string;
  contractAddress: string;
  abiFunctionSignature: string;
  abiParameters: string[];
  feeLevel?: string;
}): Promise<string> {
  const res = await fetch("/api/endpoints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createContractExecutionChallenge",
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      data?.message ?? data?.error ?? "Failed to create challenge",
    );
  const challengeId = data?.challengeId;
  if (!challengeId) throw new Error("No challengeId returned");
  return challengeId;
}

function executeCircleChallenge(
  challengeId: string,
  userToken: string,
  encryptionKey: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    import("@circle-fin/w3s-pw-web-sdk")
      .then(({ W3SSdk }) => {
        const appId =
          process.env.NEXT_PUBLIC_CIRCLE_APP_ID ||
          process.env.CIRCLE_APP_ID ||
          "";
        const sdk = new W3SSdk({ appSettings: { appId } }, () => {});
        sdk.setAuthentication({ userToken, encryptionKey });
        sdk.execute(challengeId, (err) => {
          if (err) reject(err instanceof Error ? err : new Error(String(err)));
          else resolve();
        });
      })
      .catch(reject);
  });
}

export function DepositFlow({
  onDepositSuccess,
  usdcBalance,
  initialAmount, // Add initialAmount prop
  onCancel // Add onCancel prop
}: {
  onDepositSuccess?: () => void;
  usdcBalance?: string;
  initialAmount?: string;
  onCancel?: () => void;
}) {
  const isConnected = useWalletConnection();
  const [step, setStep] = useState<DepositStep>("amount");
  const [amount, setAmount] = useState(initialAmount || ""); // Use initialAmount
  const [approving, setApproving] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharesReceived, setSharesReceived] = useState("");

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum > 0;
  const amountRaw = Math.floor(amountNum * 10 ** USDC_DECIMALS).toString();

  const handleApprove = useCallback(async () => {
    setError(null);
    setApproving(true);
    try {
      const session = getSession();
      if (!session) {
        setError("Session expired. Please reconnect your wallet.");
        return;
      }
      const wallet = await getArcWallet();
      if (!wallet) {
        setError("No Arc wallet found. Add an Arc Testnet wallet first.");
        return;
      }
      const challengeId = await createContractExecutionChallenge({
        userToken: session.userToken,
        walletId: wallet.id,
        contractAddress: USDC_ADDRESS,
        abiFunctionSignature: "approve(address,uint256)",
        abiParameters: [VAULT_ADDRESS, amountRaw],
        feeLevel: "MEDIUM",
      });
      await executeCircleChallenge(
        challengeId,
        session.userToken,
        session.encryptionKey,
      );
      setStep("deposit");
    } catch {
      setError("Approval failed");
    } finally {
      setApproving(false);
    }
  }, [amountRaw]);

  const handleDeposit = useCallback(async () => {
    setError(null);
    setDepositing(true);
    try {
      const session = getSession();
      if (!session) {
        setError("Session expired. Please reconnect your wallet.");
        return;
      }
      const wallet = await getArcWallet();
      if (!wallet) {
        setError("No Arc wallet found. Add an Arc Testnet wallet first.");
        return;
      }
      const challengeId = await createContractExecutionChallenge({
        userToken: session.userToken,
        walletId: wallet.id,
        contractAddress: VAULT_ADDRESS,
        abiFunctionSignature: "deposit(uint256,address)",
        abiParameters: [amountRaw, wallet.address],
        feeLevel: "MEDIUM",
      });
      await executeCircleChallenge(
        challengeId,
        session.userToken,
        session.encryptionKey,
      );
      const mockShares = (amountNum * 1e6).toFixed(0);
      setSharesReceived(mockShares);
      setStep("success");
      onDepositSuccess?.();
    } catch {
      setError("Deposit failed");
    } finally {
      setDepositing(false);
    }
  }, [amountNum, amountRaw, onDepositSuccess]);

  const reset = useCallback(() => {
    setStep("amount");
    setAmount("");
    setError(null);
    setSharesReceived("");
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
          <ArrowDownTrayIcon className="w-5 h-5 text-emerald-500" />
          Deposit USDC
        </h2>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Connect your wallet to deposit USDC into the treasury and receive
          share tokens.
        </p>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-connect-wallet"))
          }
          className={clsx(
            "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
            "text-white bg-blue-600 hover:bg-blue-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
          )}
        >
          Connect wallet
        </button>
      </section>
    );
  }

  console.log(JSON.stringify(error));

  return (
    <section
      className={clsx(
        "rounded-2xl border border-zinc-200 dark:border-zinc-800",
        "p-6 bg-white dark:bg-zinc-900/80 sm:p-8",
      )}
    >
      <h2 className="flex gap-2 items-center mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
        <ArrowDownTrayIcon className="w-5 h-5 text-emerald-500" />
        Deposit USDC
      </h2>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Deposit USDC to receive vault shares. Confirm each step in your Circle
        wallet.
      </p>

      {step === "amount" && (
        <>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Amount (USDC)
            </label>
            <InputGroup>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full"
              />
            </InputGroup>
            {usdcBalance != null && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Balance: {usdcBalance} USDC
              </p>
            )}
          </div>
          <Button
            color="emerald"
            disabled={!isValidAmount}
            onClick={() => setStep("approve")}
          >
            Continue
          </Button>
        </>
      )}

      {step === "approve" && (
        <>
          <div className="p-4 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Approve the vault to spend <strong>{amount}</strong> USDC. Your
              Circle wallet will open to confirm.
            </p>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button outline onClick={() => setStep("amount")}>
              Back
            </Button>
            <Button
              color="emerald"
              disabled={approving}
              onClick={handleApprove}
            >
              {approving ? "Confirm in wallet…" : "Approve USDC"}
            </Button>
          </div>
        </>
      )}

      {step === "deposit" && (
        <>
          <div className="p-4 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Deposit <strong>{amount}</strong> USDC into the vault. Your Circle
              wallet will open to confirm.
            </p>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button onClick={() => setStep("approve")}>Back</Button>
            <Button
              color="emerald"
              disabled={depositing}
              onClick={handleDeposit}
            >
              {depositing ? "Confirm in wallet…" : "Deposit"}
            </Button>
          </div>
        </>
      )}

      {step === "success" && (
        <>
          <div className="flex gap-3 items-center p-4 mb-4 bg-emerald-50 rounded-xl dark:bg-emerald-950/30">
            <CheckCircleIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Deposit successful
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                You received {sharesReceived} shares.
              </p>
            </div>
          </div>
          <Button color="emerald" onClick={reset}>
            Deposit more
          </Button>
        </>
      )}
    </section>
  );
}
