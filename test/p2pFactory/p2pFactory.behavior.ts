/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "hardhat";

const transmitTypes: string[] = ["bytes32", "uint256", "int192", "uint64"];
const modifySignersTypes: string[] = ["bytes32", "uint256", "address", "bool"];

export function shouldBehaveLikeFluxP2PFactory(): void {
  it("should transmit and calculate median", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);

    answers = [4000, 5000];
    timestamps = [this.timestamp + 2, this.timestamp + 3];
    round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4500);
    expect(status).to.equal(200);
  });

  it("should revert when same oracle is redeployed", async function () {
    const decimals = 3;

    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await expect(
      this.factory
        .connect(this.signers.admin)
        .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]),
    ).to.be.revertedWith("Already deployed");
  });

  it("should revert if signer isn't a validator", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];
    let timestamps = [this.timestamp, this.timestamp + 1, this.timestamp + 2];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[2],
      timestamps[2],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));

    let sigs = [p1_sig, p2_sig, p3tobe_sig];
    answers = [3000, 4000, 5000];

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Invalid signature");
  });

  it("should revert if answers from leader differs from signatures", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let invalid_answers = [4000, 4000];
    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, invalid_answers, timestamps),
    ).to.be.revertedWith("Invalid signature");
  });

  it("should revert if caller is not a signer", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await expect(
      this.factory.connect(this.nonprovider).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Invalid caller");
  });

  it("should revert if it received only one signature", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000];
    let timestamps = [this.timestamp];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let sigs = [p1_sig];

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Too few signers");
  });

  it("should fetch address of price pair", async function () {
    const decimals = 3;

    let tx = await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
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
    let timestamps = [this.timestamp, this.timestamp + 1];

    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    const latestId = await this.factory.connect(this.signers.admin).latestRoundOfPricePair(this.eth_usd_id);

    expect(latestId).to.equal(1);
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.factory.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.1.0");
  });

  it("should transmit providers with diff orders", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [2000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p2_sig, p1_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("should require answers to be transmitted in order", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [4000, 3000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Not sorted");
  });

  it("should disallow multiple answers from the same signer", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p1_2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p1_2_sig = await this.provider1.signMessage(arrayify(p1_2_msgHash));
    let sigs = [p1_sig, p1_2_sig];

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Duplicate signer");
  });

  it("return status 404 for 0 answers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 1];

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(status).to.equal(404);

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(status).to.equal(404);

    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[0],
      timestamps[0],
    ]);
    let p2_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[1],
      timestamps[1],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);
  });

  it("should modify signers", async function () {
    let decimals = 3;

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // provider1 and provider2 sign a message to add provider3tobe
    let round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider3tobe.address,
      true,
    ]);
    let p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider3tobe.address,
      true,
    ]);

    let p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    let p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    let sigs0 = [p1_sig0, p2_sig0];

    // add provider3tobe
    await this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider3tobe.address, true);

    // now remove the provider3tobe

    round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider3tobe.address,
      false,
    ]);
    p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider3tobe.address,
      false,
    ]);

    p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    sigs0 = [p1_sig0, p2_sig0];

    // rm provider3
    await this.factory
      .connect(this.signers.admin)
      .modifySigners(sigs0, this.eth_usd_id, this.provider3tobe.address, false);

    // try removing more signers (provider2)
    round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

    p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider2.address,
      false,
    ]);
    p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      round,
      this.provider2.address,
      false,
    ]);

    p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    sigs0 = [p1_sig0, p2_sig0];

    await expect(
      this.factory.connect(this.signers.admin).modifySigners(sigs0, this.eth_usd_id, this.provider2.address, false),
    ).to.be.revertedWith("Need >2 signers");
  });
}
