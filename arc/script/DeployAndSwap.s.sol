// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {OrbitHook} from "../src/OrbitHook.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

contract DeployAndSwap is Script {
    using CurrencyLibrary for Currency;

    PoolManager manager;
    OrbitHook hook;
    MockERC20 token0;
    MockERC20 token1;
    MockERC20 token2;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy PoolManager with deployer as owner
        manager = new PoolManager(deployer); 
        console.log("PoolManager deployed at:", address(manager));

        // 2. Deploy Tokens
        token0 = new MockERC20();
        token0.initialize("USDC", "USDC", 18);
        token1 = new MockERC20();
        token1.initialize("Wrapped Stork", "WSTK", 18);

        // Ensure token0 < token1 for sorting
        if (address(token0) > address(token1)) {
            (token0, token1) = (token1, token0);
        }
        console.log("Token0:", address(token0));
        console.log("Token1:", address(token1));

        // 3. Deploy OrbitHook using HookMiner to find salt
        // Stork address mock (random address since we aren't enforcing logic yet)
        address stork = address(0x1234567890123456789012345678901234567890); 
        
        // Forge uses a deterministic Create2Deployer for salt-based deployments in scripts
        address create2Deployer = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);
        (address hookAddress, bytes32 salt) = HookMiner.find(
            create2Deployer, 
            flags, 
            type(OrbitHook).creationCode, 
            abi.encode(address(manager), stork)
        );

        hook = new OrbitHook{salt: salt}(manager, stork);
        require(address(hook) == hookAddress, "Hook address mismatch");
        console.log("OrbitHook deployed at:", address(hook));

        // 4. Initialize Pool
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        manager.initialize(key, uint160(79228162514264337593543950336)); // SQRT_RATIO_1_1
        console.log("Pool initialized");

        // 5. Add Liquidity (Simplification: Just mint/approve manager? V4 is harder for AddLiq in script without ModifyLiquidityRouter)
        // For verify connectivity, initialization is enough to prove Hook attachment.
        // But let's try a swap if we can easily.
        // V4 requires a Router to add liquidity easily. 
        // For now, we stop at Initialization as proof of Hook connection.
        
        vm.stopBroadcast();
    }
}
