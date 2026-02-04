// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {IStork} from "@storknetwork/stork-evm-sdk/IStork.sol";
import {StorkStructs} from "@storknetwork/stork-evm-sdk/StorkStructs.sol";

/// @title OrbitHook
/// @notice A Uniswap v4 Hook for RWA Treasury Management and Yield Optimization
/// @dev Uses Stork Network for Real-World Asset pricing data
contract OrbitHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IStork public immutable stork;
    bytes32 public immutable assetFeedId;
    uint256 public constant MAX_STALENESS = 3600; // 1 hour staleness for testing

    constructor(IPoolManager _poolManager, address _stork, bytes32 _assetFeedId) 
        BaseHook(_poolManager) 
    {
        require(_stork != address(0), "OrbitHook: Invalid Stork address");
        stork = IStork(_stork);
        assetFeedId = _assetFeedId;
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
        // Using unsafe version for now as we're using MockStork
        StorkStructs.TemporalNumericValue memory value = stork.getTemporalNumericValueUnsafeV1(assetFeedId);
        
        // Sanity check: Price must be positive
        require(value.quantizedValue > 0, "OrbitHook: Invalid Oracle Price");
        
        // For production, check staleness:
        // uint64 currentTime = uint64(block.timestamp * 1e9); // Convert to nanoseconds
        // require(currentTime - value.timestampNs < MAX_STALENESS * 1e9, "OrbitHook: Stale Price");

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /// @notice Get the latest price from Stork oracle
    /// @return price The quantized price value
    /// @return timestamp The timestamp in nanoseconds
    function getPrice() public view returns (int192 price, uint64 timestamp) {
        StorkStructs.TemporalNumericValue memory value = stork.getTemporalNumericValueUnsafeV1(assetFeedId);
        return (value.quantizedValue, value.timestampNs);
    }
}
