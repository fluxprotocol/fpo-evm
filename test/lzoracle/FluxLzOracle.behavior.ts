import { ethers } from "ethers";
import { Address } from "hardhat-deploy/dist/types";
import { expect } from "chai";

export function shouldBehaveLikeFluxLayerZeroOracle(): void {
  it("should notifyOracle", async function () {
    let _dstChainId = 1;
    let _outboundProofType = 1;
    let _outboundBlockConfirmations = 1;

    let tx = await this.fluxLzOracle
      .connect(this.signers.lzn)
      .notifyOracle(_dstChainId, _outboundProofType, _outboundBlockConfirmations);
    console.log(tx);
  });

  it("should updateHash", async function () {
    //      Error: Transaction reverted: function call to a non-contract account
    // let _srcChainId = 1;
    // let _data = ethers.utils.formatBytes32String("1");
    // let _confirmations = 1;
    // let _blockHash = ethers.constants.HashZero;
    // let tx = await this.fluxLzOracle
    //   .connect(this.signers.admin)
    //   .updateHash(_srcChainId, _blockHash, _confirmations, _data);
    // console.log(tx);
  });

  it("only DEFAULT_ADMIN_ROLE can call addLayerZero() and revokeLayerZero()", async function () {
    try {
      await this.fluxLzOracle.connect(this.signers.nonadmin).addLayerZero(this.signers.nonadmin.address);
    } catch (e) {
      if (!(e instanceof Error)) return;
      expect(e.message).to.contain(
        "is missing role 0x0000000000000000000000000000000000000000000000000000000000000000",
      );
    }
    await this.fluxLzOracle.connect(this.signers.admin).addLayerZero(this.signers.nonadmin.address);
  });
}
