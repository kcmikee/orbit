// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStork} from "./interfaces/IStork.sol";

/// @title StorkConsumer
/// @notice Abstract contract for consuming Stork Oracle data
contract StorkConsumer {
    IStork public immutable stork;

    error InvalidStorkAddress();

    constructor(address _stork) {
        if (_stork == address(0)) revert InvalidStorkAddress();
        stork = IStork(_stork);
    }

    /// @notice Helper to get the latest price for an asset
    /// @param assetId The Stork Asset ID
    function getPrice(bytes32 assetId) public view returns (uint256 value, uint256 timestamp) {
        return stork.getTemporalNumericValueV1(assetId);
    }
}
