/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";

export function shouldBehaveLikeFluxPriceFeedFactory(): void {
  it("should transmit arrays and return values", async function () {
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

  it("should fetch adress of price pair id", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    const tx = await this.factory
      .connect(this.provider1)
      .transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePairId(this.eth_usd_p1_id);
    const btc_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePairId(this.btc_usd_p1_id);

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

  it("should fetch adress of price pair", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    const tx = await this.factory
      .connect(this.provider1)
      .transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);

    const eth_usd_addr = await this.factory
      .connect(this.signers.admin)
      .addressOfPricePair(pricePairs[0], decimals[0], this.provider1.address);
    const btc_usd_addr = await this.factory
      .connect(this.signers.admin)
      .addressOfPricePair(pricePairs[1], decimals[1], this.provider1.address);

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
    expect(typeAndVersion).to.equal("FluxPriceFeedFactory 2.0.0");
  });

  it("should allow adding new providers to existing price feeds", async function () {
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

    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    // provider 1 grants provider 2 permission to update the price feed
    let eth_usd_p1_address = await this.factory.connect(this.signers.admin).addressOfPricePairId(this.eth_usd_p1_id);
    const pf = await ethers.getContractAt("FluxPriceFeed", eth_usd_p1_address);

    await pf.connect(this.provider1).grantRole(VALIDATOR_ROLE, this.provider2.address);

    // provider 2 can now update provider1's price feed
    await this.factory.connect(this.provider2).transmit(pricePairs, decimals, answers2, this.provider1.address);
    // price changes to 111
    [price] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_p1_id);
    expect(price).to.equal(111);
  });

  it("getId() helper function should work", async function () {
    let fetched_eth_usd_p1_id = await this.factory
      .connect(this.signers.admin)
      .getId("ETH/USD", 3, this.provider1.address);
    expect(fetched_eth_usd_p1_id).to.equal(this.eth_usd_p1_id);
  });

  it("measure gas costs between first (contract creation) and second transmission", async function () {
    const pricePairs = [this.eth_usd_str];
    const decimals = [3];
    let answers = [3000];
    // let price1 = Number(
    //   (await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero))
    //     .gasPrice,
    // );
    // console.log("gasCost at creation = ", price1);

    let tx = await this.factory
      .connect(this.provider1)
      .transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);
    let gasUsed = (await tx.wait()).gasUsed;
    console.log("gasUsed at creation = ", gasUsed);
    answers = [2500];

    // let price2 = Number(
    //   (await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, ethers.constants.AddressZero))
    //     .gasPrice,
    // );
    // console.log("gasCost while updating = ", price2);

    tx = await this.factory
      .connect(this.provider1)
      .transmit(pricePairs, decimals, answers, ethers.constants.AddressZero);
    gasUsed = (await tx.wait()).gasUsed;
    console.log("gasUsed while updating and using address(0) = ", gasUsed);

    tx = await this.factory.connect(this.provider1).transmit(pricePairs, decimals, answers, this.provider1.address);
    gasUsed = (await tx.wait()).gasUsed;
    console.log("gasUsed while updating and setting provider address = ", gasUsed);
  });
}
