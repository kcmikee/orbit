// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @title MockUSDC
/// @notice Mock USDC stablecoin for testing treasury operations
/// @dev Price is always $1.00 - this is a stablecoin
contract MockUSDC is ERC20 {
    address public owner;

    constructor() ERC20("USD Coin", "USDC", 6) {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MockUSDC: not owner");
        _;
    }

    /// @notice Mint tokens to an address (for testing)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Faucet function - anyone can get 10,000 USDC for testing
    function faucet() external {
        _mint(msg.sender, 10_000 * 10**6); // 10,000 USDC
    }

    /// @notice Burn tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
