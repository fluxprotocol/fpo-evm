// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Flux example FluxPriceFeed consumer
/// @author fluxprotocol.org
contract ExamplePriceFeedConsumer is Ownable {
    CLV2V3Interface public priceFeed;

    /// @notice creates the contract and initializes priceFeed
    /// @param _priceFeed address of a deployed FluxPriceFeed
    constructor(address _priceFeed) {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Fetches the latest price from the price feed
    function getLatestPrice() public view returns (int256) {
        (uint80 roundID, int256 feedPrice, , uint256 timestamp, uint80 answeredInRound) = priceFeed.latestRoundData();
        require(feedPrice > 0, "price <= 0");
        require(answeredInRound >= roundID, "stale price");
        require(timestamp != 0, "round not complete");
        return feedPrice;
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) public onlyOwner {
        priceFeed = CLV2V3Interface(_priceFeed);
    }
}
