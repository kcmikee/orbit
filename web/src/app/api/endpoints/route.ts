// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

const CIRCLE_BASE_URL =
  process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "createDeviceToken": {
        const { deviceId } = params;
        if (!deviceId) {
          return NextResponse.json(
            { error: "Missing deviceId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/social/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              deviceId,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { deviceToken, deviceEncryptionKey }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "createDeviceTokenEmail": {
        const { deviceId, email } = params;
        if (!deviceId || !email) {
          return NextResponse.json(
            { error: "Missing deviceId or email" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/email/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              deviceId,
              email: String(email).trim().toLowerCase(),
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { deviceToken, deviceEncryptionKey, otpToken }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "resendOtp": {
        const { otpToken, email, deviceId } = params;
        if (!otpToken || !email || !deviceId) {
          return NextResponse.json(
            { error: "Missing otpToken, email, or deviceId" },
            { status: 400 },
          );
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CIRCLE_API_KEY}`,
        };
        // X-User-Token may be required; omit for pre-login resend
        const userToken = params.userToken;
        if (userToken) {
          headers["X-User-Token"] = userToken;
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/users/email/resendOTP`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              otpToken,
              email: String(email).trim().toLowerCase(),
              deviceId,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data.data, { status: 200 });
      }

      case "initializeUser": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/initialize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify({
              idempotencyKey: crypto.randomUUID(),
              accountType: "SCA",
              blockchains: ["ARC-TESTNET"],
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          // Pass through Circle error payload (e.g. code 155106: user already initialized)
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { challengeId }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "listWallets": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
          method: "GET",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
            "X-User-Token": userToken,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { wallets: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "createWallet": {
        const { userToken, blockchain } = params;
        if (!userToken || !blockchain) {
          return NextResponse.json(
            { error: "Missing userToken or blockchain" },
            { status: 400 },
          );
        }
        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/user/wallets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
            "X-User-Token": userToken,
          },
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            blockchains: [blockchain],
            accountType: "SCA",
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }
        return NextResponse.json(data.data ?? data, { status: 200 });
      }

      case "getTokenBalance": {
        const { userToken, walletId } = params;
        if (!userToken || !walletId) {
          return NextResponse.json(
            { error: "Missing userToken or walletId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { tokenBalances: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "createContractExecutionChallenge": {
        const {
          userToken,
          walletId,
          contractAddress,
          abiFunctionSignature,
          abiParameters,
          feeLevel,
        } = params;
        if (!userToken || !walletId || !contractAddress) {
          return NextResponse.json(
            { error: "Missing userToken, walletId, or contractAddress" },
            { status: 400 },
          );
        }
        const payload: Record<string, unknown> = {
          idempotencyKey: crypto.randomUUID(),
          walletId,
          contractAddress,
          blockchain: "ARC-TESTNET",
          feeLevel: feeLevel ?? "MEDIUM",
        };
        if (abiFunctionSignature)
          payload.abiFunctionSignature = abiFunctionSignature;
        if (abiParameters) payload.abiParameters = abiParameters;

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/transactions/contractExecution`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify(payload),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }
        return NextResponse.json(data.data ?? data, { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.log("Error in /api/endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
