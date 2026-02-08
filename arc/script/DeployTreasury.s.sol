// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {MockUSDC} from "../src/tokens/MockUSDC.sol";
import {MockUSYC} from "../src/tokens/MockUSYC.sol";
import {MockWETH} from "../src/tokens/MockWETH.sol";
import {TreasuryOracle} from "../src/TreasuryOracle.sol";

/// @title DeployTreasury
/// @notice Deploys the treasury token system and oracle for Orbit
/// @dev Run with: forge script script/DeployTreasury.s.sol --rpc-url $ARC_TESTNET_RPC_URL --broadcast
contract DeployTreasury is Script {
    // Deployed contract addresses
    MockUSDC public usdc;
    MockUSYC public usyc;
    MockWETH public weth;
    TreasuryOracle public oracle;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Treasury Contracts...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock Tokens
        console.log("\n=== Deploying Tokens ===");

        usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        usyc = new MockUSYC();
        console.log("MockUSYC deployed at:", address(usyc));

        weth = new MockWETH();
        console.log("MockWETH deployed at:", address(weth));

        // 2. Deploy Treasury Oracle
        console.log("\n=== Deploying Oracle ===");

        oracle = new TreasuryOracle();
        console.log("TreasuryOracle deployed at:", address(oracle));

        // 3. Mint initial tokens to deployer for testing
        console.log("\n=== Minting Initial Tokens ===");

        usdc.mint(deployer, 1_000_000 * 10**6);  // 1M USDC
        console.log("Minted 1,000,000 USDC to deployer");

        usyc.mint(deployer, 100_000 * 10**18);   // 100K USYC
        console.log("Minted 100,000 USYC to deployer");

        weth.mint(deployer, 100 * 10**18);       // 100 WETH
        console.log("Minted 100 WETH to deployer");

        // 4. Verify oracle prices
        console.log("\n=== Oracle Initial Prices ===");

        (int192 usdcPrice,,,) = oracle.getPriceData(oracle.USDC_FEED());
        console.log("USDC Price:", uint256(uint192(usdcPrice)) / 1e18, "USD");

        (int192 usycPrice,,, uint256 usycApy) = oracle.getPriceData(oracle.USYC_FEED());
        console.log("USYC Price:", uint256(uint192(usycPrice)) / 1e15, "/ 1000 USD");
        console.log("USYC APY:", usycApy, "bps");

        (int192 wethPrice,,,) = oracle.getPriceData(oracle.WETH_FEED());
        console.log("WETH Price:", uint256(uint192(wethPrice)) / 1e18, "USD");

        vm.stopBroadcast();

        // Summary
        console.log("\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("MockUSDC:       ", address(usdc));
        console.log("MockUSYC:       ", address(usyc));
        console.log("MockWETH:       ", address(weth));
        console.log("TreasuryOracle: ", address(oracle));
        console.log("========================================");
        console.log("\nAdd these to your .env file:");
        console.log("MOCK_USDC_ADDRESS=", address(usdc));
        console.log("MOCK_USYC_ADDRESS=", address(usyc));
        console.log("MOCK_WETH_ADDRESS=", address(weth));
        console.log("TREASURY_ORACLE_ADDRESS=", address(oracle));
    }
}

/// @title SetupTreasuryPool
/// @notice Sets up a Uniswap v4 pool with treasury tokens
/// @dev Run after DeployTreasury
contract SetupTreasuryPool is Script {
    function run() external {
        // This would create pools between USDC/USYC, USDC/WETH, etc.
        // For now, the existing pool setup can be used
        console.log("Pool setup - use existing Swap.s.sol with new token addresses");
    }
}
