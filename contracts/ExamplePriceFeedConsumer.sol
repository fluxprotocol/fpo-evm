// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/CLV2V3Interface.sol";

contract ExamplePriceFeedConsumer is Ownable {
    CLV2V3Interface public priceFeed;
    int256 public cachedLatestPrice;

    constructor(address _priceFeed) {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Fetches the latest price and stores it as `cachedLatestPrice`
    function fetchLatestPrice() public onlyOwner returns (int256) {
        cachedLatestPrice = priceFeed.latestAnswer();
        return cachedLatestPrice;
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) public onlyOwner {
        priceFeed = CLV2V3Interface(_priceFeed);
    }
}
