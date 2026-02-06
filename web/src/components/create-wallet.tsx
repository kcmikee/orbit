"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

export const DEVICE_ID_KEY = "circle_device_id";
export const USER_SESSION_KEY = "circle_user_session";

type UserSession = {
  userToken: string;
  encryptionKey: string;
  refreshToken?: string;
  email?: string;
};

type CreateWalletProps = {
  onConnect?: () => void;
  embedded?: boolean;
};

export default function CreateWallet({ onConnect }: CreateWalletProps) {
  const sdkRef = useRef<W3SSdk | null>(null);
  const emailRef = useRef<string>("");
  const initAndCreateRef = useRef<(session: UserSession) => void>(() => {});
  const loginCompleteHandlerRef = useRef<
    (err: unknown, result: unknown) => void
  >(() => {});
  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [, setLoginResult] = useState<UserSession | null>(null);
  const [walletCreated, setWalletCreated] = useState(false);

  const initializeAndCreateWallet = useCallback(
    async (session: UserSession) => {
      try {
        const res = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "initializeUser",
            userToken: session.userToken,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.code === 155106) {
            setWalletCreated(true);
            setStatus("You already have a wallet.");
            setLoading(false);
            onConnect?.();
            return;
          }
          const msg = data.error || data.message || "Failed to initialize user";
          setError(msg);
          setLoading(false);
          return;
        }

        const challengeId = data.challengeId;
        if (!challengeId) {
          setWalletCreated(true);
          setStatus("Wallet ready.");
          setLoading(false);
          onConnect?.();
          return;
        }

        setStatus("Complete PIN setup in the pop-up...");
        const sdk = sdkRef.current;
        if (!sdk) {
          setError("SDK not ready");
          setLoading(false);
          return;
        }

        sdk.setAuthentication({
          userToken: session.userToken,
          encryptionKey: session.encryptionKey,
        });

        sdk.execute(challengeId, (err, result) => {
          setLoading(false);
          if (err) {
            setError(err.message || "Challenge failed");
            return;
          }
          if (
            result?.type === "CREATE_WALLET" &&
            result?.status === "COMPLETE"
          ) {
            setWalletCreated(true);
            setStatus("Wallet created successfully!");
            onConnect?.();
          } else {
            setStatus(result?.status ? `Status: ${result.status}` : "Done");
          }
        });
      } catch (err) {
        console.error(err);
        setError("Failed to create wallet.");
        setLoading(false);
      }
    },
    [onConnect],
  );

  initAndCreateRef.current = initializeAndCreateWallet;

  // Initialize SDK and get deviceId on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
        const appId =
          process.env.NEXT_PUBLIC_CIRCLE_APP_ID ||
          process.env.CIRCLE_APP_ID ||
          "";

        const handleLoginComplete = (err: unknown, result: unknown) => {
          if (cancelled) return;
          const e = err as { message?: string } | null;
          const r = result as
            | {
                userToken: string;
                encryptionKey: string;
                refreshToken?: string;
              }
            | null
            | undefined;
          if (e) {
            setError(e.message || "Login failed");
            setLoading(false);
            return;
          }
          if (r?.userToken && r?.encryptionKey) {
            const session: UserSession = {
              userToken: r.userToken,
              encryptionKey: r.encryptionKey,
              refreshToken: r.refreshToken,
            };
            setLoginResult(session);
            setStatus("Email verified! Creating wallet...");
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                USER_SESSION_KEY,
                JSON.stringify({ ...session, email: emailRef.current }),
              );
            }
            initAndCreateRef.current(session);
          }
        };

        loginCompleteHandlerRef.current = handleLoginComplete;
        const sdk = new W3SSdk({ appSettings: { appId } }, (err, res) =>
          loginCompleteHandlerRef.current(err, res),
        );

        sdkRef.current = sdk;

        // Get deviceId (persists across devices for same browser)
        let cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem(DEVICE_ID_KEY)
            : null;
        if (!cached) {
          const id = await sdk.getDeviceId();
          cached = id;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(DEVICE_ID_KEY, id);
          }
        }
        if (!cancelled) {
          setDeviceId(cached);
          setSdkReady(true);
          setStatus("");
        }
      } catch (err) {
        console.error("SDK init failed:", err);
        if (!cancelled) {
          setError("Failed to initialize wallet SDK");
        }
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once; initializeAndCreateWallet is stable via onConnect
  }, []);

  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    emailRef.current = trimmed;
    if (!trimmed) {
      setError("Please enter your email.");
      return;
    }
    if (!deviceId || !sdkRef.current) {
      setError("SDK not ready. Please wait...");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Sending OTP to your email...");

    try {
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDeviceTokenEmail",
          deviceId,
          email: trimmed,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error ||
          data.message ||
          (data.code ? `Error ${data.code}` : "Failed to send OTP");
        setError(msg);
        setLoading(false);
        return;
      }

      const { deviceToken, deviceEncryptionKey, otpToken } = data;
      if (!deviceToken || !deviceEncryptionKey || !otpToken) {
        setError("Invalid response from server.");
        setLoading(false);
        return;
      }

      // Clear URL hash to prevent SDK's execSocialLoginStatusCheck from
      // triggering the wrong flow (e.g. social verify-token) when updateConfigs runs
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }

      sdkRef.current.updateConfigs(
        {
          appSettings: {
            appId:
              process.env.NEXT_PUBLIC_CIRCLE_APP_ID ||
              process.env.CIRCLE_APP_ID ||
              "",
          },
          loginConfigs: {
            deviceToken,
            deviceEncryptionKey,
            otpToken,
          },
        },
        (err, res) => loginCompleteHandlerRef.current(err, res),
      );

      setStatus("Check your email and enter the OTP in the pop-up...");
      sdkRef.current.setOnResendOtpEmail(async () => {
        const r = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "resendOtp",
            otpToken,
            email: trimmed,
            deviceId,
          }),
        });
        const d = await r.json();
        if (r.ok && d.otpToken) {
          sdkRef.current?.updateConfigs(
            {
              appSettings: {
                appId:
                  process.env.NEXT_PUBLIC_CIRCLE_APP_ID ||
                  process.env.CIRCLE_APP_ID ||
                  "",
              },
              loginConfigs: {
                deviceToken,
                deviceEncryptionKey,
                otpToken: d.otpToken,
              },
            },
            (err, res) => loginCompleteHandlerRef.current(err, res),
          );
        }
      });
      sdkRef.current.verifyOtp();
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">
        Sign in with your email to create a wallet. You can use the same email
        on any device to access it.
      </p>

      {!walletCreated ? (
        <>
          <div>
            <label
              htmlFor="circle-email"
              className="block mb-1 text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="circle-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@example.com"
              disabled={loading || !sdkReady}
              className="px-3 py-2 w-full text-white rounded-md border border-neutral-300 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-neutral-100 disabled:text-neutral-500"
            />
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading || !sdkReady || !email.trim()}
            className="px-6 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-neutral-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Create Wallet"}
          </button>
        </>
      ) : (
        <p className="text-sm font-medium text-green-600">{status}</p>
      )}

      {status && !walletCreated && (
        <p className="text-sm text-neutral-600">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
