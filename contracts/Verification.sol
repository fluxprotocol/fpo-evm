// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

library Verification {
    function _getSigner(
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 messageHash = _getMessageHash(_pricePair, _decimal, _answer);
        bytes32 ethSignedMessageHash = _getEthSignedMessageHash(messageHash);

        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);

        return recoveredSigner;
    }

    function _verify(
        address _signer,
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer,
        bytes memory signature
    ) internal pure returns (bool) {
        return _getSigner(_pricePair, _decimal, _answer, signature) == _signer;
    }

    function _getMessageHash(
        string memory _pricePair,
        uint8 _decimal,
        int192 _answer
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_pricePair, _decimal, _answer));
    }

    function _getEthSignedMessageHash(bytes32 _messageHash) internal pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    function _recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);

        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function _splitSignature(bytes memory sig)
        internal
        pure
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
