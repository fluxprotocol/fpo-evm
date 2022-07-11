/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "hardhat";
import { network } from "hardhat";

const transmitTypes: string[] = ["bytes32", "uint256", "int192", "uint64"];
const modifySignersTypes: string[] = ["bytes32", "uint256", "address", "bool"];

export function shouldBehaveLikeFluxP2PFactory(): void {
  it("should allow signer to cancel transmit signature", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];
    let timestamps = [this.timestamp + 1, this.timestamp + 1, this.timestamp + 1];

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [
        this.provider1.address,
        this.provider2.address,
        this.provider3.address,
      ]);

    // sign answers
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
    let p3_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[2],
      timestamps[2],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3_sig = await this.provider3.signMessage(arrayify(p3_msgHash));

    let sigs = [p1_sig, p2_sig, p3_sig];

    await this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps);

    let [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4000);
    expect(timestamp).to.equal(this.timestamp + 1);
    expect(status).to.equal(200);

    // add one hour to timestamp
    await network.provider.send("evm_increaseTime", [3600]);
    this.timestamp += 3600;

    timestamps = [this.timestamp, this.timestamp, this.timestamp];
    answers = [4000, 5000, 6000];
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
    p3_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[2],
      timestamps[2],
    ]);
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3_sig = await this.provider3.signMessage(arrayify(p3_msgHash));

    sigs = [p1_sig, p2_sig, p3_sig];

    // provider1 cancels its transmit signature
    await this.factory.connect(this.provider1).cancelSignature(this.eth_usd_id, true);

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Duplicate signer or cancelled signature");

    answers = [5000, 6000];
    timestamps = [this.timestamp, this.timestamp];
    sigs = [p2_sig, p3_sig];
    // transmit without provider1 signature
    await this.factory.connect(this.provider2).transmit(sigs, this.eth_usd_id, answers, timestamps);
    [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(5500);
    expect(timestamp).to.equal(this.timestamp);
    expect(status).to.equal(200);

    timestamps = [this.timestamp + 2, this.timestamp + 2, this.timestamp + 2];
    answers = [4000, 5000, 6000];
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
    p3_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[2],
      timestamps[2],
    ]);
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3_sig = await this.provider3.signMessage(arrayify(p3_msgHash));

    sigs = [p1_sig, p2_sig, p3_sig];

    await this.factory.connect(this.provider2).transmit(sigs, this.eth_usd_id, answers, timestamps);
    [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(5000);
    expect(timestamp).to.equal(this.timestamp + 2);
    expect(status).to.equal(200);
  });

  it("should allow signer to cancel modify signers signature", async function () {
    let decimals = 3;

    // deploy oracle
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [
        this.provider1.address,
        this.provider2.address,
        this.provider3.address,
      ]);

    // provider1,  provider2, provider3 sign a message to add provider4
    let round = await this.factory.latestSignerModificationRound(this.eth_usd_id);
    let p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider4.address,
      true,
    ]);
    let p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider4.address,
      true,
    ]);
    let p3_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider4.address,
      true,
    ]);

    let p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    let p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    let p3_sig0 = await this.provider3.signMessage(arrayify(p3_mHash));

    let sigs0 = [p1_sig0, p2_sig0, p3_sig0];
    // provider1 cancels its signature
    await this.factory.connect(this.provider1).cancelSignature(this.eth_usd_id, false);
    // try adding provider4 after provider1 cancelled his signature
    await expect(
      this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider4.address, true),
    ).to.be.revertedWith("Duplicate signer or cancelled signature");
    // try adding provider4 using provider2 and provider3 signatures
    sigs0 = [p2_sig0, p3_sig0];
    this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider4.address, true);

    let timestamps = [this.timestamp + 2, this.timestamp + 2, this.timestamp + 2];
    let answers = [4000, 5000, 6000];
    round = await this.factory.latestRoundOfPricePair(this.eth_usd_id);

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
    let p4_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      answers[2],
      timestamps[2],
    ]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p4_sig = await this.provider4.signMessage(arrayify(p4_msgHash));

    let sigs = [p1_sig, p2_sig, p4_sig];
    // transmit provider4 signature
    await this.factory.connect(this.provider2).transmit(sigs, this.eth_usd_id, answers, timestamps);
    let [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(5000);
    expect(timestamp).to.equal(this.timestamp + 2);
    expect(status).to.equal(200);
  });

  it("should transmit and calculate median", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp + 1, this.timestamp + 1];

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

    let [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(timestamp).to.equal(this.timestamp + 1);
    expect(status).to.equal(200);

    // add one hour to timestamp
    await network.provider.send("evm_increaseTime", [3600]);
    this.timestamp += 3600;

    timestamps = [this.timestamp, this.timestamp];
    answers = [4000, 5000];
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

    [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4500);
    expect(timestamp).to.equal(this.timestamp);
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
    let p3tobe_sig = await this.provider3.signMessage(arrayify(p3tobe_msgHash));

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

    // provider1 and provider2 sign a message to add provider3
    let round = await this.factory.latestSignerModificationRound(this.eth_usd_id);
    let p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider3.address,
      true,
    ]);
    let p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider3.address,
      true,
    ]);

    let p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    let p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    let sigs0 = [p1_sig0, p2_sig0];

    // add provider3
    await this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider3.address, true);

    // now remove the provider3

    round = await this.factory.latestSignerModificationRound(this.eth_usd_id);

    p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider3.address,
      false,
    ]);
    p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider3.address,
      false,
    ]);

    p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    sigs0 = [p1_sig0, p2_sig0];

    // rm provider3
    await this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider3.address, false);

    // try removing more signers (provider2)
    round = await this.factory.latestSignerModificationRound(this.eth_usd_id);

    p1_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider2.address,
      false,
    ]);
    p2_mHash = ethers.utils.solidityKeccak256(modifySignersTypes, [
      this.eth_usd_id,
      Number(round) + 1,
      this.provider2.address,
      false,
    ]);

    p1_sig0 = await this.provider1.signMessage(arrayify(p1_mHash));
    p2_sig0 = await this.provider2.signMessage(arrayify(p2_mHash));
    sigs0 = [p1_sig0, p2_sig0];

    await expect(
      this.factory.connect(this.provider1).modifySigners(sigs0, this.eth_usd_id, this.provider2.address, false),
    ).to.be.revertedWith("Need >1 signers");
  });

  it("should revert stale/future timestamps", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];
    let timestamps = [this.timestamp, this.timestamp + 2];

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

    let [price, timestamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(timestamp).to.equal(this.timestamp + 1);
    expect(status).to.equal(200);

    answers = [4000, 5000];
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

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Stale timestamp");

    // increase timestamp
    this.timestamp += 100;
    timestamps = [this.timestamp + 1000, this.timestamp + 500];
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

    await expect(
      this.factory.connect(this.provider1).transmit(sigs, this.eth_usd_id, answers, timestamps),
    ).to.be.revertedWith("Future timestamp");
  });

  it("should batch transmit", async function () {
    const decimals = 3;
    let answers1 = [2000, 3000];
    let answers2 = [30000, 40000];
    let timestamps = [this.timestamp, this.timestamp];

    // deploy oracles
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.btc_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answers for both rounds
    let round_eth = await this.factory.latestRoundOfPricePair(this.eth_usd_id);
    let p1_eth_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round_eth) + 1,
      answers1[0],
      timestamps[0],
    ]);
    let p2_eth_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.eth_usd_id,
      Number(round_eth) + 1,
      answers1[1],
      timestamps[1],
    ]);
    let round_btc = await this.factory.latestRoundOfPricePair(this.btc_usd_id);
    let p1_btc_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.btc_usd_id,
      Number(round_btc) + 1,
      answers2[0],
      timestamps[0],
    ]);
    let p2_btc_msgHash = ethers.utils.solidityKeccak256(transmitTypes, [
      this.btc_usd_id,
      Number(round_btc) + 1,
      answers2[1],
      timestamps[1],
    ]);
    let p1_eth_sig = await this.provider1.signMessage(arrayify(p1_eth_msgHash));
    let p2_eth_sig = await this.provider2.signMessage(arrayify(p2_eth_msgHash));
    let p1_btc_sig = await this.provider1.signMessage(arrayify(p1_btc_msgHash));
    let p2_btc_sig = await this.provider2.signMessage(arrayify(p2_btc_msgHash));
    let sigs_eth = [p1_eth_sig, p2_eth_sig];
    let sigs_btc = [p1_btc_sig, p2_btc_sig];

    await this.factory
      .connect(this.provider1)
      .transmitBatch(
        [sigs_eth, sigs_btc],
        [this.eth_usd_id, this.btc_usd_id],
        [answers1, answers2],
        [timestamps, timestamps],
      );

    let [price_eth, timestamp_eth, status_eth] = await this.factory
      .connect(this.signers.admin)
      .valueFor(this.eth_usd_id);
    expect(price_eth).to.equal(2500);
    expect(timestamp_eth).to.equal(this.timestamp);
    expect(status_eth).to.equal(200);

    let [price_btc, timestamp_btc, status_btc] = await this.factory
      .connect(this.signers.admin)
      .valueFor(this.btc_usd_id);
    expect(price_btc).to.equal(35000);
    expect(timestamp_btc).to.equal(this.timestamp);
    expect(status_btc).to.equal(200);
  });
}
