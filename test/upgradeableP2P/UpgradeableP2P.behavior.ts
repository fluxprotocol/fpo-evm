/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";

const transmitTypes: string[] = ["string", "uint8", "string", "uint256", "int192"];

export function shouldBehaveLikeUpgradeableFluxP2PFactory(): void {
  it("should transmit and calculate median", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy
      .connect(this.provider1)
      .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);

    answers = [4000, 5000];
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.proxy
      .connect(this.provider1)
      .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers);

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4500);
    expect(status).to.equal(200);
  });

  it("should revert when same oracle is redeployed", async function () {
    const decimals = 3;

    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await expect(
      this.proxy
        .connect(this.signers.admin)
        .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]),
    ).to.be.revertedWith("Transaction reverted");
  });

  it("should revert if signer isn't a validator", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[2],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));

    let sigs = [p1_sig, p2_sig, p3tobe_sig];
    answers = [3000, 4000, 5000];

    await expect(
      this.proxy
        .connect(this.provider1)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers),
    ).to.be.revertedWith("Invalid signature");
  });

  it("should revert if answers from leader differs from signatures", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let invalid_answers = [4000, 4000];
    await expect(
      this.proxy
        .connect(this.provider1)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), invalid_answers),
    ).to.be.revertedWith("Invalid signature");
  });

  it("should revert if caller is not a signer", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await expect(
      this.proxy
        .connect(this.nonprovider)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers),
    ).to.be.revertedWith("Invalid caller");
  });

  it("should revert if it received only one signature", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let sigs = [p1_sig];

    await expect(
      this.proxy
        .connect(this.provider1)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers),
    ).to.be.revertedWith("Too few signers");
  });

  it("should fetch address of price pair", async function () {
    const decimals = 3;

    let tx = await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    const eth_usd_addr = await this.proxy.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const receipt = await tx.wait();
    const fluxPriceFeedCreatedEvents = receipt.events?.filter((x: { event: string }) => {
      return x.event == "PriceFeedCreated";
    });
    const createdOraclesIds = [];
    const createdOraclesAddresses = [];
    for (let i = 0; i < fluxPriceFeedCreatedEvents.length; i++) {
      createdOraclesIds.push(fluxPriceFeedCreatedEvents[i].args["id"]);
      createdOraclesAddresses.push(fluxPriceFeedCreatedEvents[i].args["oracle"]);
    }
    expect(createdOraclesAddresses[0]).to.equal(eth_usd_addr);
  });

  it("should fetch latest roundId of price pair", async function () {
    const decimals = 3;
    const pricePair = this.eth_usd_str;
    let answers = [3000, 4000];

    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy
      .connect(this.provider1)
      .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers);

    const latestId = await this.proxy.connect(this.signers.admin).latestRoundOfPricePair(this.eth_usd_id);

    expect(latestId).to.equal(1);
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.proxy.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.1.0");
  });

  it("should transmit providers with diff orders", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [2000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p2_sig, p1_sig];

    await this.proxy
      .connect(this.provider1)
      .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("should require answers to be transmitted in order", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [4000, 3000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await expect(
      this.proxy
        .connect(this.provider1)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers),
    ).to.be.revertedWith("Not sorted");
  });

  it("should disallow multiple answers from the same signer", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p1_2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p1_2_sig = await this.provider1.signMessage(arrayify(p1_2_msgHash));
    let sigs = [p1_sig, p1_2_sig];

    await expect(
      this.proxy
        .connect(this.provider1)
        .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers),
    ).to.be.revertedWith("Duplicate signer");
  });

  it("return status 404 for 0 answers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(status).to.equal(404);

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(status).to.equal(404);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      pricePair,
      decimals,
      this.signers.admin.address.toLowerCase(),
      Number(round) + 1,
      answers[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy
      .connect(this.provider1)
      .transmit(sigs, pricePair, decimals, this.signers.admin.address.toLowerCase(), answers);

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);
  });
}
