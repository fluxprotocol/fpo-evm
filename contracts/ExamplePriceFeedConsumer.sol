// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ExamplePriceFeedConsumer is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    CLV2V3Interface public priceFeed;

    constructor(address _priceFeed) {
        _setupRole(OWNER_ROLE, msg.sender);
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Fetches the latest price from the price feed
    function getLatestPrice() public view returns (int256) {
        return priceFeed.latestAnswer();
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) public onlyRole(OWNER_ROLE) {
        priceFeed = CLV2V3Interface(_priceFeed);
    }
}
