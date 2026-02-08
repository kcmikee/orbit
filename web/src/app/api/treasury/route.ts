// app/api/treasury/route.ts
// API endpoint for treasury operations (deposit, withdraw, stats)
import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  type Hex,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Arc Testnet Configuration
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      ],
    },
  },
  testnet: true,
});

// Contract addresses
const MOCK_USDC_ADDRESS = (process.env.MOCK_USDC_ADDRESS ||
  "0x58b0104A9308f5Bff7Cc3fA78705eF81bcf1B26E") as Hex;
const ORBIT_VAULT_ADDRESS = (process.env.ORBIT_VAULT_ADDRESS ||
  "0x9370dDf91b63cF5b2aa0c89BdC9D41209f24615F") as Hex;

// ABIs
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const VAULT_ABI = [
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    name: "redeem",
    outputs: [{ name: "assets", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultStats",
    outputs: [
      { name: "tvl", type: "uint256" },
      { name: "totalShares", type: "uint256" },
      { name: "currentSharePrice", type: "uint256" },
      { name: "apy", type: "uint256" },
      { name: "yieldEarned", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "previewDeposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    // Get private key for transactions
    const privateKey = process.env.TREASURY_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey && (action === "deposit" || action === "withdraw")) {
      return NextResponse.json(
        { error: "Treasury private key not configured" },
        { status: 500 }
      );
    }

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    switch (action) {
      case "getStats": {
        try {
          const [tvl, totalShares, sharePrice, apy, yieldEarned] =
            (await publicClient.readContract({
              address: ORBIT_VAULT_ADDRESS,
              abi: VAULT_ABI,
              functionName: "getVaultStats",
            })) as [bigint, bigint, bigint, bigint, bigint];

          return NextResponse.json({
            success: true,
            data: {
              tvl: formatUnits(tvl, 6),
              totalShares: formatUnits(totalShares, 18),
              sharePrice: formatUnits(sharePrice, 6),
              apy: Number(apy) / 100,
              yieldEarned: formatUnits(yieldEarned, 6),
              vaultAddress: ORBIT_VAULT_ADDRESS,
              usdcAddress: MOCK_USDC_ADDRESS,
            },
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: "Failed to fetch vault stats",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      }

      case "getBalance": {
        const { address } = params;
        if (!address) {
          return NextResponse.json(
            { error: "Missing address" },
            { status: 400 }
          );
        }

        try {
          const [usdcBalance, shareBalance] = await Promise.all([
            publicClient.readContract({
              address: MOCK_USDC_ADDRESS,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address as Hex],
            }),
            publicClient.readContract({
              address: ORBIT_VAULT_ADDRESS,
              abi: VAULT_ABI,
              functionName: "balanceOf",
              args: [address as Hex],
            }),
          ]);

          return NextResponse.json({
            success: true,
            data: {
              usdc: formatUnits(usdcBalance as bigint, 6),
              shares: formatUnits(shareBalance as bigint, 18),
              address,
            },
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: "Failed to fetch balances",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      }

      case "deposit": {
        const { amount } = params;
        if (!amount) {
          return NextResponse.json(
            { error: "Missing amount" },
            { status: 400 }
          );
        }

        try {
          const account = privateKeyToAccount(privateKey as Hex);
          const walletClient = createWalletClient({
            account,
            chain: arcTestnet,
            transport: http(),
          });

          const depositAmount = parseUnits(String(amount), 6); // USDC has 6 decimals

          // Check USDC balance
          const balance = (await publicClient.readContract({
            address: MOCK_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [account.address],
          })) as bigint;

          if (balance < depositAmount) {
            return NextResponse.json({
              success: false,
              error: "Insufficient USDC balance",
              data: {
                required: formatUnits(depositAmount, 6),
                available: formatUnits(balance, 6),
              },
            });
          }

          // Check allowance
          const allowance = (await publicClient.readContract({
            address: MOCK_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [account.address, ORBIT_VAULT_ADDRESS],
          })) as bigint;

          // Approve if needed
          if (allowance < depositAmount) {
            console.log("Approving USDC spend...");
            const approveHash = await walletClient.writeContract({
              chain: arcTestnet,
              account,
              address: MOCK_USDC_ADDRESS,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [ORBIT_VAULT_ADDRESS, depositAmount],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            console.log("Approved:", approveHash);
          }

          // Preview shares
          const expectedShares = (await publicClient.readContract({
            address: ORBIT_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "previewDeposit",
            args: [depositAmount],
          })) as bigint;

          // Execute deposit
          console.log(`Depositing ${amount} USDC to vault...`);
          const depositHash = await walletClient.writeContract({
            chain: arcTestnet,
            account,
            address: ORBIT_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [depositAmount, account.address],
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: depositHash,
          });

          return NextResponse.json({
            success: true,
            data: {
              txHash: depositHash,
              blockNumber: receipt.blockNumber.toString(),
              deposited: formatUnits(depositAmount, 6),
              sharesReceived: formatUnits(expectedShares, 18),
              depositor: account.address,
            },
          });
        } catch (error) {
          console.error("Deposit error:", error);
          return NextResponse.json({
            success: false,
            error: "Deposit failed",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      }

      case "withdraw": {
        const { shares } = params;
        if (!shares) {
          return NextResponse.json(
            { error: "Missing shares amount" },
            { status: 400 }
          );
        }

        try {
          const account = privateKeyToAccount(privateKey as Hex);
          const walletClient = createWalletClient({
            account,
            chain: arcTestnet,
            transport: http(),
          });

          const shareAmount = parseUnits(String(shares), 18);

          // Check share balance
          const shareBalance = (await publicClient.readContract({
            address: ORBIT_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "balanceOf",
            args: [account.address],
          })) as bigint;

          if (shareBalance < shareAmount) {
            return NextResponse.json({
              success: false,
              error: "Insufficient share balance",
              data: {
                required: formatUnits(shareAmount, 18),
                available: formatUnits(shareBalance, 18),
              },
            });
          }

          // Execute redeem
          console.log(`Redeeming ${shares} shares from vault...`);
          const redeemHash = await walletClient.writeContract({
            chain: arcTestnet,
            account,
            address: ORBIT_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "redeem",
            args: [shareAmount, account.address, account.address],
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash: redeemHash,
          });

          return NextResponse.json({
            success: true,
            data: {
              txHash: redeemHash,
              blockNumber: receipt.blockNumber.toString(),
              sharesRedeemed: formatUnits(shareAmount, 18),
              receiver: account.address,
            },
          });
        } catch (error) {
          console.error("Withdraw error:", error);
          return NextResponse.json({
            success: false,
            error: "Withdrawal failed",
            details: error instanceof Error ? error.message : String(error),
          });
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in /api/treasury:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for quick stats
export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const [tvl, totalShares, sharePrice, apy, yieldEarned] =
      (await publicClient.readContract({
        address: ORBIT_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getVaultStats",
      })) as [bigint, bigint, bigint, bigint, bigint];

    return NextResponse.json({
      success: true,
      data: {
        tvl: formatUnits(tvl, 6),
        totalShares: formatUnits(totalShares, 18),
        sharePrice: formatUnits(sharePrice, 6),
        apy: Number(apy) / 100,
        yieldEarned: formatUnits(yieldEarned, 6),
        vaultAddress: ORBIT_VAULT_ADDRESS,
        usdcAddress: MOCK_USDC_ADDRESS,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to fetch vault stats",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
