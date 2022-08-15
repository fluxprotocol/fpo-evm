// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/CLV2V3Interface.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RelayerConsumer is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    CLV2V3Interface public priceFeed;
    CLV2V3Interface public relayer;

    uint256 public deviationPercent = 2;
    bool public paused;

    constructor(address _priceFeed, address _relayer) {
        _setupRole(OWNER_ROLE, msg.sender);
        priceFeed = CLV2V3Interface(_priceFeed);
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Fetches the latest price from the price feed after checking for deviation
    function getLatestPrice() public returns (int256) {
        if (answersDeviated()) {
            paused = true;
        }
        require(paused == false, "function paused");
        return priceFeed.latestAnswer();
    }

    /// @notice Checks if the oracle answers deviated comparing it to the relayer feed answers
    function answersDeviated() public view returns (bool) {
        int256 anchorPrice = relayer.latestAnswer();
        require(anchorPrice > 0, "Anchor price = 0");
        uint256 calculatedDeviation = uint256((abs(anchorPrice - priceFeed.latestAnswer()) * 100) / anchorPrice);
        return (calculatedDeviation >= deviationPercent ? true : false);
    }

    /// @notice Changes price feed contract address
    /// @dev Only callable by the owner
    function setPriceFeed(address _priceFeed) public onlyRole(OWNER_ROLE) {
        priceFeed = CLV2V3Interface(_priceFeed);
    }

    /// @notice Changes relayer feed contract address
    /// @dev Only callable by the owner
    function setRelayerFeed(address _relayer) public onlyRole(OWNER_ROLE) {
        relayer = CLV2V3Interface(_relayer);
    }

    /// @notice Sets consumer contract paused variable
    /// @dev Only callable by the owner
    function setPaused(bool _paused) public onlyRole(OWNER_ROLE) {
        paused = _paused;
    }

    /// @notice Sets consumer contract deviationPercent variable
    /// @dev Only callable by the owner
    /// @param _deviation deviation percentage based on which the contract is paused
    function setDeviation(uint8 _deviation) public onlyRole(OWNER_ROLE) {
        deviationPercent = _deviation;
    }

    /// @notice Returns absolute value
    /// @param val signed value that we wanna calculate its absolute
    function abs(int256 val) internal pure returns (int256 result) {
        return (val < 0 ? -val : val);
    }
}
