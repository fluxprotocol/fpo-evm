// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/IERC2362.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./FluxPriceFeed.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Flux first-party price feed factory
 * @author fluxprotocol.org
 */
contract FluxPriceFeedFactory is AccessControl, IERC2362 {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // mapping of id to FluxPriceFeed
    mapping(bytes32 => FluxPriceFeed) public fluxPriceFeeds;

    event FluxPriceFeedCreated(bytes32 indexed id, address indexed oracle);
    event Log(string message);

    constructor(address _validator) {
        _setupRole(VALIDATOR_ROLE, _validator);
    }

    /**
     * @notice transmit submits an answer to a price feed or creates a new one if it does not exist
     * @param _pricePairs array of price pairs strings (e.g. ETH/USD)
     * @param _decimals array of decimals for associated price pairs (e.g. 3)
     * @param _answers array of prices for associated price pairs
     */
    function transmit(
        string[] calldata _pricePairs,
        uint8[] calldata _decimals,
        int192[] calldata _answers
    ) external onlyRole(VALIDATOR_ROLE) {
        require((_pricePairs.length == _decimals.length) && (_pricePairs.length == _answers.length), "Transmitted arrays must be equal");
        // Iterate through each transmitted price pair
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            // Find the price pair id
            string memory str = string(abi.encodePacked("Price-", _pricePairs[i], "-", Strings.toString(_decimals[i])));
            console.log(str);
            bytes32 id = keccak256(bytes(str));
            
            // if oracle exists then transmit values
            if( address(fluxPriceFeeds[id]) != address(0x0) ){
                // try to transmit or create new price pair if it doesn't exist
                try fluxPriceFeeds[id].transmit(_answers[i]) {
                    // transmission is successful, nothing to do
                    console.log("Transmitted values");
                }catch Error(string memory reason) {
                    // catch failing revert() and require()
                    console.log(reason);
                }
            // else create an oracle then transmit values
            }else{

                // transmission failed, let's create a new price feed and try transmitting again
                // FluxPriceFeed newPriceFeed = new FluxPriceFeed(msg.sender, _decimals[i], _pricePairs[i]);

                // Should we let the factory be the validator or let the sender grantRole before calling transmit?
                FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals[i], _pricePairs[i]);
                fluxPriceFeeds[id] = newPriceFeed;
                console.log("++Created Oracle");
                console.logBytes32(id);
                emit FluxPriceFeedCreated(id, address(newPriceFeed));

                fluxPriceFeeds[id].transmit(_answers[i]);
                console.log("++Transmitted values");

            }

         
        }
    }

    /**
     * @notice answer from the most recent report of a certain price pair from factory
     * @param _id hash of the price pair string to query
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
        // if oracle exists then fetch values
        if( address(fluxPriceFeeds[_id]) != address(0x0) ){
            // fetch the price feed contract and read its latest answer and timestamp
            try fluxPriceFeeds[_id].latestTransmissionDetails() 
                returns (int192 _latestAnswer, uint64 _latestTimestamp) {

                return (_latestAnswer, _latestTimestamp, 200);

            }catch Error(string memory reason) {
                // catch failing revert() and require()
                console.log(reason);
            }
        // else return not found
        }else{
            console.log("No oracle was found");
            console.logBytes32(_id);
            return (0, 0, 404);
        }
    }

    /**
     * @notice returns address of a price feed id
     * @param _id hash of the price pair string to query
     */
    function addressOfPricePair(bytes32 _id) external view returns (address) {
        return address(fluxPriceFeeds[_id]);
    }
}
