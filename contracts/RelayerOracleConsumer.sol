// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RelayerOracleConsumer
/// @notice an example contract using a price feed with a relayer feed
contract RelayerOracleConsumer is Ownable {
    CLV2V3Interface public priceFeed;
    CLV2V3Interface public relayerFeed;
    uint256 public deviationPercent; // 100 = 1%
    uint256 public maxDelay;

    constructor(
        address _priceFeed,
        address _relayer,
        uint256 _deviationPercent,
        uint256 _maxDelay
    ) {
        priceFeed = CLV2V3Interface(_priceFeed);
        relayerFeed = CLV2V3Interface(_relayer);
        deviationPercent = _deviationPercent;
        maxDelay = _maxDelay;
    }

    /// @notice Fetches the latest price from the price feed after checking for deviation
    /// @dev Reverts if prices deviated or are outdated
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , uint256 timestamp, ) = priceFeed.latestRoundData();
        (, int256 relayerPrice, , uint256 relayerTimestamp, ) = relayerFeed.latestRoundData();

        require((timestamp != 0) && (block.timestamp - timestamp < maxDelay), "No/old data from price feed");
        require(
            (relayerTimestamp != 0) && (block.timestamp - relayerTimestamp < maxDelay),
            "No/old data from relayer feed"
        );

        uint256 calculatedDeviation = uint256((abs(relayerPrice - price) * 10000) / relayerPrice);
        require(calculatedDeviation < deviationPercent, "Relayer/price feed deviation too large");
        return price;
    }

    /// @notice Changes priceFeed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Changes relayerFeed contract address
    /// @dev Only callable by the owner
    function setRelayerFeed(address _relayerFeed) external onlyOwner {
        relayerFeed = CLV2V3Interface(_relayerFeed);
    }

    /// @notice Sets consumer contract deviationPercent variable (50 => 0.5%)
    /// @dev Only callable by the owner
    /// @param _deviation maximum allowed price deviation
    function setDeviation(uint256 _deviation) external onlyOwner {
        deviationPercent = _deviation;
    }

    /// @notice Sets consumer contract maxDelay variable in seconds
    /// @dev Only callable by the owner
    /// @param _delay maximum allowed delay after which prices are considered outdated
    function setMaxDelay(uint256 _delay) external onlyOwner {
        maxDelay = _delay;
    }

    /// @notice Returns absolute value
    /// @param val signed value
    function abs(int256 val) internal pure returns (int256 result) {
        return (val < 0 ? -val : val);
    }
}
