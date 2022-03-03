import { expect } from "chai";
import { utils } from "ethers";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFluxPriceFeedFactory(): void {
  it("should transmit arrays and return values", async function () {
    let [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(timeStamp).to.equal(0);
    expect(status).to.equal(404);
    let pricePairs = [this.eth_usd_str, this.btc_usd_str];
    let decimals = [3, 3];
    let answers = [3000, 37600];
    let tx = await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
    const receipt = await tx.wait();
    // console.log(receipt.logs);
    // console.log("Factory address = ", this.factory.address);
    let eventSig = utils.id("FluxPriceFeedCreated(bytes32,address)");
    // console.log("FluxPriceFeedCreated event signature = ", eventSig);

    let fluxPriceFeedCreatedEvents = receipt.events?.filter((x: { event: string }) => {
      return x.event == "FluxPriceFeedCreated";
    });
    // console.log(fluxPriceFeedCreatedEvents);
    for (let i = 0; i < fluxPriceFeedCreatedEvents.length; i++) {
      console.log("created oracle id = ", fluxPriceFeedCreatedEvents[i].args["id"]);
      console.log("created oracle address = ", fluxPriceFeedCreatedEvents[i].args["oracle"]);
    }

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.btc_usd_id);
    expect(price).to.equal(37600);
    expect(status).to.equal(200);
  });
  // it("should overwrite values", async function () {
  //   let pricePairs = [this.eth_usd_str, this.btc_usd_str];
  //   let decimals = [3, 3];
  //   let answers = [3000, 37600];
  //   await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
  //   let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(3000);
  //   expect(status).to.equal(200);
  //   answers = [2500, 37000];
  //   await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
  //   [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(2500);
  //   expect(status).to.equal(200);
  // });

  // it("should revert if caller is not a validator", async function () {
  //   let pricePairs = [this.eth_usd_str, this.btc_usd_str];
  //   let decimals = [3, 3];
  //   let answers = [3000, 37600];
  //   await expect(this.factory.connect(this.signers.nonadmin).transmit(pricePairs, decimals, answers)).to.be.reverted;
  // });

  // it("should revert if transmitted arrays aren't equal", async function () {
  //   let pricePairs = [this.eth_usd_str, this.btc_usd_str];
  //   let decimals = [3, 3];
  //   let answers = [3000];
  //   await expect(this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers)).to.be.revertedWith(
  //     "Transmitted arrays must be equal",
  //   );
  // });
}
