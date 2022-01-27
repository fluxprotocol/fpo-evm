// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interface/ILayerZeroNetwork.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Flux LayerZero receiver
 * @author fluxprotocol.org
 */
contract FluxLayerZeroReceiver is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    address public layerZeroNetwork;

    //
    // EVENTS
    //

    event Notified(uint256 indexed requestId);
    event WithdrawTokens(address token, address to, uint256 amount);
    event Withdraw(address to, uint256 amount);

    //
    // CONSTRUCTOR
    //

    constructor(address _admin, address _layerZero) {
        _setupRole(ADMIN_ROLE, _admin);
        layerZeroNetwork = _layerZero;
    }

    //
    // EXTERNAL METHODS
    //

    /// @notice called by admin after updateBlockHeader() is called on LayerZero for an existing request
    function proceedUpdateBlockHeader(
        uint256 requestIndex,
        uint16 _srcChainId,
        bytes calldata _blockHash,
        uint256 _confirmations,
        bytes calldata _data
    ) external {
        // require(hasRole(ADMIN_ROLE, msg.sender), "Admin only");

        ILayerZeroNetwork(layerZeroNetwork).updateBlockHeader(
            _srcChainId,
            address(this),
            _blockHash,
            _confirmations,
            _data
        );

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
