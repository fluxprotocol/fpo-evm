/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";
import { ethers } from "hardhat";

export function shouldBehaveLikeFluxP2PFactory(): void {
  it("should transmit median and overwrite value", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);

    answer = 4000;
    msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
    p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    sigs = [p1_sig, p2_sig];

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4000);
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
    ).to.be.revertedWith("Oracle already deployed");
  });

  it("should revert if signer isn't a validator", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p3tobe_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));

    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let sigs = [p1_sig, p2_sig, p3tobe_sig];
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("should revert if answer aren't valid", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.nonprovider.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let invalid_answer = 4000;
    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, invalid_answer),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("should revert if it received only one signature", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
    let p1_sig = await this.nonprovider.signMessage(arrayify(msgHash));
    let sigs = [p1_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer),
    ).to.be.revertedWith("Needs at least 2 signatures");
  });

  it("should fetch adress of price pair", async function () {
    const decimals = 3;

    let tx = await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
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
    let answer = 2000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    // let sigs = [p1_sig, p2_sig];
    let sigs = [p2_sig, p1_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(2000);
    expect(status).to.equal(200);
  });

  it("should let admin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p3tobe_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer),
    ).to.be.revertedWith("Signer must be a validator");

    await this.factory.connect(this.signers.admin).addSigner(this.eth_usd_id, this.provider3tobe.address);
    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("doesn't let nonadmin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p3tobe_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer),
    ).to.be.revertedWith("Signer must be a validator");

    await expect(this.factory.connect(this.signers.nonadmin).addSigner(this.eth_usd_id, this.provider3tobe.address)).to
      .be.reverted;
  });

  it("should let admin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    await this.factory.connect(this.signers.admin).revokeSigner(this.eth_usd_id, this.provider2.address);

    await expect(
      this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer),
    ).to.be.revertedWith("Signer must be a validator");
  });

  it("doesn't let nonadmin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

    await expect(this.factory.connect(this.signers.nonadmin).revokeRole(this.eth_usd_id, this.provider2.address)).to.be
      .reverted;
  });

  it("should let admin transfer ownership to a new admin", async function () {
    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer by provider1 and provider2
    let msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);

    let p1_sig = await this.provider1.signMessage(arrayify(msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.factory
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.factory.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);
    await this.factory.connect(this.signers.admin).transferOwner(this.eth_usd_id, this.provider3tobe.address);

    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const PriceFeedContract = await ethers.getContractFactory("FluxPriceFeed");
    const pricefeed = await PriceFeedContract.attach(eth_usd_addr);
    await pricefeed.connect(this.provider3tobe).grantRole(VALIDATOR_ROLE, this.provider3tobe.address);
    await pricefeed.connect(this.provider3tobe).transmit(answer);

    let latestAnswer = await pricefeed.connect(this.provider3tobe).latestAnswer();
    expect(latestAnswer).to.equal(answer);
  });
}
