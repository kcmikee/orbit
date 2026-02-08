// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IStork} from "@storknetwork/stork-evm-sdk/IStork.sol";
import {StorkStructs} from "@storknetwork/stork-evm-sdk/StorkStructs.sol";

/// @title TreasuryOracle
/// @notice Multi-asset price oracle for Orbit Treasury
/// @dev Implements IStork interface for compatibility with OrbitHook
/// Supports multiple asset feeds: USDC, USYC, WETH, BUIDL
contract TreasuryOracle is IStork {
    address public owner;
    address public agent; // Authorized agent to update prices

    // Asset feed IDs (keccak256 of asset symbol)
    bytes32 public constant USDC_FEED = keccak256("USDC");
    bytes32 public constant USYC_FEED = keccak256("USYC");
    bytes32 public constant WETH_FEED = keccak256("WETH");
    bytes32 public constant ETH_USD_FEED = keccak256("ETHUSD");
    bytes32 public constant BUIDL_FEED = keccak256("BUIDL");

    // Price data storage
    struct PriceData {
        int192 price;           // Price in USD with 18 decimals
        uint64 timestampNs;     // Timestamp in nanoseconds
        int192 change24h;       // 24h price change in basis points (e.g., 500 = 5%)
        uint256 apy;            // APY in basis points (for yield assets)
    }

    mapping(bytes32 => PriceData) public prices;

    // Events
    event PriceUpdated(bytes32 indexed feedId, int192 price, uint64 timestamp);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);

    constructor() {
        owner = msg.sender;
        agent = msg.sender;

        // Initialize default prices
        _initializeDefaultPrices();
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "TreasuryOracle: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == agent, "TreasuryOracle: not authorized");
        _;
    }

    /// @notice Initialize with realistic default prices
    function _initializeDefaultPrices() internal {
        uint64 ts = uint64(block.timestamp * 1e9);

        // USDC - Always $1.00
        prices[USDC_FEED] = PriceData({
            price: 1e18,        // $1.00
            timestampNs: ts,
            change24h: 0,       // Stablecoin, no change
            apy: 0              // No yield
        });

        // USYC - Yield-bearing treasury token ~$1.047 (reflects 4.7% APY accrued)
        prices[USYC_FEED] = PriceData({
            price: 1047e15,     // $1.047
            timestampNs: ts,
            change24h: 13,      // +0.013% daily from yield
            apy: 470            // 4.70% APY
        });

        // WETH/ETH - Volatile crypto asset
        prices[WETH_FEED] = PriceData({
            price: 2200e18,     // $2,200
            timestampNs: ts,
            change24h: -350,    // -3.5% today
            apy: 0              // No yield
        });

        prices[ETH_USD_FEED] = prices[WETH_FEED]; // Alias

        // BUIDL - BlackRock tokenized treasury ~$1.045 (4.5% APY)
        prices[BUIDL_FEED] = PriceData({
            price: 1045e15,     // $1.045
            timestampNs: ts,
            change24h: 12,      // +0.012% daily from yield
            apy: 450            // 4.50% APY
        });
    }

    // ============ IStork Interface Implementation ============

    function getTemporalNumericValueV1(bytes32 id)
        external
        view
        returns (StorkStructs.TemporalNumericValue memory)
    {
        PriceData storage data = prices[id];
        require(data.price > 0, "TreasuryOracle: unknown feed");

        return StorkStructs.TemporalNumericValue({
            timestampNs: data.timestampNs,
            quantizedValue: data.price
        });
    }

    function getTemporalNumericValueUnsafeV1(bytes32 id)
        external
        view
        returns (StorkStructs.TemporalNumericValue memory)
    {
        PriceData storage data = prices[id];

        return StorkStructs.TemporalNumericValue({
            timestampNs: data.timestampNs,
            quantizedValue: data.price
        });
    }

    function getTemporalNumericValuesUnsafeV1(bytes32[] calldata ids)
        external
        view
        returns (StorkStructs.TemporalNumericValue[] memory)
    {
        StorkStructs.TemporalNumericValue[] memory values = new StorkStructs.TemporalNumericValue[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            PriceData storage data = prices[ids[i]];
            values[i] = StorkStructs.TemporalNumericValue({
                timestampNs: data.timestampNs,
                quantizedValue: data.price
            });
        }

        return values;
    }

    function updateTemporalNumericValuesV1(StorkStructs.TemporalNumericValueInput[] calldata)
        external
        payable
    {
        // Not implemented - use setPrice instead
        revert("TreasuryOracle: use setPrice");
    }

    function getUpdateFeeV1(StorkStructs.TemporalNumericValueInput[] calldata)
        external
        pure
        returns (uint)
    {
        return 0;
    }

    function verifyPublisherSignaturesV1(StorkStructs.PublisherSignature[] calldata, bytes32)
        external
        pure
        returns (bool)
    {
        return true;
    }

    function version() external pure returns (string memory) {
        return "TreasuryOracle-1.0.0";
    }

    // ============ Custom Oracle Functions ============

    /// @notice Set price for a single asset
    /// @param feedId The asset feed ID (use constants like USDC_FEED)
    /// @param price Price in USD with 18 decimals
    /// @param change24h 24h change in basis points (500 = 5%)
    function setPrice(bytes32 feedId, int192 price, int192 change24h) external onlyAuthorized {
        prices[feedId].price = price;
        prices[feedId].timestampNs = uint64(block.timestamp * 1e9);
        prices[feedId].change24h = change24h;

        emit PriceUpdated(feedId, price, prices[feedId].timestampNs);
    }

    /// @notice Set price with full data
    function setPriceData(
        bytes32 feedId,
        int192 price,
        int192 change24h,
        uint256 apy
    ) external onlyAuthorized {
        prices[feedId] = PriceData({
            price: price,
            timestampNs: uint64(block.timestamp * 1e9),
            change24h: change24h,
            apy: apy
        });

        emit PriceUpdated(feedId, price, prices[feedId].timestampNs);
    }

    /// @notice Batch update prices (for agent efficiency)
    function batchSetPrices(
        bytes32[] calldata feedIds,
        int192[] calldata newPrices,
        int192[] calldata changes24h
    ) external onlyAuthorized {
        require(feedIds.length == newPrices.length, "TreasuryOracle: length mismatch");
        require(feedIds.length == changes24h.length, "TreasuryOracle: length mismatch");

        uint64 ts = uint64(block.timestamp * 1e9);

        for (uint256 i = 0; i < feedIds.length; i++) {
            prices[feedIds[i]].price = newPrices[i];
            prices[feedIds[i]].timestampNs = ts;
            prices[feedIds[i]].change24h = changes24h[i];

            emit PriceUpdated(feedIds[i], newPrices[i], ts);
        }
    }

    /// @notice Get full price data for an asset
    function getPriceData(bytes32 feedId) external view returns (
        int192 price,
        uint64 timestampNs,
        int192 change24h,
        uint256 apy
    ) {
        PriceData storage data = prices[feedId];
        return (data.price, data.timestampNs, data.change24h, data.apy);
    }

    /// @notice Get all treasury asset prices at once
    function getTreasuryPrices() external view returns (
        int192 usdcPrice,
        int192 usycPrice,
        int192 wethPrice,
        int192 buidlPrice
    ) {
        return (
            prices[USDC_FEED].price,
            prices[USYC_FEED].price,
            prices[WETH_FEED].price,
            prices[BUIDL_FEED].price
        );
    }

    /// @notice Calculate USD value of a position
    function getUSDValue(bytes32 feedId, uint256 amount) external view returns (uint256) {
        int192 price = prices[feedId].price;
        require(price > 0, "TreasuryOracle: invalid price");

        return (amount * uint256(uint192(price))) / 1e18;
    }

    // ============ Admin Functions ============

    function setAgent(address _agent) external onlyOwner {
        emit AgentUpdated(agent, _agent);
        agent = _agent;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TreasuryOracle: zero address");
        owner = newOwner;
    }

    /// @notice Simulate USYC price increase from yield (for demo)
    function accrueUSYCYield(uint256 daysElapsed) external onlyAuthorized {
        PriceData storage usyc = prices[USYC_FEED];

        // Calculate yield: price * (APY * days / 365)
        uint256 yieldBps = (usyc.apy * daysElapsed) / 365;
        int192 priceIncrease = int192(int256((uint256(uint192(usyc.price)) * yieldBps) / 10000));

        usyc.price += priceIncrease;
        usyc.timestampNs = uint64(block.timestamp * 1e9);
        usyc.change24h = int192(int256(usyc.apy / 365)); // Daily change from yield

        emit PriceUpdated(USYC_FEED, usyc.price, usyc.timestampNs);
    }
}
