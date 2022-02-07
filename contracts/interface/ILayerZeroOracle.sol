// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.10;

// LayerZero oracle interface.
interface ILayerZeroOracle {
    // the qty of native gas token (on source) for initiating the oracle with notifyOracleOfBlock()
    function getPrice(uint16 dstChainId) external view returns (uint256 priceInWei);

    // initiates the offchain oracle to do its job
    function notifyOracleOfBlock(
        uint16 chainId,
        bytes calldata endpointAddress,
        uint256 blockConfirmations,
        bytes32 payloadHash
    ) external;

    // return true if the address is allowed to call updateBlockHeader()
    function isApproved(address oracleSigner) external view returns (bool approved);
}
