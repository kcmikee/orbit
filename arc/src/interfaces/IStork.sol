// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStork {
    /// @notice Returns the latest value and timestamp for a given asset ID
    /// @param id The Stork Asset ID (bytes32)
    /// @return value The value of the asset (scaled, often 18 decimals, check publisher)
    /// @return timestamp The timestamp of the last update
    function getTemporalNumericValueV1(bytes32 id) external view returns (uint256 value, uint256 timestamp);
}
