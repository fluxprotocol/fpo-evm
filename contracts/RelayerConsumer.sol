// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RelayerConsumer is Ownable {
    CLV2V3Interface public priceFeed;
    CLV2V3Interface public relayer;
    uint256 public deviationPercent = 50; // 0.5%

    constructor(address _priceFeed, address _relayer) {
        priceFeed = CLV2V3Interface(_priceFeed);
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Fetches the latest price from the price feed after checking for deviation
    /// @dev Reverts if the relayer price is not within the deviation range of the price feed price
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , uint256 timestamp, ) = priceFeed.latestRoundData();
        (, int256 relayerPrice, , uint256 relayerTimestamp, ) = relayer.latestRoundData();
        require(timestamp != 0, "No data from price feed");
        require(relayerTimestamp != 0, "No data from relayer");

        uint256 calculatedDeviation = uint256((abs(relayerPrice - price) * 10000) / relayerPrice);
        require(calculatedDeviation < deviationPercent, "Relayer/price feed deviation too large");
        return price;
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Changes relayer feed contract address
    /// @dev Only callable by the owner
    function setRelayerFeed(address _relayer) external onlyOwner {
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Sets consumer contract deviationPercent variable
    /// @dev Only callable by the owner
    /// @param _deviation deviation percentage based on which the contract is paused
    function setDeviation(uint8 _deviation) external onlyOwner {
        deviationPercent = _deviation;
    }

    /// @notice Returns absolute value
    /// @param val signed value that we wanna calculate its absolute
    function abs(int256 val) internal pure returns (int256 result) {
        return (val < 0 ? -val : val);
    }
}
