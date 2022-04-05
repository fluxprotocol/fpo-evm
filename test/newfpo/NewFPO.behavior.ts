/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { ethers } from "ethers";
import { getAddress } from "ethers/lib/utils";

export function shouldBehaveLikeNewFluxPriceFeedFactory(): void {
  it("should transmit arrays and return values", async function () {
    console.log("+++fact", this.factory.address);
    let [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(0);
    expect(timeStamp).to.equal(0);
    expect(status).to.equal(404);
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);

    [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.btc_usd_p1_id);
    expect(price).to.equal(37600);
    expect(status).to.equal(200);
  });
  it("should overwrite values", async function () {
    console.log("----fact", this.factory.address);
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);
    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    answers = [2500, 37000];
    await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);
    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(2500);
    expect(status).to.equal(200);
  });

  it("should revert if provider does not exist", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    await expect(
      this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers, this.provider1.address),
    ).to.be.revertedWith("Provider doesn't exist");
  });

  it("should revert if transmitted arrays aren't equal", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000];
    await expect(
      this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero),
    ).to.be.revertedWith("Transmitted arrays must be equal");
  });

  it("should fetch adress of price pair", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    const tx = await this.factory
      .connect(this.provider1)
      .transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_p1_id);
    const btc_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.btc_usd_p1_id);

    const receipt = await tx.wait();
    const fluxPriceFeedCreatedEvents = receipt.events?.filter((x: { event: string }) => {
      return x.event == "FluxPriceFeedCreated";
    });
    const createdOraclesIds = [];
    const createdOraclesAddresses = [];
    for (let i = 0; i < fluxPriceFeedCreatedEvents.length; i++) {
      createdOraclesIds.push(fluxPriceFeedCreatedEvents[i].args["id"]);
      createdOraclesAddresses.push(fluxPriceFeedCreatedEvents[i].args["oracle"]);
    }
    expect(createdOraclesAddresses[0]).to.equal(eth_usd_addr);
    expect(createdOraclesAddresses[1]).to.equal(btc_usd_addr);
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.factory.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxFPO 1.0.0");
  });

  it("should allow adding new providers to existing price feeds", async function () {
    console.log("+++fact", this.factory.address);

    const pricePairs = [this.eth_usd_str];
    const decimals = [3];
    const answers = [3000];
    const answers2 = [111];

    // provider 1 can update the price feed to 3000
    await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);
    let [price] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(3000);

    // provider 2 can't update provider1's price feed
    await expect(
      this.factory.connect(this.provider2).transmit(pricePairs, decimals, answers2, this.provider1.address),
    ).to.be.revertedWith("Only validators can transmit");

    // price remains at 3000
    [price] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(3000);

    // provider 1 grants provider 2 permission to update the price feed

    // provider 2 can now update provider1's price feed
  });

  it("getId() helper function should work", async function () {});
}
