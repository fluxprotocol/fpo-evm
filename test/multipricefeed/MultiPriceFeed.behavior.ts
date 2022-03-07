import { expect } from "chai";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFluxMultiPriceFeed(): void {
  it("should transmit arrays and return values", async function () {
    let [price, timeStamp, status] = await this.multiPriceFeed.connect(this.signers.admin).valueFor(this.eth_usd);
    expect(price).to.equal(0);
    expect(timeStamp).to.equal(0);
    expect(status).to.equal(404);
    const pricePairs = [this.eth_usd, this.btc_usd];
    const answers = [3000, 37600];
    await this.multiPriceFeed.connect(this.signers.admin).transmit(pricePairs, answers);
    [price, timeStamp, status] = await this.multiPriceFeed.connect(this.signers.admin).valueFor(this.eth_usd);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    [price, timeStamp, status] = await this.multiPriceFeed.connect(this.signers.admin).valueFor(this.btc_usd);
    expect(price).to.equal(37600);
    expect(status).to.equal(200);
  });
  it("should overwrite values", async function () {
    const pricePairs = [this.eth_usd, this.btc_usd];
    let answers = [3000, 37600];
    await this.multiPriceFeed.connect(this.signers.admin).transmit(pricePairs, answers);
    let [price, , status] = await this.multiPriceFeed.connect(this.signers.admin).valueFor(this.eth_usd);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    answers = [2500, 37000];
    await this.multiPriceFeed.connect(this.signers.admin).transmit(pricePairs, answers);
    [price, , status] = await this.multiPriceFeed.connect(this.signers.admin).valueFor(this.eth_usd);
    expect(price).to.equal(2500);
    expect(status).to.equal(200);
  });

  it("should revert if caller is not a validator", async function () {
    const pricePairs = [this.eth_usd, this.btc_usd];
    const answers = [3000, 37600];
    await expect(this.multiPriceFeed.connect(this.signers.nonadmin).transmit(pricePairs, answers)).to.be.reverted;
  });

  it("should revert if transmitted arrays aren't equal", async function () {
    const pricePairs = [this.eth_usd, this.btc_usd];
    const answers = [3000];
    await expect(this.multiPriceFeed.connect(this.signers.admin).transmit(pricePairs, answers)).to.be.revertedWith(
      "The transmitted arrays must be equal",
    );
  });
}
