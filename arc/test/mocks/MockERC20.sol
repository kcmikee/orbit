// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK", 18) {}

    function initialize(string memory _name, string memory _symbol, uint8 _decimals) external {
        // No-op for compatibility if needed, or just use constructor
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
