// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/ILayerZeroOracle.sol";
import "./interface/ILayerZeroUltraLightNode.sol";
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

    event deployed(address admin, address lz);

    event NotifiedOracle(
        uint16 chainId,
        uint16 outboundProofType,
        bytes32 layerZeroContract,
        uint256 requiredBlockConfirmations,
        bytes32 payloadHash,
        uint256 requestedAtBlock
    );
    event NotifiedLayerZero(
        address dstNetworkAddress,
        uint16 _srcChainId,
        bytes32 _blockHash,
        uint256 _confirmations,
        bytes32 _data
    );
    event WithdrawTokens(address token, address to, uint256 amount);
    event Withdraw(address to, uint256 amount);

    //
    // CONSTRUCTOR
    //

    constructor(address _admin, address _layerZero) {
        _setupRole(ADMIN_ROLE, _admin);
        _setupRole(LAYERZERO_ROLE, _layerZero);
        emit deployed(_admin, _layerZero);
    }

    //
    // EXTERNAL METHODS
    //

    /// @notice called by LayerZero to initiate a request
    /// @param _dstChainId - chainId of source chain
    /// @param _outboundProofType -
    /// @param _remoteUlnAddress - address of the LayerZero contract on the specified chain on which to call updateHash()
    /// @param _outboundBlockConfirmations - number of blocks to wait for before calling updateHash() from this call's block.timestamp
    /// @param _payloadHash - payload
    function notifyOracle(
        uint16 _dstChainId,
        uint16 _outboundProofType,
        bytes32 _remoteUlnAddress,
        uint64 _outboundBlockConfirmations,
        bytes32 _payloadHash
    ) external override onlyRole(LAYERZERO_ROLE) {
        emit NotifiedOracle(
            _dstChainId,
            _outboundProofType,
            _remoteUlnAddress,
            _outboundBlockConfirmations,
            _payloadHash,
            block.number
        );
    }

    /// @notice called by admin after LayerZero has notified us of a new hash via notifyOracle()
    /// @param dstNetworkAddress - address of the LayerZero contract on the specified chain on which to call updateHash()
    /// @param _srcChainId - id of the source chain
    /// @param _blockHash - hash of the remote block header
    /// @param  _confirmations - number of confirmations waited
    /// @param _data - receiptsRoot (for EVMs) for the corresponding remote blockHash
    function updateHash(
        address dstNetworkAddress,
        uint16 _srcChainId,
        bytes32 _blockHash,
        uint256 _confirmations,
        bytes32 _data
    ) external onlyRole(ADMIN_ROLE) {
        // make the call to LayerZero
        ILayerZeroUltraLightNode(dstNetworkAddress).updateHash(_srcChainId, _blockHash, _confirmations, _data);

        emit NotifiedLayerZero(dstNetworkAddress, _srcChainId, _blockHash, _confirmations, _data);
    }

    // admin can approve a token spender
    function approveToken(
        address _token,
        address _spender,
        uint256 _amount
    ) external {
        require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");
        IERC20 token = IERC20(_token);
        token.safeApprove(_spender, _amount);
    }

    // admin can withdraw from a LayerZero ULN which accumulates native tokens per call
    function withdrawOracleFee(address _remoteUlnAddress, uint256 _amount) external onlyRole(ADMIN_ROLE) {
        ILayerZeroUltraLightNode(_remoteUlnAddress).withdrawOracleFee(msg.sender, _amount);
    }

    // admin can withdraw native
    function withdraw(address payable _to, uint256 _amount) public nonReentrant onlyRole(ADMIN_ROLE) {
        (bool success, ) = _to.call{ value: _amount }("");
        require(success, "OracleClient: failed to withdraw");
        emit Withdraw(_to, _amount);
    }

    // admin can withdraw tokens
    function withdrawTokens(
        address _token,
        address _to,
        uint256 _amount
    ) public onlyRole(ADMIN_ROLE) {
        IERC20(_token).safeTransfer(_to, _amount);
        emit WithdrawTokens(_token, _to, _amount);
    }

    // admin can set gas price
    function setPrice(uint16 _destinationChainId, uint256 price) external onlyRole(ADMIN_ROLE) {
        chainPriceLookup[_destinationChainId] = price;
    }

    //
    // VIEW METHODS
    //

    // return whether this signing address is whitelisted
    function isApproved(address oracleAddress) external view override returns (bool approved) {
        return oracleAddress == address(this);
    }

    function getPrice(uint16 dstChainId, uint16 _outboundProofType) external view returns (uint256 priceInWei) {
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
