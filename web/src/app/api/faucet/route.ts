// app/api/faucet/route.ts
// Mints test USDC to a user's wallet address
import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  parseUnits,
  formatUnits,
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

const MOCK_USDC_ADDRESS = (process.env.MOCK_USDC_ADDRESS ||
  "0x58b0104A9308f5Bff7Cc3fA78705eF81bcf1B26E") as Hex;

// MockUSDC ABI - just mint function
const MOCK_USDC_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
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
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, amount = 10000 } = body ?? {};

    if (!address) {
      return NextResponse.json(
        { error: "Missing wallet address" },
        { status: 400 },
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 },
      );
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "Faucet not configured" },
        { status: 500 },
      );
    }

    const account = privateKeyToAccount(privateKey as Hex);

    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(),
    });

    // Get current balance
    const balanceBefore = (await publicClient.readContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "balanceOf",
      args: [address as Hex],
      authorizationList: undefined,
    })) as bigint;

    // Mint USDC (6 decimals)
    const mintAmount = parseUnits(String(amount), 6);

    console.log(`Minting ${amount} USDC to ${address}...`);

    const hash = await walletClient.writeContract({
      chain: arcTestnet,
      account,
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "mint",
      args: [address as Hex, mintAmount],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get new balance
    const balanceAfter = (await publicClient.readContract({
      address: MOCK_USDC_ADDRESS,
      abi: MOCK_USDC_ABI,
      functionName: "balanceOf",
      args: [address as Hex],
      authorizationList: undefined,
    })) as bigint;

    return NextResponse.json({
      success: true,
      data: {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        minted: amount,
        balanceBefore: formatUnits(balanceBefore, 6),
        balanceAfter: formatUnits(balanceAfter, 6),
        tokenAddress: MOCK_USDC_ADDRESS,
        recipient: address,
      },
    });
  } catch (error) {
    console.error("Faucet error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to mint tokens",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
