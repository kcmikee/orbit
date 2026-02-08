// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @title MockUSYC
/// @notice Mock USYC (Hashnote/Circle tokenized US Treasury fund)
/// @dev Simulates a yield-bearing token that accrues value over time
/// Real USYC: ~4.7% APY, price increases daily
contract MockUSYC is ERC20 {
    address public owner;

    // Yield configuration
    uint256 public constant APY_BPS = 470; // 4.70% APY in basis points
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // Price tracking (18 decimals)
    uint256 public basePrice = 1e18; // Starts at $1.00
    uint256 public launchTimestamp;

    event YieldAccrued(uint256 oldPrice, uint256 newPrice, uint256 timestamp);

    constructor() ERC20("US Yield Coin", "USYC", 18) {
        owner = msg.sender;
        launchTimestamp = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "MockUSYC: not owner");
        _;
    }

    /// @notice Get current price including accrued yield
    /// @return Current price with 18 decimals (e.g., 1.047e18 = $1.047)
    function getCurrentPrice() public view returns (uint256) {
        uint256 elapsed = block.timestamp - launchTimestamp;

        // Calculate yield: basePrice * (1 + APY * elapsed / SECONDS_PER_YEAR)
        // Using fixed-point math to avoid overflow
        uint256 yieldAccrued = (basePrice * APY_BPS * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        return basePrice + yieldAccrued;
    }

    /// @notice Get USD value of a token amount
    /// @param amount Amount of USYC tokens (18 decimals)
    /// @return USD value with 18 decimals
    function getUSDValue(uint256 amount) external view returns (uint256) {
        return (amount * getCurrentPrice()) / 1e18;
    }

    /// @notice Deposit USDC and receive USYC shares
    /// @dev In real implementation, this would integrate with actual USDC
    /// @param usdcAmount Amount of USDC to deposit (6 decimals)
    function deposit(uint256 usdcAmount) external {
        // Convert USDC (6 decimals) to USYC amount based on current price
        // USYC amount = USDC value / current price
        uint256 usdcValue = usdcAmount * 1e12; // Scale to 18 decimals
        uint256 usycAmount = (usdcValue * 1e18) / getCurrentPrice();

        _mint(msg.sender, usycAmount);
    }

    /// @notice Withdraw USYC and receive USDC value
    /// @param usycAmount Amount of USYC to withdraw
    /// @return usdcValue USD value to receive (would be USDC in real impl)
    function withdraw(uint256 usycAmount) external returns (uint256 usdcValue) {
        require(balanceOf[msg.sender] >= usycAmount, "MockUSYC: insufficient balance");

        usdcValue = (usycAmount * getCurrentPrice()) / 1e18;
        _burn(msg.sender, usycAmount);

        return usdcValue;
    }

    /// @notice Mint tokens (owner only, for testing)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Faucet - get 1,000 USYC for testing
    function faucet() external {
        _mint(msg.sender, 1_000 * 10**18);
    }

    /// @notice Admin function to set base price (for testing scenarios)
    function setBasePrice(uint256 _basePrice) external onlyOwner {
        uint256 oldPrice = getCurrentPrice();
        basePrice = _basePrice;
        launchTimestamp = block.timestamp; // Reset yield calculation
        emit YieldAccrued(oldPrice, _basePrice, block.timestamp);
    }

    /// @notice Get current APY
    function getAPY() external pure returns (uint256) {
        return APY_BPS; // Returns 470 = 4.70%
    }
}
