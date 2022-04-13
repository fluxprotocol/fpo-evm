// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IERC2362.sol";
import "./FluxPriceFeed.sol";

/**
 * @title Flux first-party price feed factory
 * @author fluxprotocol.org
 */
contract FluxPriceFeedFactory is IERC2362 {
    // roles
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    // mapping of id to FluxPriceFeed
    mapping(bytes32 => FluxPriceFeed) public fluxPriceFeeds;

    /**
     * @notice indicates that a new oracle was created
     * @param id hash of the price pair of the deployed oracle
     * @param oracle address of the deployed oracle
     */
    event FluxPriceFeedCreated(bytes32 indexed id, address indexed oracle);

    /**
     * @notice to log error messages
     * @param message the logged message
     */
    event Log(string message);

    /**
     * @notice internal function to create a new FluxPriceFeed
     * @dev only a validator should be able to call this function
     */
    function _deployOracle(
        bytes32 _id,
        string calldata _pricePair,
        uint8 _decimals
    ) internal {
        // deploy the new contract and store it in the mapping
        FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals, _pricePair);
        fluxPriceFeeds[_id] = newPriceFeed;

        // grant the provider DEFAULT_ADMIN_ROLE and VALIDATOR_ROLE on the new FluxPriceFeed
        newPriceFeed.grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        newPriceFeed.grantRole(VALIDATOR_ROLE, msg.sender);

        emit FluxPriceFeedCreated(_id, address(newPriceFeed));
    }

    /**
     * @notice transmit submits an answer to a price feed or creates a new one if it does not exist
     * @param _pricePairs array of price pairs strings (e.g. ETH/USD)
     * @param _decimals array of decimals for associated price pairs (e.g. 3)
     * @param _answers array of prices for associated price pairs
     * @param _provider optional address of the provider, if different from msg.sender
     */
    function transmit(
        string[] calldata _pricePairs,
        uint8[] calldata _decimals,
        int192[] calldata _answers,
        address _provider
    ) external {
        require(
            (_pricePairs.length == _decimals.length) && (_pricePairs.length == _answers.length),
            "Transmitted arrays must be equal"
        );

        // if no provider is provided, use the msg.sender
        address provider = (_provider == address(0)) ? msg.sender : _provider;

        // Iterate through each transmitted price pair
        for (uint256 i = 0; i < _pricePairs.length; i++) {
            // Find the price pair id
            string memory str = string(
                abi.encodePacked("Price-", _pricePairs[i], "-", Strings.toString(_decimals[i]), "-", provider)
            );
            bytes32 id = keccak256(bytes(str));

            // deploy a new oracle if there's none previously deployed and this is the original provider
            if (address(fluxPriceFeeds[id]) == address(0x0) && msg.sender == provider) {
                _deployOracle(id, _pricePairs[i], _decimals[i]);
            }
            // try transmitting values to the oracle
            /* solhint-disable-next-line no-empty-blocks */
            try fluxPriceFeeds[id].transmit(_answers[i]) {
                // transmission is successful, nothing to do
            } catch Error(string memory reason) {
                // catch failing revert() and require()
                emit Log(reason);
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
        if (address(fluxPriceFeeds[_id]) != address(0x0)) {
            // fetch the price feed contract and read its latest answer and timestamp
            try fluxPriceFeeds[_id].latestRoundData() returns (
                uint80,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                return (answer, updatedAt, 200);
            } catch {
                // catch failing revert() and require()
                return (0, 0, 404);
            }

            // else return not found
        } else {
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

    /**
     * @notice returns factory's type and version
     */
    function typeAndVersion() external pure virtual returns (string memory) {
        return "FluxFPO 1.0.0";
    }
}
