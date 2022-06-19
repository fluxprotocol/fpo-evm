// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IERC2362.sol";
import "./FluxPriceFeed.sol";

/// @title Flux first-party price feed factory and p2p controller
/// @author fluxprotocol.org
contract FluxP2PFactory is IERC2362 {
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @dev struct containing FluxPriceFeed with associated signers
    struct FluxPriceFeedData {
        address priceFeed;
        uint256 minSigners;
        EnumerableSet.AddressSet signers;
        mapping(address => uint256) lastRoundTransmit; // helps check for duplicate signers in `transmit()`
        mapping(address => uint256) lastRoundModifySigners; // helps check for duplicate signers in `modifySigners()`
    }

    /// @dev mapping of id (e.g. `Price-ETH/USD-8-creator`) to FluxPriceFeedData
    mapping(bytes32 => FluxPriceFeedData) private fluxPriceFeeds;

    /// @notice indicates that a new oracle was created
    /// @param id hash of the price pair string
    /// @param oracle address of the deployed oracle
    /// @param signers addresses of the initial signers
    event PriceFeedCreated(bytes32 indexed id, address indexed oracle, address[] signers);

    /// @notice indicates that a signer was added or removed from a FluxPriceFeed
    /// @param id hash of the price pair string
    /// @param signer address of the signer
    /// @param isAdded true if the signer was added, false if removed
    event PriceFeedSignersModified(bytes32 indexed id, address signer, bool isAdded);

    /// @notice logs error messages
    /// @param message the error message
    event Log(string message);

    /// @notice formats a hash of a price pair string
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _creator msg.sender of `deployOracle()`
    /// @return hash of the price pair string
    function hashFeedId(
        string calldata _pricePair,
        uint8 _decimals,
        address _creator
    ) public pure returns (bytes32) {
        string memory str = string(
            abi.encodePacked("Price-", _pricePair, "-", Strings.toString(_decimals), "-", abi.encodePacked(_creator))
        );
        return keccak256(bytes(str));
    }

    /// @notice calculates the minimum number of signers required to update a FluxPriceFeed or modify signers
    /// @param _length number of signers
    /// @return minimum required number of signers
    function _getMinSigners(uint256 _length) internal pure returns (uint256 minimum) {
        return (_length / 2) + 1;
    }

    /// @notice verifies that a signer has permission to sign a given message
    /// @param _hashedMsg the hashed message to verify against
    /// @param _signature the signed message from the signer
    /// @param _id hash of the price pair string of the FluxPriceFeed for checking permissions
    /// @return signer address of the recovered signer
    function _verifySignature(
        bytes32 _hashedMsg,
        bytes calldata _signature,
        bytes32 _id
    ) internal view returns (address signer) {
        (address recoveredSigner, ECDSA.RecoverError error) = ECDSA.tryRecover(_hashedMsg, _signature);
        if (error == ECDSA.RecoverError.NoError) {
            require(fluxPriceFeeds[_id].signers.contains(recoveredSigner), "Invalid signature");
            return recoveredSigner;
        } else {
            revert("Invalid signature");
        }
    }

    /// @notice creates a new FluxPriceFeed
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _signers array of addresses allowed to sign messages for this feed in `transmit()`
    function deployOracle(
        string calldata _pricePair,
        uint8 _decimals,
        address[] memory _signers
    ) external {
        require(_signers.length > 1, "Must >1 signers");

        // format the price pair id and require it to be unique
        bytes32 id = hashFeedId(_pricePair, _decimals, msg.sender);

        require(fluxPriceFeeds[id].priceFeed == address(0x0), "Already deployed");

        // deploy the new contract and store it in the mapping
        FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals, _pricePair);
        fluxPriceFeeds[id].priceFeed = address(newPriceFeed);
        fluxPriceFeeds[id].minSigners = _getMinSigners(_signers.length);

        // set the signers
        for (uint256 i = 0; i < _signers.length; ++i) {
            require(fluxPriceFeeds[id].signers.add(_signers[i]) == true, "Duplicate signer");
        }

        emit PriceFeedCreated(id, address(newPriceFeed), _signers);
    }

    /// @notice leader submits signed messages to update a FluxPriceFeed
    /// @param _signatures array of signed messages from allowed signers
    /// @param _id hash calculated using `hashFeedId()`
    /// @param _answers array of answers from associated signers
    /// @param _timestamps array of timestamps from associated signers
    /// @dev only available to a majority of a feed's current signers
    function transmit(
        bytes[] calldata _signatures,
        bytes32 _id,
        int192[] calldata _answers,
        uint64[] calldata _timestamps
    ) external {
        // require the caller to be a signer
        require(fluxPriceFeeds[_id].signers.contains(msg.sender), "Invalid caller");

        // validate array lengths
        uint256 len = _signatures.length;
        require(_answers.length == len && _timestamps.length == len, "Lengths mismatch");

        // require the minumum number of signers
        require(len >= fluxPriceFeeds[_id].minSigners, "Too few signers");

        // fetch the round and last timestamp
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        uint256 round = priceFeed.latestRound() + 1;
        uint256 lastRoundTimestamp = priceFeed.latestTimestamp();

        // validate each signature
        for (uint256 i = 0; i < len; ++i) {
            // recover the message
            bytes32 hashedMsg = ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(_id, round, _answers[i], _timestamps[i]))
            );

            // recover and verify the signer
            address recoveredSigner = _verifySignature(hashedMsg, _signatures[i], _id);

            // require the timestamp to be greater than the last timestamp
            require(_timestamps[i] > lastRoundTimestamp, "Stale timestamp");
            require(_timestamps[i] < block.timestamp + 5, "Future timestamp");

            // require transmitted answers to be sorted in ascending order
            if (i < len - 1) {
                require(_answers[i] <= _answers[i + 1], "Not sorted");
            }

            // require each signer only submits an answer once
            require(fluxPriceFeeds[_id].lastRoundTransmit[recoveredSigner] < round, "Duplicate signer");
            fluxPriceFeeds[_id].lastRoundTransmit[recoveredSigner] = round;
        }

        // calculate median of _answers and associated timestamp
        uint256 medianIndex = len >> 1;
        int192 answer;
        uint64 timestamp;
        if (len % 2 == 0) {
            answer = ((_answers[medianIndex - 1] + _answers[medianIndex]) / 2);
            timestamp = ((_timestamps[medianIndex - 1] + _timestamps[medianIndex]) / 2);
        } else {
            answer = _answers[medianIndex];
            timestamp = _timestamps[medianIndex];
        }

        // try transmitting values to the oracle
        /* solhint-disable-next-line no-empty-blocks */
        try priceFeed.transmit(answer, timestamp) {
            // transmission is successful, nothing to do
        } catch Error(string memory reason) {
            // catch failing revert() and require()
            emit Log(reason);
            revert("Transmit failed");
        }
    }

    /// @notice leader submits signed messages to modify the signers of a FluxPriceFeed
    /// @param _signatures array of signed messages from allowed signers
    /// @param _id hash calculated using `hashFeedId()`
    /// @param _signer signer to add or remove from the FluxPriceFeed
    /// @param _add true to add, false to remove
    /// @dev only available to a majority of a feed's current signers
    function modifySigners(
        bytes[] calldata _signatures,
        bytes32 _id,
        address _signer,
        bool _add
    ) external {
        // require the caller to be a signer
        require(fluxPriceFeeds[_id].signers.contains(msg.sender), "Invalid caller");

        // verify the minimum required signatures
        require(_signatures.length >= fluxPriceFeeds[_id].minSigners, "Too few signers");

        // parse the signed message
        uint256 round = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed).latestRound() + 1;
        bytes32 hashedMsg = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(_id, round, _signer, _add)));

        // recover signatures and verify them
        for (uint256 i = 0; i < _signatures.length; ++i) {
            address recoveredSigner = _verifySignature(hashedMsg, _signatures[i], _id);

            // require each signer only submits an answer once
            require(fluxPriceFeeds[_id].lastRoundModifySigners[recoveredSigner] < round, "Duplicate signer");
            fluxPriceFeeds[_id].lastRoundModifySigners[recoveredSigner] = round;
        }

        // add or remove signer to the FluxPriceFeed
        if (_add) {
            fluxPriceFeeds[_id].signers.add(_signer);
        } else {
            require(fluxPriceFeeds[_id].signers.length() > 2, "Need >1 signers");
            fluxPriceFeeds[_id].signers.remove(_signer);
        }

        // update the minimum required signers
        fluxPriceFeeds[_id].minSigners = _getMinSigners(fluxPriceFeeds[_id].signers.length());

        emit PriceFeedSignersModified(_id, _signer, _add);
    }

    /// @notice returns the latest report for a FluxPriceFeed
    /// @param _id hash of the price pair string to query
    /// @return tuple containing answer, updatedAt, and status message (200 for success; 404 for not found)
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
        if (fluxPriceFeeds[_id].priceFeed != address(0x0)) {
            try FluxPriceFeed(fluxPriceFeeds[_id].priceFeed).latestRoundData() returns (
                uint80 roundId,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                if (roundId > 0) {
                    return (answer, updatedAt, 200);
                }
                /* solhint-disable-next-line no-empty-blocks */
            } catch {}
            return (0, 0, 404);

            // else return not found
        } else {
            return (0, 0, 404);
        }
    }

    /// @notice returns address of a price feed id
    /// @param _id hash of the price pair string to query
    /// @return address of the FluxPriceFeed
    function addressOfPricePair(bytes32 _id) external view returns (address) {
        return fluxPriceFeeds[_id].priceFeed;
    }

    /// @notice returns the latest round of a price pair
    /// @param _id hash of the price pair string to query
    /// @return latestRound of the FluxPriceFeed
    function latestRoundOfPricePair(bytes32 _id) external view returns (uint256) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        return priceFeed.latestRound();
    }

    /// @notice returns factory's type and version
    /// @return string containing factory's type and version
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.1.0";
    }
}
