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
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // mapping of id to FluxPriceFeed
    mapping(bytes32 => FluxPriceFeed) public fluxPriceFeeds;
    address public immutable PROVIDER;
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

    constructor(address _provider) {
        // _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // _setupRole(VALIDATOR_ROLE, _validator);
        PROVIDER = _provider;
        console.log("PROVIDER = ", PROVIDER);
    }

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

        // also grant this contract's admin VALIDATOR_ROLE on the new FluxPriceFeed
        newPriceFeed.grantRole(VALIDATOR_ROLE, msg.sender);
        emit FluxPriceFeedCreated(_id, address(newPriceFeed));
    }

    /**
     * @notice transmit submits an answer to a price feed or creates a new one if it does not exist
     * @param _pricePairs array of price pairs strings (e.g. ETH/USD)
     * @param _decimals array of decimals for associated price pairs (e.g. 3)
     * @param _answers array of prices for associated price pairs
     */
    function transmit(
        bytes[] calldata signatures,
        string[] calldata _pricePairs,
        uint8[] calldata _decimals,
        int192[] calldata _answers
    ) external {
        require(
            (_pricePairs.length == _decimals.length) &&
                (_pricePairs.length == _answers.length) &&
                (_pricePairs.length == signatures.length),
            "Transmitted arrays must be equal"
        );
        for (uint256 i = 0; i < signatures.length; i++) {
            require(
                verify(PROVIDER, _pricePairs[i], _decimals[i], _answers[i], signatures[i]) == true,
                "SIGNATURE FAILED"
            );

            // Find the price pair id
            string memory str = string(abi.encodePacked("Price-", _pricePairs[i], "-", Strings.toString(_decimals[i])));
            bytes32 id = keccak256(bytes(str));

            // deploy a new oracle if there's none previously deployed
            if (address(fluxPriceFeeds[id]) == address(0x0)) {
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
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.0.0";
    }

    function getMessageHash(
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(_pricePair, _decimal, _answer));
    }

    function getEthSignedMessageHash(bytes32 _messageHash) public view returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function verify(
        address _signer,
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer,
        bytes memory signature
    ) public view returns (bool) {
        console.log("Hello from verify fn");
        bytes32 messageHash = getMessageHash(_pricePair, _decimal, _answer);
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        console.log("----messageHash");
        console.logBytes32(messageHash);
        console.log("----ethSignedMessageHash");

        console.logBytes32(ethSignedMessageHash);
        address recoverdSigner = recoverSigner(ethSignedMessageHash, signature);
        console.log("recoverdSigner", recoverdSigner);
        return recoverSigner(ethSignedMessageHash, signature) == _signer;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public view returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        view
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
