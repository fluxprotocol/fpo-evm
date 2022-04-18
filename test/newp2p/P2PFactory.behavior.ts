/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { ethers } from "hardhat";
// import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";

export function shouldBehaveLikeFluxP2PFactory(): void {
  it("should transmit and calculate median", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);

    answers = [4000, 5000];
    p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4500);
    expect(status).to.equal(200);
  });

  it("should revert if signer isn't a validator", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p1_sig = await this.nonprovider.signMessage(arrayify(p1_msgHash));
    let sigs = [p1_sig];
    // First deploying signatures are the validators of the initially deployed oracle
    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    answers = [3000, 4000];
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];
    // p2 cannot transmit
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("should revert if answers aren't valid", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.nonprovider.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);
    let invalid_answers = [4000, 4000];
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, invalid_answers),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("should revert if transmitted arrays aren't equal", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);

    let sigs_slice = [sigs[0]];
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs_slice, pricePair, decimals, answers),
    ).to.be.revertedWith("Number of answers must match signatures");
  });

  it("should fetch adress of price pair", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let tx = await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    console.log("eth_usd_addr", eth_usd_addr);
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
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.factory.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.0.0");
  });

  it("should transmit providers with diff orders", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [2000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    // let sigs = [p1_sig, p2_sig];
    let sigs = [p2_sig, p1_sig];

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("should let admin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "int192"],
      [pricePair, decimals, answers[2]],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    answers = [3000, 4000];
    this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    sigs = [p1_sig, p2_sig, p3tobe_sig];
    answers = [3000, 4000, 5000];

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers),
    ).to.be.revertedWith("Signer must be a validator");

    let signerRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SIGNER_ROLE"));

    // const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    // const priceFeedContract = await ethers.getContractAt("FluxPriceFeed", eth_usd_addr);
    // await priceFeedContract.connect(this.signers.admin).grantRole(signerRole, this.provider3tobe.address);
    await this.factory.connect(this.signers.admin).addSigner(this.eth_usd_id, this.provider3tobe.address);
    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4000);
    expect(status).to.equal(200);
  });

  it("doesn't let nonadmin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "int192"],
      [pricePair, decimals, answers[2]],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    answers = [3000, 4000];
    this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    sigs = [p1_sig, p2_sig, p3tobe_sig];
    answers = [3000, 4000, 5000];

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers),
    ).to.be.revertedWith("Signer must be a validator");

    // let validatorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));

    // const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    // console.log("eth_usd_addr", eth_usd_addr);
    // const priceFeedContract = await ethers.getContractAt("FluxPriceFeed", eth_usd_addr);

    await expect(this.factory.connect(this.signers.nonadmin).addSigner(this.eth_usd_id, this.provider3tobe.address)).to
      .be.reverted;
  });

  it("should let admin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let tx = await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    console.log("eth_usd_addr", eth_usd_addr);

    // let signerRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SIGNER_ROLE"));

    // const priceFeedContract = await ethers.getContractAt("FluxPriceFeed", eth_usd_addr);

    await this.factory.connect(this.signers.admin).revokeSigner(this.eth_usd_id, this.provider2.address);

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("doesn't let nonadmin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[0]]);
    let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answers[1]]);
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let tx = await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answers);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    console.log("eth_usd_addr", eth_usd_addr);

    // let validatorRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));

    // const priceFeedContract = await ethers.getContractAt("FluxPriceFeed", eth_usd_addr);

    await expect(this.factory.connect(this.signers.nonadmin).revokeRole(this.eth_usd_id, this.provider2.address)).to.be
      .reverted;
  });
}
