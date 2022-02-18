import { ethers } from "ethers";
import { Address } from "hardhat-deploy/dist/types";

export function shouldBehaveLikeFluxLayerZeroOracle(): void {
  it("should notifyOracle", async function () {
    let _dstChainId = 1;
    let _outboundProofType = 1;
    let _remoteUlnAddress = ethers.utils.formatBytes32String("1");
    let _outboundBlockConfirmations = 1;
    let _payloadHash = ethers.constants.HashZero;

    let tx = await this.fluxLzOracle
      .connect(this.signers.lzn)
      .notifyOracle(_dstChainId, _outboundProofType, _remoteUlnAddress, _outboundBlockConfirmations, _payloadHash);
    console.log(tx);
  });

  it("should updateHash", async function () {
    let dstNetworkAddress: Address = this.lzNetwork.address;
    let _srcChainId = 1;
    let _data = ethers.utils.formatBytes32String("1");
    let _confirmations = 1;
    let _blockHash = ethers.constants.HashZero;

    let tx = await this.fluxLzOracle
      .connect(this.signers.admin)
      .updateHash(dstNetworkAddress, _srcChainId, _blockHash, _confirmations, _data);
    console.log(tx);
  });
}
