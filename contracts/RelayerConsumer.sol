// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RelayerConsumer is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    CLV2V3Interface public priceFeed;
    CLV2V3Interface public relayer;
    uint256 public deviationPercent = 2;

    constructor(address _priceFeed, address _relayer) {
        _setupRole(OWNER_ROLE, msg.sender);
        priceFeed = CLV2V3Interface(_priceFeed);
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Fetches the latest price from the price feed after checking for deviation
    /// @dev Reverts if the relayer price is not within the deviation range of the price feed price
    function getLatestPrice() public view returns (int256) {
        int256 price = priceFeed.latestAnswer();
        int256 relayerPrice = relayer.latestAnswer();
        uint256 calculatedDeviation = uint256((abs(relayerPrice - price) * 100) / relayerPrice);
        require(calculatedDeviation >= deviationPercent, "Relayer/price feed deviation too large");
        return priceFeed.latestAnswer();
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) external onlyRole(OWNER_ROLE) {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Changes relayer feed contract address
    /// @dev Only callable by the owner
    function setRelayerFeed(address _relayer) external onlyRole(OWNER_ROLE) {
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Sets consumer contract deviationPercent variable
    /// @dev Only callable by the owner
    /// @param _deviation deviation percentage based on which the contract is paused
    function setDeviation(uint8 _deviation) external onlyRole(OWNER_ROLE) {
        deviationPercent = _deviation;
    }

    /// @notice Returns absolute value
    /// @param val signed value that we wanna calculate its absolute
    function abs(int256 val) internal pure returns (int256 result) {
        return (val < 0 ? -val : val);
    }
}
