// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {OrbitHook} from "../src/OrbitHook.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";
import {MockStork} from "../test/mocks/MockStork.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

contract DeployAndSwap is Script {
    using CurrencyLibrary for Currency;

    PoolManager manager;
    OrbitHook hook;
    MockStork mockStork;
    MockERC20 token0;
    MockERC20 token1;

    // Feed ID for ETH/USD (ASCII encoded)
    bytes32 constant ETH_USD_FEED_ID = bytes32("ETHUSD");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy PoolManager
        manager = new PoolManager(deployer);
        console.log("PoolManager deployed at:", address(manager));

        // 2. Deploy MockStork Oracle
        mockStork = new MockStork();
        console.log("MockStork deployed at:", address(mockStork));

        // Set initial price: $3000 per ETH (with 18 decimals)
        mockStork.set(3000e18, uint64(block.timestamp * 1e9));
        console.log("MockStork price set to: 3000 USD");

        // 3. Deploy Tokens
        token0 = new MockERC20();
        token0.initialize("USDC", "USDC", 18);
        token1 = new MockERC20();
        token1.initialize("Wrapped ETH", "WETH", 18);

        // Ensure token0 < token1 for sorting
        if (address(token0) > address(token1)) {
            (token0, token1) = (token1, token0);
        }
        console.log("Token0:", address(token0));
        console.log("Token1:", address(token1));

        // 4. Deploy OrbitHook using HookMiner
        address create2Deployer = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

        // BEFORE_SWAP + AFTER_SWAP flags
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            create2Deployer,
            flags,
            type(OrbitHook).creationCode,
            abi.encode(address(manager), address(mockStork), ETH_USD_FEED_ID)
        );

        hook = new OrbitHook{salt: salt}(manager, address(mockStork), ETH_USD_FEED_ID);
        require(address(hook) == hookAddress, "Hook address mismatch");
        console.log("OrbitHook deployed at:", address(hook));

        // 5. Initialize Pool
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        manager.initialize(key, uint160(79228162514264337593543950336)); // SQRT_RATIO_1_1
        console.log("Pool initialized");

        vm.stopBroadcast();
    }
}
