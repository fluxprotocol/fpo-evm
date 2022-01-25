// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface LayerZeroContract {
    function updateBlockHeader(
        uint16 remoteChainId,
        address oracle,
        bytes calldata blockHash,
        uint256 confirmations,
        bytes calldata receiptsRoot
    ) external;
}

/**
 * @title Flux LayerZero oracle
 * @author fluxprotocol.org
 */
contract FluxPriceFeed is AccessControl {
    using EnumerableSet for EnumerableSet.UintSet;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Request {
        uint256 requestedAtBlock;
        uint256 requiredBlockConfirmations;
        address layerZeroContract;
        bytes blockHash;
        bytes receiptsRoot;
        bool notified;
    }

    EnumerableSet.UintSet private pendingRequests;
    uint256 public numRequests = 0;
    mapping(uint256 => Request) public requests;

    //
    // EVENTS
    //

    event Requested(
        uint256 indexed requestId,
        address layerZeroContract,
        uint256 requiredBlockConfirmations,
        bytes blockHash,
        bytes receiptsRoot
    );
    event Notified(uint256 indexed requestId);

    //
    // CONSTRUCTOR
    //

    constructor(address _admin) {
        _setupRole(ADMIN_ROLE, _admin);
    }

    //
    // EXTERNAL METHODS
    //

    function startRequest(
        address layerZeroContract,
        uint256 requiredBlockConfirmations,
        bytes32 blockHash,
        bytes32 receiptsRoot
    ) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can start a request");
        numRequests++;
        Request memory request = requests[numRequests];
        if (request.layerZeroContract == address(0)) {
            request.layerZeroContract = layerZeroContract;
            request.requiredBlockConfirmations = requiredBlockConfirmations;
            request.requestedAtBlock = block.number;
            request.blockHash = abi.encodePacked(blockHash);
            request.receiptsRoot = abi.encodePacked(receiptsRoot);
            request.notified = false;
        }
        requests[numRequests] = request; // add to requests mapping
        pendingRequests.add(numRequests); // add to pending requests set

        emit Requested(
            numRequests,
            request.layerZeroContract,
            request.requiredBlockConfirmations,
            request.blockHash,
            request.receiptsRoot
        );
    }

    function notify(uint256 key) external {
        Request memory request = requests[key];
        require(request.layerZeroContract != address(0), "Request not initialized");
        require(request.notified == false, "Request already notified");
        uint256 confirmationsSinceRequest = block.number - request.requestedAtBlock;
        require(confirmationsSinceRequest >= request.requiredBlockConfirmations, "Not enough confirmations");

        LayerZeroContract(request.layerZeroContract).updateBlockHeader(
            uint16(block.chainid), // chain id
            address(this), // oracle
            request.blockHash, // block hash
            confirmationsSinceRequest, // confirmations
            request.receiptsRoot // receipts root
        );
        request.notified = true;
        requests[key] = request; // update request in requests mapping
        pendingRequests.remove(key); // remove from pending requests set

        emit Notified(key);
    }

    //
    // VIEW METHODS
    //

    function getPendingRequests() internal view returns (uint256[] memory _pendingRequests) {
        return pendingRequests.values();
    }
}
