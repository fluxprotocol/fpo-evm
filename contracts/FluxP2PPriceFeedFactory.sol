// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IERC2362.sol";
import "./FluxPriceFeed.sol";
import { Verification } from "./Verification.sol";
import "hardhat/console.sol";

/**
 * @title Flux first-party price feed factory
 * @author fluxprotocol.org
 */
contract FluxP2PFactory is AccessControl, IERC2362 {
    // roles
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

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

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice internal function to create a new FluxPriceFeed
     * @dev only a validator should be able to call this function
     */

    function deployOracle(
        string calldata _pricePair,
        uint8 _decimals,
        address[] memory validators
    ) external {
        require(validators.length > 1, "Needs at least 2 validators");
        // Find the price pair id
        string memory str = string(abi.encodePacked("Price-", _pricePair, "-", Strings.toString(_decimals)));
        bytes32 _id = keccak256(bytes(str));
        require(address(fluxPriceFeeds[_id]) == address(0x0), "Oracle already deployed");
        // deploy the new contract and store it in the mapping
        FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals, _pricePair);
        fluxPriceFeeds[_id] = newPriceFeed;
        for (uint256 i = 0; i < validators.length; i++) {
            // grant the provider SIGNER_ROLE on the new FluxPriceFeed
            newPriceFeed.grantRole(SIGNER_ROLE, validators[i]);
        }

        emit FluxPriceFeedCreated(_id, address(newPriceFeed));
    }

    /// @notice leader submits an array of signatures and answers along with associated price pair and decimals
    function transmit(
        bytes[] calldata signatures,
        string calldata _pricePair,
        uint8 _decimals,
        int192[] calldata _answers
    ) external {
        require(signatures.length > 1, "Needs at least 2 signatures");
        require(signatures.length == _answers.length, "Number of answers must match signatures");
        address[] memory recoveredSigners = new address[](signatures.length);

        // Make sure transmitted answers are sorted ascendingly
        for (uint256 i = 0; i < _answers.length - 1; i++) {
            require(_answers[i] <= _answers[i + 1], "Transmitted answers are not sorted");
        }

        // recover signatures
        for (uint256 i = 0; i < signatures.length; i++) {
            address recoveredSigner = Verification._getSigner(_pricePair, _decimals, _answers[i], signatures[i]);
            recoveredSigners[i] = recoveredSigner;
        }

        // calculate median of _answers assuming they're already sorted
        int192 answer;
        if (_answers.length % 2 == 0) {
            answer = ((_answers[(_answers.length / 2) - 1] + _answers[_answers.length / 2]) / 2);
        } else {
            answer = _answers[_answers.length / 2];
        }

        // Find the price pair id
        string memory str = string(abi.encodePacked("Price-", _pricePair, "-", Strings.toString(_decimals)));
        bytes32 id = keccak256(bytes(str));

        // verify signatures
        for (uint256 i = 0; i < recoveredSigners.length; i++) {
            require(fluxPriceFeeds[id].hasRole(SIGNER_ROLE, recoveredSigners[i]), "Signer must be a validator");
        }

        // try transmitting values to the oracle
        /* solhint-disable-next-line no-empty-blocks */
        try fluxPriceFeeds[id].transmit(answer) {
            // transmission is successful, nothing to do
        } catch Error(string memory reason) {
            // catch failing revert() and require()
            emit Log(reason);
        }
    }

    /// @notice answer from the most recent report of a certain price pair from factory
    /// @param _id hash of the price pair string to query
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

    /// @notice returns address of a price feed id
    /// @param _id hash of the price pair string to query
    function addressOfPricePair(bytes32 _id) external view returns (address) {
        return address(fluxPriceFeeds[_id]);
    }

    /// @notice add signers to deployed pricefeed
    /// @param _id hash of the price pair string to add role to
    /// @param _signer address of the signer to be granted SIGNER_ROLE
    /// @dev only factory's deployer (DEFAULT_ADMIN_ROLE) should be able to call this function
    function addSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fluxPriceFeeds[_id].grantRole(SIGNER_ROLE, _signer);
    }

    /// @notice revoke signers from deployed pricefeed
    /// @param _id hash of the price pair string to revoke role from
    /// @param _signer address of the signer to be revoked SIGNER_ROLE
    /// @dev only factory's deployer (DEFAULT_ADMIN_ROLE) should be able to call this function
    function revokeSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fluxPriceFeeds[_id].revokeRole(SIGNER_ROLE, _signer);
    }

    /// @notice grants a new DEFAULT_ADMIN_ROLE to a given pricefeed
    /// @param _id hash of the pricepair string to grant role to
    /// @param newAdmin address of the pricefeed new admin
    /// @dev only factory's deployer (DEFAULT_ADMIN_ROLE) should be able to call this function
    function transferOwner(bytes32 _id, address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fluxPriceFeeds[_id].grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    /// @notice returns factory's type and version
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.0.0";
    }
}
