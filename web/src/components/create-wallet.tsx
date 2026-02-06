"use client";

import { useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

// Initialize SDK outside component to avoid re-init on re-renders
let sdk: W3SSdk;

if (typeof window !== "undefined") {
  sdk = new W3SSdk({
    appSettings: {
      appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID || "",
    },
  });
}

export default function CreateWallet() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  const handleCreateWallet = async () => {
    setLoading(true);
    setStatus("Initializing user on server...");

    try {
      // 1. Call our backend to get the secrets and challenge
      const res = await fetch("/api/circle/create-wallet", { method: "POST" });
      const data = await res.json();

      if (!data.challengeId) {
        setStatus("User already has a wallet or no challenge returned.");
        setLoading(false);
        return;
      }

      setStatus("Please complete the PIN setup in the pop-up...");

      // 2. Set Authentication on the SDK
      sdk.setAuthentication({
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      });

      // 3. Execute the Challenge
      // This is what triggers the UI Modal to pop up!
      sdk.execute(data.challengeId, (error, result) => {
        setLoading(false);
        if (error) {
          console.error(error);
          setStatus(`Error: ${error.message}`);
          return;
        }

        if (result) {
          console.log("Challenge Result:", result);
          if (result.type === "CREATE_WALLET" && result.status === "COMPLETE") {
            setStatus("Wallet Created Successfully!");
          } else {
            setStatus(`Status: ${result.status}`);
          }
        }
      });
    } catch (err) {
      console.error(err);
      setStatus("Failed to connect to server.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateWallet}
      disabled={loading}
      className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
    >
      {loading ? "Processing..." : "Create Wallet"}
    </button>
  );
}
