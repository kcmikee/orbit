// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @title MockWETH
/// @notice Mock Wrapped ETH for testing treasury operations
/// @dev Volatile asset - price fluctuates based on market conditions
contract MockWETH is ERC20 {
    address public owner;

    constructor() ERC20("Wrapped Ether", "WETH", 18) {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MockWETH: not owner");
        _;
    }

    /// @notice Mint tokens to an address (for testing)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Wrap ETH - deposit ETH and receive WETH
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    /// @notice Unwrap WETH - burn WETH and receive ETH
    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "MockWETH: insufficient balance");
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }

    /// @notice Faucet - get 10 WETH for testing
    function faucet() external {
        _mint(msg.sender, 10 * 10**18);
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
