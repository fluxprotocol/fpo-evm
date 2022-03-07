// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./interface/IERC2362.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Flux first-party multi price feed oracle
 * @author fluxprotocol.org
 * @notice Simple posting of multiple scalars, compatible with ERC 2362
 */
contract FluxMultiPriceFeed is AccessControl, IERC2362 {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    struct PricePair {
        int256 price;
        uint256 timestamp;
    }

    /* solhint-disable max-line-length */
    // mapping of id to price pair. example:
    // Description   ValuePair   DecimalPlaces   String            Keccak256
    // Price         ETH/USD     3               Price-ETH/USD-3   0xdfaa6f747f0f012e8f2069d6ecacff25f5cdf0258702051747439949737fc0b5
    // Price         BTC/USD     3               Price-BTC/USD-3   0x637b7efb6b620736c247aaa282f3898914c0bef6c12faff0d3fe9d4bea783020
    /* solhint-enable max-line-length */
    mapping(bytes32 => PricePair) public feeds;

    constructor(address _validator) {
        _setupRole(VALIDATOR_ROLE, _validator);
    }

    /**
     * @notice answer from the most recent report of a certain price pair
     * @param _id Keccak256 hash of the price pair string we wanna query
     * @return ( price, timestamp, status : 200/404 )
     */
    function valueFor(bytes32 _id)
        external
        view
        override
        returns (
            int256,
            uint256,
            uint256
        )
    {
        // if not found, return 404
        if (feeds[_id].timestamp <= 0) return (0, 0, 404);

        return (feeds[_id].price, feeds[_id].timestamp, 200);
    }

    /**
     * @notice transmit is called to post a new value to the contract price pairs
     * @param _pricePairs array of price pairs ids we wanna post values for
     * @param _answers array of prices we wanna post
     */
    function transmit(bytes32[] calldata _pricePairs, int256[] calldata _answers) external onlyRole(VALIDATOR_ROLE) {
        require(_answers.length == _pricePairs.length, "The transmitted arrays must be equal");
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            feeds[_pricePairs[i]].price = _answers[i];
            feeds[_pricePairs[i]].timestamp = block.timestamp;
        }
    }
}
