"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ClipboardDocumentIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { USER_SESSION_KEY } from "./create-wallet";
import { ConnectWalletModal } from "./connect-wallet-modal";

function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address;
  const first = address.slice(0, 4);
  const last = address.slice(-4);
  return `${first}****${last}`;
}

export function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchWalletAddress = useCallback(async () => {
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
      const wallets = data?.wallets;
      if (Array.isArray(wallets) && wallets.length > 0) {
        setWalletAddress(wallets[0].address ?? null);
      }
    } catch {
      setWalletAddress(null);
    }
  }, []);

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
        fetchWalletAddress();
      } else {
        setWalletAddress(null);
      }
    };
    checkSession();
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, [fetchWalletAddress]);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setModalOpen(false);
    fetchWalletAddress();
    const redirect =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("redirect-after-connect");
    if (redirect) {
      window.sessionStorage.removeItem("redirect-after-connect");
      window.location.href = redirect;
    }
  }, [fetchWalletAddress]);

  const handleDisconnect = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_SESSION_KEY);
      setIsConnected(false);
      setWalletAddress(null);
    }
  };

  const handleCopyAddress = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [walletAddress]);

  return (
    <>
      {isConnected ? (
        <Headless.Menu as="div" className="relative">
          <Headless.MenuButton
            className={clsx(
              "inline-flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg",
              "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
              "transition-colors hover:bg-emerald-500/20",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
              "dark:focus:ring-offset-zinc-900",
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {walletAddress ? truncateAddress(walletAddress) : "Connected"}
            </span>
            <ChevronDownIcon className="w-4 h-4 opacity-70" />
          </Headless.MenuButton>
          <Headless.MenuItems
            transition
            className={clsx(
              "absolute right-0 z-50 py-1 mt-2 w-56 bg-white rounded-xl ring-1 shadow-lg origin-top-right ring-zinc-950/5 focus:outline-none",
              "dark:bg-zinc-900 dark:ring-white/10",
              "transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0",
            )}
          >
            {walletAddress && (
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
                      {truncateAddress(walletAddress)}
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
