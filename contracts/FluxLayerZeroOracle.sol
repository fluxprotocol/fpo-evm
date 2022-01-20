// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";

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
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Request {
        uint256 requestedAtBlock;
        uint256 blockConfimations;
        address layerZeroContract;
        bytes blockHash;
        bytes receiptsRoot;
        bool notified;
    }

    mapping(bytes32 => Request) public requests;

    constructor(address _admin) {
        _setupRole(ADMIN_ROLE, _admin);
    }

    /**
     * PUBLIC
     */

    function startRequest(
        address contractAddress,
        uint256 blockConfirmations,
        bytes32 blockHash,
        bytes32 receiptsRoot
    ) public {
        bytes32 key = _hash(msg.sender, block.number);
        Request memory request = requests[key];
        if (request.layerZeroContract == address(0)) {
            request.layerZeroContract = contractAddress;
            request.blockConfimations = blockConfirmations;
            request.requestedAtBlock = block.number;
            request.blockHash = abi.encodePacked(blockHash);
            request.receiptsRoot = abi.encodePacked(receiptsRoot);
            request.notified = false;
        }
        requests[key] = request;
    }

    function notify(bytes32 key) public {
        Request memory request = requests[key];
        require(request.layerZeroContract != address(0), "Request not initialized");
        require(request.notified == false, "Request already notified");
        uint256 confirmationsSinceRequest = block.number - request.requestedAtBlock;
        require(confirmationsSinceRequest >= request.blockConfimations);

        LayerZeroContract(request.layerZeroContract).updateBlockHeader(
            uint16(block.chainid), // chain id
            msg.sender, // oracle
            request.blockHash, // block hash
            confirmationsSinceRequest, // confirmations
            request.receiptsRoot // receipts root
        );
        requests[key] = request;
    }

    /**
     * INTERNAL
     */

    function _hash(address _from, uint256 _blockNumber) internal pure returns (bytes32) {
        return keccak256(abi.encode(_from, _blockNumber));
    }
}
