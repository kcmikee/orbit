"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { WALLET_CONNECTED_EVENT } from "@/hooks/use-wallet-connection";
import { USER_SESSION_KEY } from "./create-wallet";
import { ConnectWalletModal } from "./connect-wallet-modal";

type WalletInfo = {
  id: string;
  address: string;
  blockchain: string;
};

const BLOCKCHAIN_LABELS: Record<string, string> = {
  "ARC-TESTNET": "Arc Testnet",
  ETH: "Ethereum",
  "ETH-SEPOLIA": "Sepolia",
  BASE: "Base",
  "BASE-SEPOLIA": "Base Sepolia",
  MATIC: "Polygon",
  "MATIC-AMOY": "Polygon Amoy",
  AVAX: "Avalanche",
  "AVAX-FUJI": "Avalanche Fuji",
  ARB: "Arbitrum",
  "ARB-SEPOLIA": "Arbitrum Sepolia",
  OP: "Optimism",
  "OP-SEPOLIA": "Optimism Sepolia",
  SOL: "Solana",
  "SOL-DEVNET": "Solana Devnet",
};

const ADDABLE_NETWORKS = [
  "ARC-TESTNET",
  "BASE-SEPOLIA",
  "ETH-SEPOLIA",
  "MATIC-AMOY",
  "AVAX-FUJI",
  "ARB-SEPOLIA",
  "OP-SEPOLIA",
] as const;

function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  const first = address.slice(0, 4);
  const last = address.slice(-4);
  return `${first}****${last}`;
}

function formatNetwork(blockchain: string): string {
  return BLOCKCHAIN_LABELS[blockchain] ?? blockchain;
}

function formatBalance(amount: string, decimals?: number): string {
  const n = parseFloat(amount);
  if (isNaN(n)) return "0";
  const d = decimals ?? 6;
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(d, 4),
  });
}

export function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [balances, setBalances] = useState<
    { amount: string; symbol: string }[]
  >([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [addingNetwork, setAddingNetwork] = useState<string | null>(null);
  const [addNetworkError, setAddNetworkError] = useState<string | null>(null);
  const [addNetworkExpanded, setAddNetworkExpanded] = useState(false);

  const selectedWallet = wallets[selectedIndex] ?? null;
  const existingBlockchains = new Set(wallets.map((w) => w.blockchain));
  const availableNetworks = ADDABLE_NETWORKS.filter(
    (b) => !existingBlockchains.has(b),
  );

  const fetchWallets = useCallback(async () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return;
    try {
      const session = JSON.parse(raw) as { userToken?: string };
      if (!session.userToken) return;
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
      if (Array.isArray(list) && list.length > 0) {
        const mapped: WalletInfo[] = list.map(
          (w: { id?: string; address?: string; blockchain?: string }) => ({
            id: w.id ?? "",
            address: w.address ?? "",
            blockchain: w.blockchain ?? "Unknown",
          }),
        );
        setWallets(mapped);
        setSelectedIndex(0);
      } else {
        setWallets([]);
      }
    } catch {
      setWallets([]);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    if (!selectedWallet) {
      setBalances([]);
      return;
    }
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(USER_SESSION_KEY)
        : null;
    if (!raw) return;
    try {
      const session = JSON.parse(raw) as { userToken?: string };
      if (!session.userToken) return;
      setBalancesLoading(true);
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTokenBalance",
          userToken: session.userToken,
          walletId: selectedWallet.id,
        }),
      });
      const data = await res.json();
      const tokenBalances = data?.tokenBalances ?? [];
      const formatted = tokenBalances.map(
        (tb: {
          amount?: string;
          token?: { symbol?: string; decimals?: number };
        }) => ({
          amount: tb.amount ?? "0",
          symbol: tb.token?.symbol ?? "?",
        }),
      );
      setBalances(formatted);
    } catch {
      setBalances([]);
    } finally {
      setBalancesLoading(false);
    }
  }, [selectedWallet]);

  useEffect(() => {
    if (selectedWallet) fetchBalances();
    else setBalances([]);
  }, [selectedWallet, fetchBalances]);

  useEffect(() => {
    const openModal = () => setModalOpen(true);
    window.addEventListener("open-connect-wallet", openModal);
    return () => window.removeEventListener("open-connect-wallet", openModal);
  }, []);

  useEffect(() => {
    const checkSession = () => {
      if (typeof window === "undefined") return;
      const session = window.localStorage.getItem(USER_SESSION_KEY);
      const connected = !!session;
      setIsConnected(connected);
      if (connected) {
        fetchWallets();
      } else {
        setWallets([]);
      }
    };
    checkSession();
    window.addEventListener("storage", checkSession);
    window.addEventListener(WALLET_CONNECTED_EVENT, checkSession);
    return () => {
      window.removeEventListener("storage", checkSession);
      window.removeEventListener(WALLET_CONNECTED_EVENT, checkSession);
    };
  }, [fetchWallets]);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setModalOpen(false);
    fetchWallets();
    window.dispatchEvent(new CustomEvent(WALLET_CONNECTED_EVENT));
    const redirect =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("redirect-after-connect");
    if (redirect) {
      window.sessionStorage.removeItem("redirect-after-connect");
      window.location.href = redirect;
    }
  }, [fetchWallets]);

  const handleDisconnect = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_SESSION_KEY);
      setIsConnected(false);
      setWallets([]);
    }
  };

  const handleCopyAddress = useCallback(async () => {
    if (!selectedWallet?.address) return;
    try {
      await navigator.clipboard.writeText(selectedWallet.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [selectedWallet?.address]);

  const handleAddNetwork = useCallback(
    async (blockchain: string) => {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(USER_SESSION_KEY)
          : null;
      if (!raw) return;
      const session = JSON.parse(raw) as {
        userToken?: string;
        encryptionKey?: string;
      };
      if (!session.userToken || !session.encryptionKey) return;

      setAddingNetwork(blockchain);
      setAddNetworkError(null);

      try {
        const res = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createWallet",
            userToken: session.userToken,
            blockchain,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setAddNetworkError(
            data?.message ?? data?.error ?? "Failed to create wallet",
          );
          setAddingNetwork(null);
          return;
        }

        const challengeId = data?.challengeId;
        if (!challengeId) {
          setAddNetworkError("Invalid response");
          setAddingNetwork(null);
          return;
        }

        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
        const appId =
          process.env.NEXT_PUBLIC_CIRCLE_APP_ID ||
          process.env.CIRCLE_APP_ID ||
          "";
        const sdk = new W3SSdk({ appSettings: { appId } }, () => {});

        sdk.setAuthentication({
          userToken: session.userToken,
          encryptionKey: session.encryptionKey,
        });

        sdk.execute(challengeId, (err) => {
          setAddingNetwork(null);
          if (err) {
            setAddNetworkError((err as Error).message ?? "Challenge failed");
            return;
          }
          setAddNetworkError(null);
          fetchWallets();
        });
      } catch (err) {
        setAddingNetwork(null);
        setAddNetworkError((err as Error).message ?? "Failed to add network");
      }
    },
    [fetchWallets],
  );

  return (
    <>
      {isConnected ? (
        <Headless.Menu as="div" className="relative" style={{ zIndex: 99999 }}>
          <Headless.MenuButton
            className={clsx(
              "inline-flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg",
              "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              "transition-colors hover:bg-emerald-500/20",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
              "dark:focus:ring-offset-zinc-900",
            )}
          >
            <span className="flex items-center gap-1.5 font-mono text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {selectedWallet
                ? truncateAddress(selectedWallet.address)
                : "Connected"}
            </span>
            <ChevronDownIcon className="w-4 h-4 opacity-70" />
          </Headless.MenuButton>
          <Headless.MenuItems
            transition
            className={clsx(
              "absolute right-0 py-1 mt-2 w-64 bg-white rounded-xl ring-1 shadow-lg origin-top-right ring-zinc-950/5 focus:outline-none",
              "dark:bg-zinc-900 dark:ring-white/10",
              "transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0",
            )}
            style={{ zIndex: 99999 }}
          >
            {/* Balance summary - only in dropdown */}
            {selectedWallet && (
              <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Balance
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {balancesLoading ? (
                    <span className="text-sm text-zinc-500">...</span>
                  ) : balances.length > 0 ? (
                    <>
                      {balances.slice(0, 5).map((b, i) => (
                        <span
                          key={i}
                          className="text-sm font-medium text-zinc-900 dark:text-white"
                        >
                          {formatBalance(b.amount)} {b.symbol}
                        </span>
                      ))}
                      {balances.length > 5 && (
                        <span className="text-xs text-zinc-500">
                          +{balances.length - 5} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-zinc-500">0</span>
                  )}
                </div>
              </div>
            )}
            {/* Current network / Network switcher / Add network */}
            {selectedWallet && (
              <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1">
                  <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
                  {wallets.length > 1 ? "Switch network" : "Current network"}
                </p>
                {wallets.length > 1 ? (
                  <div className="flex flex-col gap-0.5">
                    {wallets.map((w, i) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedIndex(i)}
                        className={clsx(
                          "text-left px-2 py-1.5 rounded-lg text-sm",
                          selectedIndex === i
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        )}
                      >
                        {formatNetwork(w.blockchain)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {formatNetwork(selectedWallet.blockchain)}
                  </p>
                )}
                {availableNetworks.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setAddNetworkExpanded((prev) => !prev)}
                      className="flex w-full items-center justify-between gap-1 text-left text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-1.5"
                    >
                      <span className="flex gap-1 items-center">
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add network
                      </span>
                      <ChevronDownIcon
                        className={clsx(
                          "w-4 h-4 transition-transform",
                          addNetworkExpanded && "rotate-180",
                        )}
                      />
                    </button>
                    {addNetworkExpanded && (
                      <>
                        <div className="flex flex-col gap-0.5">
                          {availableNetworks.map((blockchain) => (
                            <button
                              key={blockchain}
                              type="button"
                              disabled={addingNetwork !== null}
                              onClick={() => handleAddNetwork(blockchain)}
                              className={clsx(
                                "flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-sm",
                                "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                              )}
                            >
                              {formatNetwork(blockchain)}
                              {addingNetwork === blockchain ? (
                                <span className="text-xs text-zinc-500">
                                  Creating...
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Add
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        {addNetworkError && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            {addNetworkError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {selectedWallet && (
              <Headless.MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleCopyAddress}
                    className={clsx(
                      "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm",
                      focus
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-700 dark:text-zinc-300",
                    )}
                  >
                    <span className="font-mono text-xs truncate max-w-[180px]">
                      {truncateAddress(selectedWallet.address)}
                    </span>
                    <span className="flex gap-1 items-center shrink-0">
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      {copySuccess ? "Copied!" : "Copy"}
                    </span>
                  </button>
                )}
              </Headless.MenuItem>
            )}
            <Headless.MenuItem>
              {({ focus }) => (
                <button
                  onClick={handleDisconnect}
                  className={clsx(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm",
                    focus
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-700 dark:text-zinc-300",
                  )}
                >
                  Disconnect Wallet
                </button>
              )}
            </Headless.MenuItem>
          </Headless.MenuItems>
        </Headless.Menu>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          className={clsx(
            "inline-flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg",
            "text-white bg-blue-600 hover:bg-blue-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-colors dark:focus:ring-offset-zinc-900",
          )}
        >
          <WalletIcon className="w-4 h-4" />
          Connect Wallet
        </button>
      )}

      <ConnectWalletModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
}
