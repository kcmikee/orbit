// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {OrbitHook} from "../src/OrbitHook.sol";
import {MockStork} from "./mocks/MockStork.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "./utils/HookMiner.sol";

contract OrbitHookTest is Test {
    OrbitHook hook;
    MockStork stork;
    IPoolManager manager;
    bytes32 constant ETH_USD_FEED = bytes32("ETHUSD");

    function setUp() public {
        stork = new MockStork();
        // Use a dummy address for PoolManager
        manager = IPoolManager(address(0x999));

        // Mine a salt that produces a hook address with the correct flags
        // beforeSwap + afterSwap flags
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            type(OrbitHook).creationCode,
            abi.encode(address(manager), address(stork), ETH_USD_FEED)
        );

        hook = new OrbitHook{salt: salt}(manager, address(stork), ETH_USD_FEED);
        require(address(hook) == hookAddress, "Hook address mismatch");
    }

    function test_OraclePricing() public {
        // Set price in MockStork (price in smallest units, timestamp in nanoseconds)
        stork.set(100e18, uint64(block.timestamp * 1e9));

        (int192 val, uint64 ts) = hook.getPrice();
        assertEq(val, 100e18);
        assertEq(ts, uint64(block.timestamp * 1e9));
    }

    function test_StorkConsumer_RevertIfAddressZero() public {
        vm.expectRevert("OrbitHook: Invalid Stork address");
        // This will fail during validation but tests the require check
        new OrbitHook(manager, address(0), ETH_USD_FEED);
    }

    function test_CheckPriceHealth() public {
        // Set a fresh price
        stork.set(2200e18, uint64(block.timestamp * 1e9));

        (bool isValid, int192 price, uint256 staleness) = hook.checkPriceHealth();

        assertTrue(isValid, "Price should be valid");
        assertEq(price, 2200e18, "Price should be 2200");
        assertLt(staleness, 60, "Staleness should be less than 60 seconds");
    }

    function test_CheckPriceHealth_StalePrice() public {
        // Set a price from 2 hours ago (stale)
        uint64 twoHoursAgo = uint64((block.timestamp - 7200) * 1e9);
        stork.set(2200e18, twoHoursAgo);

        (bool isValid, int192 price, uint256 staleness) = hook.checkPriceHealth();

        assertFalse(isValid, "Price should be invalid (stale)");
        assertEq(price, 2200e18, "Price should still return");
        assertGt(staleness, 3600, "Staleness should be over 1 hour");
    }

    function test_GetHookPermissions() public view {
        Hooks.Permissions memory perms = hook.getHookPermissions();

        assertTrue(perms.beforeSwap, "beforeSwap should be enabled");
        assertTrue(perms.afterSwap, "afterSwap should be enabled");
        assertFalse(perms.beforeInitialize, "beforeInitialize should be disabled");
        assertFalse(perms.beforeAddLiquidity, "beforeAddLiquidity should be disabled");
    }
}
