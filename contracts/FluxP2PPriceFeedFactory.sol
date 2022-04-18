// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IERC2362.sol";
import "./FluxPriceFeed.sol";
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
    function _deployOracle(
        bytes32 _id,
        string calldata _pricePair,
        uint8 _decimals,
        address[] memory validators
    ) internal {
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
        require(signatures.length == _answers.length, "Number of answers must match signatures");
        address[] memory recoveredSigners = new address[](signatures.length);
        // recover signatures
        for (uint256 i = 0; i < signatures.length; i++) {
            address recoveredSigner = _getSigner(_pricePair, _decimals, _answers[i], signatures[i]);
            console.log("recoveredSigner", recoveredSigner);
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

        // deploy a new oracle if there's none previously deployed
        if (address(fluxPriceFeeds[id]) == address(0x0)) {
            _deployOracle(id, _pricePair, _decimals, recoveredSigners);
        }

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

    function addSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        return fluxPriceFeeds[_id].grantRole(SIGNER_ROLE, _signer);
    }

    function revokeSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        return fluxPriceFeeds[_id].revokeRole(SIGNER_ROLE, _signer);
    }

    /// @notice returns factory's type and version
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.0.0";
    }

    function _getSigner(
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 messageHash = _getMessageHash(_pricePair, _decimal, _answer);
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(messageHash);

        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);

        return recoveredSigner;
    }

    function _verify(
        address _signer,
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer,
        bytes memory signature
    ) internal pure returns (bool) {
        return _getSigner(_pricePair, _decimal, _answer, signature) == _signer;
    }

    function _getMessageHash(
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_pricePair, _decimal, _answer));
    }

    function _getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function _recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function _splitSignature(bytes memory sig)
        internal
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }
}
