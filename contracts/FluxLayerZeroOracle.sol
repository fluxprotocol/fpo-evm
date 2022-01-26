// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/ILayerZeroOracle.sol";
import "./interface/ILayerZeroNetwork.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Flux LayerZero oracle
 * @author fluxprotocol.org
 */
contract FluxLayerZeroOracle is AccessControl, ILayerZeroOracle, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LAYERZERO_ROLE = keccak256("LAYERZERO_ROLE");

    struct Request {
        uint16 chainId;
        address layerZeroAddress;
        uint256 confirmations;
        uint256 requestedAtBlock;
    }

    uint256 public numRequests = 0;
    EnumerableSet.UintSet private pendingRequests;
    mapping(uint256 => Request) public requests;
    mapping(uint16 => uint256) public chainPriceLookup;

    //
    // EVENTS
    //

    event NotifyOracleOfBlock(
        uint256 indexed requestId,
        uint16 chainId,
        bytes layerZeroContract,
        uint256 requiredBlockConfirmations,
        uint256 requestedAtBlock
    );
    event Notified(uint256 indexed requestId);
    event WithdrawTokens(address token, address to, uint256 amount);
    event Withdraw(address to, uint256 amount);

    //
    // CONSTRUCTOR
    //

    constructor(address _admin, address _layerZero) {
        _setupRole(ADMIN_ROLE, _admin);
        _setupRole(LAYERZERO_ROLE, _layerZero);
    }

    //
    // EXTERNAL METHODS
    //

    /// @notice called by LayerZero to initiate a request
    function notifyOracleOfBlock(
        uint16 dstChainId,
        bytes calldata dstNetworkAddress,
        uint256 blockConfirmations
    ) external override {
        // require(hasRole(LAYERZERO_ROLE, msg.sender), "LayerZero only");

        Request memory request = Request(
            dstChainId,
            bytesToAddress(dstNetworkAddress),
            blockConfirmations,
            block.number
        );
        numRequests++;
        requests[numRequests] = request; // add to requests mapping

        emit NotifyOracleOfBlock(numRequests, dstChainId, dstNetworkAddress, blockConfirmations, block.number);
    }

    /// @notice called by admin after updateBlockHeader() is called on LayerZero for an existing request
    function proceedUpdateBlockHeader(
        uint256 requestIndex,
        bytes calldata _blockHash,
        bytes calldata _data
    ) external {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");

        Request memory request = requests[requestIndex];
        require(block.number >= request.requestedAtBlock + request.confirmations, "Not enough comfirmations");
        uint256 confirmationsSinceRequest = block.number - request.requestedAtBlock;

        ILayerZeroNetwork(request.layerZeroAddress).updateBlockHeader(
            request.chainId,
            address(this),
            _blockHash,
            confirmationsSinceRequest,
            _data
        );

        requests[requestIndex] = request; // update request in requests mapping
        pendingRequests.remove(requestIndex); // remove from pending requests set

        emit Notified(requestIndex);
    }

    // owner can approve a token spender
    function approveToken(
        address _token,
        address _spender,
        uint256 _amount
    ) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");
        IERC20 token = IERC20(_token);
        token.safeApprove(_spender, _amount);
    }

    // owner can withdraw native
    function withdraw(address payable _to, uint256 _amount) public nonReentrant {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");
        (bool success, ) = _to.call{ value: _amount }("");
        require(success, "OracleClient: failed to withdraw");
        emit Withdraw(_to, _amount);
    }

    // owner can withdraw tokens
    function withdrawTokens(
        address _token,
        address _to,
        uint256 _amount
    ) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");
        IERC20(_token).safeTransfer(_to, _amount);
        emit WithdrawTokens(_token, _to, _amount);
    }

    // owner can set gas price
    function setPrice(uint16 _destinationChainId, uint256 price) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");
        chainPriceLookup[_destinationChainId] = price;
    }

    //
    // PURE METHODS
    //

    function bytesToAddress(bytes memory bys) private pure returns (address addr) {
        assembly {
            addr := mload(add(bys, 32))
        }
    }

    //
    // VIEW METHODS
    //

    function getPendingRequests() internal view returns (uint256[] memory _pendingRequests) {
        return pendingRequests.values();
    }

    // return whether this signing address is whitelisted
    function isApproved(address oracleAddress) external view override returns (bool approved) {
        return hasRole(ADMIN_ROLE, oracleAddress);
    }

    function getPrice(uint16 dstChainId) external view returns (uint256 priceInWei) {
        return chainPriceLookup[dstChainId];
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other
     * function in the contract matches the call data.
     */
    fallback() external payable {}

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
     * is empty.
     */
    receive() external payable {}
}
