"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { USER_SESSION_KEY } from "@/components/create-wallet";
import { useFaucet, useDeposit, MOCK_USDC_ADDRESS, ORBIT_VAULT_ADDRESS } from "@/hooks/use-treasury";

type UserSession = {
  userToken: string;
  encryptionKey: string;
  refreshToken?: string;
  email?: string;
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  state: string;
};

export function TreasuryActions() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [shareBalance, setShareBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [status, setStatus] = useState<string>("");
  const sdkRef = useRef<any>(null);

  const { requestFaucet, loading: faucetLoading } = useFaucet();
  const { createApproveChallenge, createDepositChallenge, loading: depositLoading } = useDeposit();

  // Load session and SDK
  useEffect(() => {
    const stored = localStorage.getItem(USER_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
      } catch {
        // Invalid session
      }
    }

    // Load Circle SDK
    const loadSdk = async () => {
      try {
        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
        const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID || "";
        sdkRef.current = new W3SSdk({ appSettings: { appId } });
      } catch (err) {
        console.error("Failed to load Circle SDK:", err);
      }
    };
    loadSdk();
  }, []);

  // Load wallets when session is available
  useEffect(() => {
    if (!session?.userToken) return;

    const fetchWallets = async () => {
      try {
        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "listWallets",
            userToken: session.userToken,
          }),
        });
        const data = await response.json();
        if (data.wallets && data.wallets.length > 0) {
          setWallets(data.wallets);
          // Select first Arc testnet wallet
          const arcWallet = data.wallets.find(
            (w: Wallet) => w.blockchain === "ARC-TESTNET"
          );
          if (arcWallet) {
            setSelectedWallet(arcWallet);
          }
        }
      } catch (err) {
        console.error("Failed to fetch wallets:", err);
      }
    };
    fetchWallets();
  }, [session]);

  // Fetch balances when wallet is selected
  useEffect(() => {
    if (!selectedWallet?.address) return;

    const fetchBalances = async () => {
      try {
        const response = await fetch("/api/treasury", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "getBalance",
            address: selectedWallet.address,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setUsdcBalance(data.data.usdc);
          setShareBalance(data.data.shares);
        }
      } catch (err) {
        console.error("Failed to fetch balances:", err);
      }
    };
    fetchBalances();
  }, [selectedWallet]);

  // Request faucet
  const handleFaucet = useCallback(async () => {
    if (!selectedWallet?.address) {
      setStatus("Please connect a wallet first");
      return;
    }

    setStatus("Requesting faucet...");
    const result = await requestFaucet(selectedWallet.address, 10000);
    if (result) {
      setStatus(`Minted 10,000 USDC! New balance: ${result.balanceAfter} USDC`);
      setUsdcBalance(result.balanceAfter);
    } else {
      setStatus("Faucet request failed");
    }
  }, [selectedWallet, requestFaucet]);

  // Execute deposit with Circle SDK
  const handleDeposit = useCallback(async () => {
    if (!session?.userToken || !selectedWallet || !sdkRef.current) {
      setStatus("Please connect a wallet first");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setStatus("Please enter a valid amount");
      return;
    }

    if (parseFloat(usdcBalance) < amount) {
      setStatus("Insufficient USDC balance. Use faucet first!");
      return;
    }

    try {
      // Step 1: Approve
      setStatus("Step 1/2: Creating approval transaction...");
      const approveResult = await createApproveChallenge(
        session.userToken,
        selectedWallet.id,
        amount
      );

      if (!approveResult) {
        setStatus("Failed to create approval");
        return;
      }

      // Execute approve challenge
      setStatus("Step 1/2: Please approve USDC spend in popup...");
      sdkRef.current.setAuthentication({
        userToken: session.userToken,
        encryptionKey: session.encryptionKey,
      });

      await new Promise<void>((resolve, reject) => {
        sdkRef.current.execute(approveResult.challengeId, (err: any, result: any) => {
          if (err) {
            reject(err);
          } else if (result?.status === "COMPLETE") {
            resolve();
          } else {
            reject(new Error("Approval cancelled"));
          }
        });
      });

      // Step 2: Deposit
      setStatus("Step 2/2: Creating deposit transaction...");
      const depositResult = await createDepositChallenge(
        session.userToken,
        selectedWallet.id,
        selectedWallet.address,
        amount
      );

      if (!depositResult) {
        setStatus("Failed to create deposit");
        return;
      }

      setStatus("Step 2/2: Please confirm deposit in popup...");
      await new Promise<void>((resolve, reject) => {
        sdkRef.current.execute(depositResult.challengeId, (err: any, result: any) => {
          if (err) {
            reject(err);
          } else if (result?.status === "COMPLETE") {
            resolve();
          } else {
            reject(new Error("Deposit cancelled"));
          }
        });
      });

      setStatus(`Successfully deposited ${amount} USDC!`);

      // Refresh balances
      const response = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getBalance",
          address: selectedWallet.address,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUsdcBalance(data.data.usdc);
        setShareBalance(data.data.shares);
      }

    } catch (err) {
      console.error("Deposit error:", err);
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [session, selectedWallet, depositAmount, usdcBalance, createApproveChallenge, createDepositChallenge]);

  if (!session) {
    return (
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect your wallet to access treasury actions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
        Treasury Actions
      </h3>

      {selectedWallet ? (
        <>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Wallet: {selectedWallet.address.slice(0, 8)}...{selectedWallet.address.slice(-6)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">USDC Balance:</span>
              <span className="ml-2 font-semibold">{parseFloat(usdcBalance).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-zinc-500">Vault Shares:</span>
              <span className="ml-2 font-semibold">{parseFloat(shareBalance).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleFaucet}
              disabled={faucetLoading}
              color="green"
              className="flex-1"
            >
              {faucetLoading ? "Minting..." : "Get 10K USDC (Faucet)"}
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            />
            <Button
              onClick={handleDeposit}
              disabled={depositLoading}
              color="blue"
            >
              {depositLoading ? "Processing..." : "Deposit USDC"}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Loading wallet...</p>
      )}

      {status && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
          {status}
        </p>
      )}
    </div>
  );
}
