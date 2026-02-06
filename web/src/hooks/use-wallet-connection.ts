"use client";

import { useCallback, useEffect, useState } from "react";
import { USER_SESSION_KEY } from "@/components/create-wallet";

/** Custom event dispatched when wallet connects (same-tab, since storage event doesn't fire) */
export const WALLET_CONNECTED_EVENT = "wallet-connected";

/**
 * Hook to check if the user has a wallet connected (has USER_SESSION_KEY in localStorage).
 */
export function useWalletConnection(): boolean {
  const [isConnected, setIsConnected] = useState(false);

  const checkSession = useCallback(() => {
    if (typeof window === "undefined") return;
    const session = window.localStorage.getItem(USER_SESSION_KEY);
    setIsConnected(!!session);
  }, []);

  useEffect(() => {
    checkSession();
    window.addEventListener("storage", checkSession);
    window.addEventListener(WALLET_CONNECTED_EVENT, checkSession);
    return () => {
      window.removeEventListener("storage", checkSession);
      window.removeEventListener(WALLET_CONNECTED_EVENT, checkSession);
    };
  }, [checkSession]);

  return isConnected;
}
