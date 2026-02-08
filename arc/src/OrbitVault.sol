// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title OrbitVault
/// @notice ERC4626 vault for the Orbit RWA Treasury
/// @dev Users deposit USDC and receive shares. The agent manages the treasury.
/// Shares represent proportional ownership of the treasury's total value.
contract OrbitVault is ERC4626 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ State Variables ============

    address public owner;
    address public agent;
    bool public paused;

    // Treasury tracking
    uint256 public totalDeposited;     // Total USDC ever deposited
    uint256 public totalWithdrawn;     // Total USDC ever withdrawn
    uint256 public lastYieldUpdate;    // Timestamp of last yield accrual
    uint256 public accruedYield;       // Yield earned from RWA positions

    // Yield configuration (simulated for demo)
    uint256 public constant TARGET_APY_BPS = 450; // 4.5% APY
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ============ Events ============

    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event YieldAccrued(uint256 amount, uint256 newTotal);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event AgentRebalance(address indexed agent, uint256 amount, string action);

    // ============ Errors ============

    error NotOwner();
    error NotAgent();
    error NotAuthorized();
    error VaultPaused();
    error ZeroAddress();
    error ZeroAmount();

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent && msg.sender != owner) revert NotAgent();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert VaultPaused();
        _;
    }

    // ============ Constructor ============

    /// @param _asset The underlying asset (USDC)
    /// @param _name The vault share token name
    /// @param _symbol The vault share token symbol
    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) {
        owner = msg.sender;
        agent = msg.sender; // Initially owner is also agent
        lastYieldUpdate = block.timestamp;
    }

    // ============ ERC4626 Overrides ============

    /// @notice Returns the total assets managed by the vault
    /// @dev Includes deposited assets + accrued yield
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + accruedYield;
    }

    /// @notice Deposit assets and receive shares
    function deposit(uint256 assets, address receiver)
        public
        override
        whenNotPaused
        returns (uint256 shares)
    {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Accrue yield before deposit to get accurate share price
        _accrueYield();

        shares = super.deposit(assets, receiver);
        totalDeposited += assets;

        emit Deposited(receiver, assets, shares);
        return shares;
    }

    /// @notice Withdraw assets by burning shares
    function withdraw(uint256 assets, address receiver, address shareOwner)
        public
        override
        whenNotPaused
        returns (uint256 shares)
    {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Accrue yield before withdrawal to get accurate share price
        _accrueYield();

        shares = super.withdraw(assets, receiver, shareOwner);
        totalWithdrawn += assets;

        emit Withdrawn(receiver, assets, shares);
        return shares;
    }

    /// @notice Redeem shares for assets
    function redeem(uint256 shares, address receiver, address shareOwner)
        public
        override
        whenNotPaused
        returns (uint256 assets)
    {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert ZeroAddress();

        // Accrue yield before redemption
        _accrueYield();

        assets = super.redeem(shares, receiver, shareOwner);
        totalWithdrawn += assets;

        emit Withdrawn(receiver, assets, shares);
        return assets;
    }

    // ============ Yield Management ============

    /// @notice Accrue yield based on time elapsed and target APY
    /// @dev Called automatically on deposits/withdrawals, or manually
    function _accrueYield() internal {
        if (lastYieldUpdate == 0) {
            lastYieldUpdate = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed == 0) return;

        uint256 currentBalance = IERC20(asset()).balanceOf(address(this));
        if (currentBalance == 0) {
            lastYieldUpdate = block.timestamp;
            return;
        }

        // Calculate yield: balance * APY * elapsed / seconds_per_year
        uint256 yieldAmount = (currentBalance * TARGET_APY_BPS * elapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);

        if (yieldAmount > 0) {
            accruedYield += yieldAmount;
            emit YieldAccrued(yieldAmount, accruedYield);
        }

        lastYieldUpdate = block.timestamp;
    }

    /// @notice Public function to accrue yield
    function accrueYield() external {
        _accrueYield();
    }

    /// @notice Simulate adding yield (for demo purposes)
    /// @dev In production, this would come from actual RWA returns
    function addYield(uint256 amount) external onlyAgent {
        accruedYield += amount;
        emit YieldAccrued(amount, accruedYield);
    }

    // ============ Agent Functions ============

    /// @notice Agent can rebalance treasury (move funds to RWA positions)
    /// @dev In a real implementation, this would interact with RWA protocols
    function agentRebalance(uint256 amount, string calldata action) external onlyAgent {
        emit AgentRebalance(msg.sender, amount, action);
    }

    /// @notice Agent withdraws funds for RWA allocation
    /// @dev Returns the amount that was transferred out
    function agentWithdraw(uint256 amount, address destination) external onlyAgent returns (uint256) {
        if (destination == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 available = IERC20(asset()).balanceOf(address(this));
        uint256 toTransfer = amount > available ? available : amount;

        IERC20(asset()).safeTransfer(destination, toTransfer);
        emit AgentRebalance(msg.sender, toTransfer, "WITHDRAW_FOR_RWA");

        return toTransfer;
    }

    /// @notice Agent deposits returns from RWA positions
    function agentDeposit(uint256 amount) external onlyAgent {
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
        emit AgentRebalance(msg.sender, amount, "DEPOSIT_RWA_RETURNS");
    }

    // ============ View Functions ============

    /// @notice Get the current share price (assets per share)
    /// @return Price with 18 decimals
    function sharePrice() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18; // 1:1 initially
        return (totalAssets() * 1e18) / supply;
    }

    /// @notice Get vault statistics
    function getVaultStats() external view returns (
        uint256 tvl,
        uint256 totalShares,
        uint256 currentSharePrice,
        uint256 apy,
        uint256 yieldEarned
    ) {
        tvl = totalAssets();
        totalShares = totalSupply();
        currentSharePrice = totalShares > 0 ? (tvl * 1e18) / totalShares : 1e18;
        apy = TARGET_APY_BPS;
        yieldEarned = accruedYield;
    }

    /// @notice Get user's position details
    function getUserPosition(address user) external view returns (
        uint256 shares,
        uint256 assetsValue,
        uint256 depositedValue
    ) {
        shares = balanceOf(user);
        assetsValue = convertToAssets(shares);
        depositedValue = previewRedeem(shares);
    }

    // ============ Admin Functions ============

    function setAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert ZeroAddress();
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    // ============ Emergency Functions ============

    /// @notice Emergency withdraw all funds (owner only)
    function emergencyWithdraw(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        IERC20(asset()).safeTransfer(to, balance);
    }
}
