// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStork} from "../../src/interfaces/IStork.sol";

contract MockStork is IStork {
    uint256 public val;
    uint256 public ts;

    function set(uint256 _val, uint256 _ts) external {
        val = _val;
        ts = _ts;
    }

    function getTemporalNumericValueV1(bytes32) external view returns (uint256, uint256) {
        return (val, ts);
    }
}
