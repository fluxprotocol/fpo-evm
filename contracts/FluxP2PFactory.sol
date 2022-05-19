// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interface/IERC2362.sol";
import "./FluxPriceFeed.sol";

/// @title Flux first-party price feed factory and p2p controller
/// @author fluxprotocol.org
contract FluxP2PFactory is AccessControl, IERC2362, Initializable {
    /// @dev used to determine if signature is valid; roles are stored on FluxPriceFeed contract
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    /// @dev struct containing FluxPriceFeed along with minimum signers required to update the feed
    struct FluxPriceFeedData {
        address priceFeed;
        uint256 minSigners;
        mapping(address => uint256) lastSignedRound; // required to check for duplicate signatures
    }

    /// @dev mapping of id (e.g. `Price-ETH/USD-8`) to FluxPriceFeedData
    mapping(bytes32 => FluxPriceFeedData) public fluxPriceFeeds;

    /// @notice indicates that a new oracle was created
    /// @param id hash of the price pair of the deployed oracle
    /// @param oracle address of the deployed oracle
    /// @param signers addresses of the intitial signers
    event FluxPriceFeedCreated(bytes32 indexed id, address indexed oracle, address[] signers);

    /// @notice logs error messages
    /// @param message the error message
    event Log(string message);

    /// @notice indicates that the minimum signers for a FluxPriceFeed has been updated
    /// @param id hash of the price pair of the deployed oracle
    /// @param minSigners new minimum signers
    event MinSignersSet(bytes32 indexed id, uint256 minSigners);

    /// @notice initializes this contract (in replacement of constructor for OZ Initializable)
    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice returns a hash of the price pair string
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @return hash of the price pair string
    function hashFeedId(string calldata _pricePair, uint8 _decimals) public pure returns (bytes32) {
        string memory str = string(abi.encodePacked("Price-", _pricePair, "-", Strings.toString(_decimals)));
        return keccak256(bytes(str));
    }

    /// @notice creates a new FluxPriceFeed
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _signers array of initial allowed signatures for `transmit()`
    /// @dev only admin (DEFAULT_ADMIN_ROLE) should be able to call this function
    function deployOracle(
        string calldata _pricePair,
        uint8 _decimals,
        address[] memory _signers
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_signers.length > 1, "Need more signers");

        // format the price pair id and require it to be unique
        bytes32 id = hashFeedId(_pricePair, _decimals);
        require(address(fluxPriceFeeds[id].priceFeed) == address(0x0), "Already deployed");

        // deploy the new contract and store it in the mapping
        FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals, _pricePair);
        fluxPriceFeeds[id].priceFeed = address(newPriceFeed);
        fluxPriceFeeds[id].minSigners = 2;

        // set the signers
        for (uint256 i = 0; i < _signers.length; i++) {
            // grant the provider SIGNER_ROLE on the new FluxPriceFeed
            newPriceFeed.grantRole(SIGNER_ROLE, _signers[i]);
        }

        emit FluxPriceFeedCreated(id, address(newPriceFeed), _signers);
    }

    /// @notice leader submits signed messages of answers for associated price pair and round
    /// @param _signatures array of signed messages of the four following arguments
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _roundId latest round of the FluxPriceFeed
    /// @param _answers array of answers from associated signers
    function transmit(
        bytes[] calldata _signatures,
        string calldata _pricePair,
        uint8 _decimals,
        uint32 _roundId,
        int192[] calldata _answers
    ) external {
        require(_signatures.length == _answers.length, "Lengths mismatch");

        // format the price pair id
        bytes32 id = hashFeedId(_pricePair, _decimals);

        require(_signatures.length >= fluxPriceFeeds[id].minSigners, "Too few signatures");

        // verify the roundId
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[id].priceFeed);
        require(priceFeed.latestRound() == _roundId, "Wrong roundId");

        // recover signatures and verify them
        for (uint256 i = 0; i < _signatures.length; i++) {
            bytes32 hashedMsg = ECDSA.toEthSignedMessageHash(
                keccak256(abi.encodePacked(_pricePair, _decimals, _roundId, _answers[i]))
            );
            (address recoveredSigner, ECDSA.RecoverError error) = ECDSA.tryRecover(hashedMsg, _signatures[i]);
            if (error == ECDSA.RecoverError.NoError) {
                require(priceFeed.hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signature");
            } else {
                revert();
            }

            // require transmitted answers to be sorted in ascending order
            if (i < _signatures.length - 1) {
                require(_answers[i] <= _answers[i + 1], "Not sorted");
            }

            // require the signer only submits an answer once for this round
            if (_roundId > 0) {
                require(fluxPriceFeeds[id].lastSignedRound[recoveredSigner] < _roundId, "Duplicate signature");
            }
            fluxPriceFeeds[id].lastSignedRound[recoveredSigner] = _roundId;
        }

        // calculate median of _answers
        int192 answer;
        if (_answers.length % 2 == 0) {
            answer = ((_answers[(_answers.length / 2) - 1] + _answers[_answers.length / 2]) / 2);
        } else {
            answer = _answers[_answers.length / 2];
        }

        // try transmitting values to the oracle
        /* solhint-disable-next-line no-empty-blocks */
        try priceFeed.transmit(answer) {
            // transmission is successful, nothing to do
        } catch Error(string memory reason) {
            // catch failing revert() and require()
            emit Log(reason);
        }
    }

    /// @notice answer from the most recent report of a certain price pair from factory
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
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        if (address(priceFeed) != address(0x0)) {
            // fetch the price feed contract and read its latest answer and timestamp
            try priceFeed.latestRoundData() returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80) {
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
    /// @return address of the FluxPriceFeed
    function addressOfPricePair(bytes32 _id) external view returns (address) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        return address(priceFeed);
    }

    /// @notice returns the latest round of a price pair
    /// @param _id hash of the price pair string to query
    /// @return latestRound of the FluxPriceFeed
    function latestRoundOfPricePair(bytes32 _id) external view returns (uint256) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        return priceFeed.latestRound();
    }

    /// @notice add signers to deployed FluxPriceFeed
    /// @param _id hash of the price pair string to add role to
    /// @param _signer address of the signer to be granted SIGNER_ROLE
    /// @dev only admin (DEFAULT_ADMIN_ROLE) should be able to call this function
    function addSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        priceFeed.grantRole(SIGNER_ROLE, _signer);
    }

    /// @notice revoke signers from deployed FluxPriceFeed
    /// @param _id hash of the price pair string to revoke role from
    /// @param _signer address of the signer to be revoked SIGNER_ROLE
    /// @dev only admin (DEFAULT_ADMIN_ROLE) should be able to call this function
    function revokeSigner(bytes32 _id, address _signer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        priceFeed.revokeRole(SIGNER_ROLE, _signer);
    }

    /// @notice grants a new DEFAULT_ADMIN_ROLE to a given FluxPriceFeed
    /// @param _id hash of the price pair string to grant role to
    /// @param _newAdmin address of the FluxPriceFeed new admin
    /// @dev only admin (DEFAULT_ADMIN_ROLE) should be able to call this function
    function transferOwner(bytes32 _id, address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        FluxPriceFeed priceFeed = FluxPriceFeed(fluxPriceFeeds[_id].priceFeed);
        priceFeed.grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
    }

    /// @notice sets `minSigners`
    /// @param _id hash of the price pair string to set the minimum signers on
    /// @param _minSigners minimum number of signers required to submit a new answer
    /// @dev only admin (DEFAULT_ADMIN_ROLE) should be able to call this function
    function setMinSigners(bytes32 _id, uint256 _minSigners) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fluxPriceFeeds[_id].minSigners = _minSigners;
        emit MinSignersSet(_id, _minSigners);
    }

    /// @notice returns factory's type and version
    /// @return string containing factory's type and version
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.0.0";
    }
}
