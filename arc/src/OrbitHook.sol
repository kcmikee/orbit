// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@openzeppelin/uniswap-hooks/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {IStork} from "@storknetwork/stork-evm-sdk/IStork.sol";
import {StorkStructs} from "@storknetwork/stork-evm-sdk/StorkStructs.sol";

/// @title OrbitHook
/// @notice A Uniswap v4 Hook for RWA Treasury Management and Yield Optimization
/// @dev Uses Stork Network (or TreasuryOracle) for Real-World Asset pricing data
/// @dev Built with OpenZeppelin's BaseHook for better security and maintainability
contract OrbitHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IStork public immutable stork;
    bytes32 public immutable assetFeedId;
    uint256 public constant MAX_STALENESS = 3600; // 1 hour staleness for testing

    // Events for transparency (Uniswap bounty requirement)
    event SwapValidated(bytes32 indexed poolId, int192 oraclePrice, uint64 timestamp);
    event PriceChecked(bytes32 indexed feedId, int192 price, bool isValid);

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
            afterSwap: true,  // Enable afterSwap for logging
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @notice Called before each swap to validate oracle price
    function _beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Get price from oracle (Stork/TreasuryOracle)
        StorkStructs.TemporalNumericValue memory value = stork.getTemporalNumericValueUnsafeV1(assetFeedId);

        // Sanity check: Price must be positive
        require(value.quantizedValue > 0, "OrbitHook: Invalid Oracle Price");

        // Price bounds check (prevent extreme values)
        require(value.quantizedValue < type(int192).max / 2, "OrbitHook: Price too high");

        // Staleness check (enabled for production safety)
        uint64 currentTime = uint64(block.timestamp * 1e9);
        require(currentTime - value.timestampNs < MAX_STALENESS * 1e9, "OrbitHook: Stale Price");

        // Emit event for transparency
        emit SwapValidated(PoolId.unwrap(key.toId()), value.quantizedValue, value.timestampNs);

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /// @notice Called after each swap for logging/tracking
    function _afterSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        // Could add additional logging or state updates here
        return (this.afterSwap.selector, 0);
    }

    /// @notice Get the latest price from oracle
    /// @return price The quantized price value (18 decimals)
    /// @return timestamp The timestamp in nanoseconds
    function getPrice() public view returns (int192 price, uint64 timestamp) {
        StorkStructs.TemporalNumericValue memory value = stork.getTemporalNumericValueUnsafeV1(assetFeedId);
        return (value.quantizedValue, value.timestampNs);
    }

    /// @notice Check if the current oracle price is valid and fresh
    /// @return isValid True if price is positive and not stale
    /// @return price The current price
    /// @return staleness How old the price is in seconds
    function checkPriceHealth() public view returns (bool isValid, int192 price, uint256 staleness) {
        StorkStructs.TemporalNumericValue memory value = stork.getTemporalNumericValueUnsafeV1(assetFeedId);

        uint64 currentTime = uint64(block.timestamp * 1e9);
        staleness = (currentTime - value.timestampNs) / 1e9;

        isValid = value.quantizedValue > 0 && staleness < MAX_STALENESS;
        price = value.quantizedValue;
    }
}
