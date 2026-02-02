// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";

contract DeployRouter is Script {
    // Existing PoolManager on Arc
    address constant MANAGER_ADDR = 0xeba92E2a73238BC2fA209eC09A05f75828e4507D;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PoolManager manager = PoolManager(MANAGER_ADDR);
        // Deploy the test router which acts as our SwapRouter for V4 interactions
        PoolSwapTest swapRouter = new PoolSwapTest(manager);
        
        console.log("Deployed SwapRouter at:", address(swapRouter));

        vm.stopBroadcast();
    }
}
