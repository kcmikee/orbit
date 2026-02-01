// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStork} from "@storknetwork/stork-evm-sdk/IStork.sol";
import {StorkStructs} from "@storknetwork/stork-evm-sdk/StorkStructs.sol";

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
    function getPrice(bytes32 assetId) public view returns (int192 value, uint64 timestamp) {
        StorkStructs.TemporalNumericValue memory data = stork.getTemporalNumericValueV1(assetId);
        return (data.quantizedValue, data.timestampNs);
    }
}
