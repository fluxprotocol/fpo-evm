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
    /// @dev used to determine if signature is valid; stored on FluxPriceFeed contract
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    /// @dev mapping of id to FluxPriceFeed (e.g. `Price-ETH/USD-8`)
    mapping(bytes32 => FluxPriceFeed) public fluxPriceFeeds;

    /// @notice indicates that a new oracle was created
    /// @param id hash of the price pair of the deployed oracle
    /// @param oracle address of the deployed oracle
    /// @param signers addresses of the intitial signers
    event FluxPriceFeedCreated(bytes32 indexed id, address indexed oracle, address[] signers);

    /// @notice logs error messages
    /// @param message the error message
    event Log(string message);

    /// @notice initializes this contract (in replacement of constructor for OZ Initializable)
    function initialize() public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice returns a hash of the price pair string
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @return hash of the price pair string
    function hashPricePairId(string calldata _pricePair, uint8 _decimals) public view returns (bytes32) {
        string memory str = string(abi.encodePacked("Price-", _pricePair, "-", Strings.toString(_decimals)));
        return keccak256(bytes(str));
    }

    /// @notice admin-callable function to create a new FluxPriceFeed
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _signers array of initial allowed signatures for `transmit()`
    function deployOracle(
        string calldata _pricePair,
        uint8 _decimals,
        address[] memory _signers
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_signers.length > 1, "Needs at least 2 signers");

        // format the price pair id and require it to be unique
        bytes32 _id = hashPricePairId(_pricePair, _decimals);
        require(address(fluxPriceFeeds[_id]) == address(0x0), "Oracle already deployed");

        // deploy the new contract and store it in the mapping
        FluxPriceFeed newPriceFeed = new FluxPriceFeed(address(this), _decimals, _pricePair);
        fluxPriceFeeds[_id] = newPriceFeed;

        // set the signers
        for (uint256 i = 0; i < _signers.length; i++) {
            // grant the provider SIGNER_ROLE on the new FluxPriceFeed
            newPriceFeed.grantRole(SIGNER_ROLE, _signers[i]);
        }

        emit FluxPriceFeedCreated(_id, address(newPriceFeed), _signers);
    }

    /// @notice leader submits signed messages of median answer for associated price pair and round
    /// @param _signatures array of signed messages of the four following arguments
    /// @param _pricePair e.g. ETH/USD
    /// @param _decimals e.g. 8
    /// @param _roundId latest round of the FluxPriceFeed
    /// @param _answer median answer
    function transmit(
        bytes[] calldata _signatures,
        string calldata _pricePair,
        uint8 _decimals,
        uint32 _roundId,
        int192 _answer
    ) external {
        require(_signatures.length > 1, "Needs at least 2 signatures");

        // format the price pair id
        bytes32 id = hashPricePairId(_pricePair, _decimals);

        // verify the roundId
        uint256 roundId = fluxPriceFeeds[id].latestRound();
        require(roundId == _roundId, "Wrong roundId");

        // recover signatures and verify them
        bytes32 hashedMsg = ECDSA.toEthSignedMessageHash(
            keccak256(abi.encodePacked(_pricePair, _decimals, _roundId, _answer))
        );
        for (uint256 i = 0; i < _signatures.length; i++) {
            (address recoveredSigner, ECDSA.RecoverError error) = ECDSA.tryRecover(hashedMsg, _signatures[i]);
            if (error == ECDSA.RecoverError.NoError) {
                require(fluxPriceFeeds[id].hasRole(SIGNER_ROLE, recoveredSigner), "Invalid signed message");
            } else {
                revert("Couldn't recover signer");
            }
        }

        // try transmitting values to the oracle
        /* solhint-disable-next-line no-empty-blocks */
        try fluxPriceFeeds[id].transmit(_answer) {
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

    /// @notice returns the latest round of a price pair
    /// @dev _id hash of the price pair string to query
    function latestRoundOfPricePair(bytes32 _id) external view returns (uint256) {
        return fluxPriceFeeds[_id].latestRound();
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
    /// @param _newAdmin address of the pricefeed new admin
    /// @dev only factory's deployer (DEFAULT_ADMIN_ROLE) should be able to call this function
    function transferOwner(bytes32 _id, address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        fluxPriceFeeds[_id].grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
    }

    /// @notice returns factory's type and version
    function typeAndVersion() external view virtual returns (string memory) {
        return "FluxP2PFactory 1.0.0";
    }
}
