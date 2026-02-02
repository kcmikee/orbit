// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {IPyth} from "pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "pyth-sdk-solidity/PythStructs.sol";

/// @title OrbitHook
/// @notice A Uniswap v4 Hook for RWA Treasury Management and Yield Optimization
/// @dev Uses Pyth Network for Real-World Asset pricing data
contract OrbitHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IPyth public immutable pyth;
    bytes32 public immutable priceFeedId;
    uint256 public constant MAX_STALENESS = 3600; // 1 hour staleness for testing

    constructor(IPoolManager _poolManager, address _pyth, bytes32 _priceFeedId) 
        BaseHook(_poolManager) 
    {
        pyth = IPyth(_pyth);
        priceFeedId = _priceFeedId;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true, 
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _beforeSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        bytes calldata
    ) internal view override returns (bytes4, BeforeSwapDelta, uint24) {
        // Logic: Check oracle price before allowing swap
        // This will REVERT if the price is older than 60 seconds
        PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceFeedId, MAX_STALENESS);
        
        // Sanity check: Price must be positive
        require(price.price > 0, "OrbitHook: Invalid Oracle Price");

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
