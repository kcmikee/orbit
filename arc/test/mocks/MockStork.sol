// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStork} from "@storknetwork/stork-evm-sdk/IStork.sol";
import {StorkStructs} from "@storknetwork/stork-evm-sdk/StorkStructs.sol";

contract MockStork is IStork {
    int192 public val;
    uint64 public ts;

    function set(int192 _val, uint64 _ts) external {
        val = _val;
        ts = _ts;
    }

    function getTemporalNumericValueV1(bytes32) external view returns (StorkStructs.TemporalNumericValue memory) {
        return StorkStructs.TemporalNumericValue({
            timestampNs: ts,
            quantizedValue: val
        });
    }

    // Implementing other interface methods as stubs to satisfy IStork
    function updateTemporalNumericValuesV1(StorkStructs.TemporalNumericValueInput[] calldata) external payable {}
    function getTemporalNumericValueUnsafeV1(bytes32) external view returns (StorkStructs.TemporalNumericValue memory) {
         return StorkStructs.TemporalNumericValue({ timestampNs: ts, quantizedValue: val});
    }
    function getTemporalNumericValuesUnsafeV1(bytes32[] calldata) external view returns (StorkStructs.TemporalNumericValue[] memory) {
        return new StorkStructs.TemporalNumericValue[](0);
    }
    function getUpdateFeeV1(StorkStructs.TemporalNumericValueInput[] calldata) external pure returns (uint) { return 0; }
    function verifyPublisherSignaturesV1(StorkStructs.PublisherSignature[] calldata, bytes32) external pure returns (bool) { return true; }
    function version() external pure returns (string memory) { return "1.0.0"; }
}
