// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {OrbitHook} from "../src/OrbitHook.sol";
import {MockStork} from "./mocks/MockStork.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

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
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG
        );
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
        new OrbitHook(manager, address(0), ETH_USD_FEED);
    }
}
