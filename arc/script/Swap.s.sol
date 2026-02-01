// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";

contract SwapScript is Script {
    using CurrencyLibrary for Currency;

    // Addresses from previous deployment
    address constant MANAGER_ADDR = 0xE5BF8439496D8D416d51822636726be37A77060B;
    address constant HOOK_ADDR = 0x17248E22814D108D349CC4a94CbE3d9a168240C0;
    address constant TOKEN0_ADDR = 0x130e89002e2DcE004D7b5b1f41D242B06b3C7D31;
    address constant TOKEN1_ADDR = 0x8a5c07D09f3619bE408c83de9a45a4de7AA61564;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        IPoolManager manager = IPoolManager(MANAGER_ADDR);
        MockERC20 token0 = MockERC20(TOKEN0_ADDR);
        MockERC20 token1 = MockERC20(TOKEN1_ADDR);

        // 1. Deploy Test Routers
        PoolModifyLiquidityTest lpRouter = new PoolModifyLiquidityTest(manager);
        PoolSwapTest swapRouter = new PoolSwapTest(manager);
        
        console.log("LP Router:", address(lpRouter));
        console.log("Swap Router:", address(swapRouter));

        // 2. Mint Tokens to Deployer
        token0.mint(deployer, 1000 ether);
        token1.mint(deployer, 1000 ether);

        // 3. Approve Routers
        token0.approve(address(lpRouter), type(uint256).max);
        token1.approve(address(lpRouter), type(uint256).max);
        token0.approve(address(swapRouter), type(uint256).max);
        token1.approve(address(swapRouter), type(uint256).max);

        // 4. Add Liquidity
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(TOKEN0_ADDR),
            currency1: Currency.wrap(TOKEN1_ADDR),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK_ADDR)
        });

        // Add liquidity in range [-60, 60]
        lpRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -60,
                tickUpper: 60,
                liquidityDelta: 10 ether,
                salt: bytes32(0)
            }),
            new bytes(0)
        );
        console.log("Liquidity Added");

        // 5. Swap
        // Swap 0.1 TOKEN0 for TOKEN1
        bool zeroForOne = true;
        int256 amountSpecified = -0.1 ether; // Exact Input
        
        SwapParams memory params = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
        });

        PoolSwapTest.TestSettings memory settings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        swapRouter.swap(key, params, settings, new bytes(0));
        console.log("Swap Executed Successfully!");

        vm.stopBroadcast();
    }
}
