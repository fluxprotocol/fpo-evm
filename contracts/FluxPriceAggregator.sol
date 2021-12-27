// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/CLV2V3Interface.sol";

contract FluxPriceAggregator is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public lastUpdate;
    uint256 public lastAnswer;
    uint256 public minDelay = 1 minutes;
    address[] public oracles;

    /// @dev Initialize oracles and fetch initial prices
    constructor(address _admin, address[] memory _oracles) {
        _setupRole(ADMIN_ROLE, _admin);
        oracles = _oracles;
    }

    /// @notice Update prices, callable by anyone
    function updatePrices() public {
        // require min delay since lastUpdate
        require(block.timestamp > lastUpdate + minDelay);

        // fetch sum of latestAnswer from oracles
        int256 sum = 0;
        for (uint256 i = 0; i < oracles.length; i++) {
            sum += CLV2V3Interface(oracles[i]).latestAnswer();
        }

        // calculate average of sum (assumes unsigned)
        lastAnswer = uint256(sum) / oracles.length;
        lastUpdate = block.timestamp;
    }

    /// @notice Changes min delay, only callable by admin
    function setDelay(uint256 _minDelay) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        minDelay = _minDelay;
    }

    /// @notice Changes oracles, only callable by admin
    function setOracles(address[] memory _oracles) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not a admin");
        oracles = _oracles;
    }
}
