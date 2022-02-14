// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/ILayerZeroOracle.sol";
import "./interface/ILayerZeroNetwork.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Flux LayerZero oracle
 * @author fluxprotocol.org
 */
contract FluxLayerZeroOracle is AccessControl, ILayerZeroOracle, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LAYERZERO_ROLE = keccak256("LAYERZERO_ROLE");

    mapping(uint16 => uint256) public chainPriceLookup;

    //
    // EVENTS
    //

    event NotifyOracleOfBlock(
        uint16 chainId,
        bytes layerZeroContract,
        uint256 requiredBlockConfirmations,
        bytes32 payloadHash,
        uint256 requestedAtBlock
    );
    event Notified(
        address dstNetworkAddress,
        uint16 _srcChainId,
        bytes _blockHash,
        uint256 _confirmations,
        bytes _data
    );
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
    /// @param chainId - chainId of source chain
    /// @param networkAddress - address of the LayerZero contract on the specified chain on which to call updateBlockHeader()
    /// @param blockConfirmations - number of blocks to wait for before calling updateBlockHeader() from this call's block.timestamp
    /// @param payloadHash -
    function notifyOracleOfBlock(
        uint16 chainId,
        bytes calldata networkAddress,
        uint256 blockConfirmations,
        bytes32 payloadHash
    ) external override {
        require(hasRole(LAYERZERO_ROLE, msg.sender), "LayerZero only");

        emit NotifyOracleOfBlock(chainId, networkAddress, blockConfirmations, payloadHash, block.number);
    }

    /// @notice called by admin after updateBlockHeader() is called on LayerZero for an existing request
    /// @param dstNetworkAddress - address of the LayerZero contract on the specified chain on which to call updateBlockHeader()
    /// @param _srcChainId - id of the source chain
    /// @param _blockHash - hash of the remote block header
    /// @param  _confirmations - number of confirmations waited
    /// @param _data - receiptsRoot (for EVMs) for the corresponding remote blockHash
    function proceedUpdateBlockHeader(
        address dstNetworkAddress,
        uint16 _srcChainId,
        bytes calldata _blockHash,
        uint256 _confirmations,
        bytes calldata _data
    ) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");

        ILayerZeroUltraLightNode(dstNetworkAddress).updateHash(_srcChainId, _blockHash, _confirmations, _data);

        emit Notified(dstNetworkAddress, _srcChainId, _blockHash, _confirmations, _data);
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
    // VIEW METHODS
    //

    // return whether this signing address is whitelisted
    function isApproved(address oracleAddress) external view override returns (bool approved) {
        return oracleAddress == address(this);
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
