/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "ethers";

export function shouldBehaveLikeFluxP2PFactory(): void {
  // it("should transmit arrays and return values", async function () {
  //   let [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(0);
  //   expect(timeStamp).to.equal(0);
  //   expect(status).to.equal(404);
  //   const pricePairs = [this.eth_usd_str, this.btc_usd_str];
  //   const decimals = [3, 3];
  //   const answers = [3000, 37600];
  //   let p1_sigs = [];
  //   let msgHash;
  //   let p1_sig;
  //   for (let i = 0; i < pricePairs.length; i++) {
  //     msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
  //     p1_sig = await this.provider1.signMessage(arrayify(msgHash));
  //     p1_sigs.push(p1_sig);
  //     console.log("+++msgHash = ", msgHash);
  //     console.log("+++p1_sig = ", p1_sig);
  //     console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
  //   }
  //   await this.factory.connect(this.signers.admin).transmit(p1_sigs, pricePairs, decimals, answers);

  //   [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(3000);
  //   expect(status).to.equal(200);
  //   [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.btc_usd_id);
  //   expect(price).to.equal(37600);
  //   expect(status).to.equal(200);
  // });

  it("should overwrite values", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    let p1_sigs = [];
    let msgHash;
    let p1_sig;
    for (let i = 0; i < pricePairs.length; i++) {
      msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
      p1_sig = await this.provider1.signMessage(arrayify(msgHash));
      p1_sigs.push(p1_sig);
      console.log("+++msgHash = ", msgHash);
      console.log("+++p1_sig = ", p1_sig);
      console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
    }
    await this.factory.connect(this.signers.admin).transmit(p1_sigs, pricePairs, decimals, answers);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    answers = [2500, 37000];
    p1_sigs = [];
    for (let i = 0; i < pricePairs.length; i++) {
      msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
      p1_sig = await this.provider1.signMessage(arrayify(msgHash));
      p1_sigs.push(p1_sig);
      console.log("+++msgHash = ", msgHash);
      console.log("+++p1_sig = ", p1_sig);
      console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
    }

    await this.factory.connect(this.signers.admin).transmit(p1_sigs, pricePairs, decimals, answers);
    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(2500);
    expect(status).to.equal(200);
  });

  it("should revert if signature is invalid", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    let p1_sigs = [];
    let msgHash;
    let p1_sig;
    for (let i = 0; i < pricePairs.length; i++) {
      msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
      p1_sig = await this.provider2.signMessage(arrayify(msgHash));
      p1_sigs.push(p1_sig);
      console.log("+++msgHash = ", msgHash);
      console.log("+++p1_sig = ", p1_sig);
      console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
    }
    await expect(
      this.factory.connect(this.signers.admin).transmit(p1_sigs, pricePairs, decimals, answers),
    ).to.be.revertedWith("SIGNATURE FAILED");
  });

  it("should revert if transmitted arrays aren't equal", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    let p1_sigs = [];
    let msgHash;
    let p1_sig;
    for (let i = 0; i < pricePairs.length; i++) {
      msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
      p1_sig = await this.provider1.signMessage(arrayify(msgHash));
      p1_sigs.push(p1_sig);
      console.log("+++msgHash = ", msgHash);
      console.log("+++p1_sig = ", p1_sig);
      console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
    }
    let sigs_slice = [p1_sigs[0]];
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs_slice, pricePairs, decimals, answers),
    ).to.be.revertedWith("Transmitted arrays must be equal");
  });

  it("should fetch adress of price pair", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    let p1_sigs = [];
    let msgHash;
    let p1_sig;
    for (let i = 0; i < pricePairs.length; i++) {
      msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePairs[i], decimals[i], answers[i]]);
      p1_sig = await this.provider1.signMessage(arrayify(msgHash));
      p1_sigs.push(p1_sig);
      console.log("+++msgHash = ", msgHash);
      console.log("+++p1_sig = ", p1_sig);
      console.log("++ethers recovered address", await ethers.utils.verifyMessage(arrayify(msgHash), p1_sig));
    }
    let tx = await this.factory.connect(this.signers.admin).transmit(p1_sigs, pricePairs, decimals, answers);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const btc_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.btc_usd_id);

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
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.0.0");
  });
}
