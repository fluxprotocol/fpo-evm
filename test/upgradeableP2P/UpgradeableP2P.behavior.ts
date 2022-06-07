/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { arrayify } from "@ethersproject/bytes";
import { expect } from "chai";
import { keccak256 } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";

export function shouldBehaveLikeUpgradeableFluxP2PFactory(): void {
  // testing upgrades: duplicate FluxP2PFactory contract to FluxP2PFactoryV2 and change typeAndVersion to 2.0.0
  // it("should upgrade proxy and keep oracles", async function () {
  //   const decimals = 3;
  //   await this.proxy
  //     .connect(this.signers.admin)
  //     .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

  //   await expect(
  //     this.proxy
  //       .connect(this.signers.admin)
  //       .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]),
  //   ).to.be.revertedWith("Oracle already deployed");

  //   const pricePair = this.eth_usd_str;
  //   let answer = 3000;

  //   // sign answer 0 by provider1 and answer 1 by provider2
  //   let p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
  //   let p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
  //   let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
  //   let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
  //   let sigs = [p1_sig, p2_sig];

  //   await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

  //   let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(3000);
  //   expect(status).to.equal(200);

  //   // answer = [4000, 5000];
  //   p1_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
  //   p2_msgHash = ethers.utils.solidityKeccak256(["string", "uint8", "int192"], [pricePair, decimals, answer]);
  //   p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
  //   p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
  //   sigs = [p1_sig, p2_sig];

  //   await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, answer);

  //   [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(3000);
  //   expect(status).to.equal(200);

  //   let typeAndVersion = await this.proxy.connect(this.signers.admin).typeAndVersion();
  //   expect(typeAndVersion).to.equal("FluxP2PFactory 1.0.0");

  //   // upgrade proxy
  //   const p2pFactory_v2 = await ethers.getContractFactory("FluxP2PFactoryV2");
  //   const upgradedProxy = await upgrades.upgradeProxy(this.proxy, p2pFactory_v2);
  //   const implementationAddress = await upgrades.erc1967.getImplementationAddress(upgradedProxy.address);
  //   // console.log("new implementationAddress: ", implementationAddress);

  //   typeAndVersion = await upgradedProxy.connect(this.signers.admin).typeAndVersion();
  //   expect(typeAndVersion).to.equal("FluxP2PFactory 2.0.0");

  //   await expect(
  //     upgradedProxy
  //       .connect(this.signers.admin)
  //       .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]),
  //   ).to.be.revertedWith("Oracle already deployed");

  //   [price, , status] = await upgradedProxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
  //   expect(price).to.equal(3000);
  //   expect(status).to.equal(200);
  // });

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
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3500);
    expect(status).to.equal(200);

    answers = [4000, 5000];
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

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
    ).to.be.revertedWith("Already deployed");
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
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[2]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));

    let sigs = [p1_sig, p2_sig, p3tobe_sig];
    answers = [3000, 4000, 5000];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Invalid signature");
  });

  it("should revert if answers aren't valid", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.nonprovider.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    let invalid_answers = [4000, 4000];
    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, invalid_answers),
    ).to.be.revertedWith("Invalid signature");
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
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let sigs = [p1_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Too few signatures");

    // lower the threshold
    await this.proxy.connect(this.signers.admin).setMinSigners(this.eth_usd_id, 1);

    // should work now
    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);
  });

  it("should fetch adress of price pair", async function () {
    const decimals = 3;

    let tx = await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    const eth_usd_addr = await this.proxy.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
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

  it("should fetch latest roundId of price pair", async function () {
    const decimals = 3;
    const pricePair = this.eth_usd_str;
    let answers = [3000, 4000];

    let tx = await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    const latestId = await this.proxy.connect(this.signers.admin).latestRoundOfPricePair(this.eth_usd_id);

    expect(latestId).to.equal(1);
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.proxy.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.0.0");
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
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    // let sigs = [p1_sig, p2_sig];
    let sigs = [p2_sig, p1_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("should let admin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[2]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    answers = [3000, 4000];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    // format signatures for new round
    answers = [3000, 4000, 5000];
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[2]],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Invalid signature");

    await this.proxy.connect(this.signers.admin).addSigner(this.eth_usd_id, this.provider3tobe.address);
    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4000);
    expect(status).to.equal(200);
  });

  it("doesn't let nonadmin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000, 5000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[2]],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    answers = [3000, 4000];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    // format signatures for new round
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    answers = [3000, 4000, 5000];
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[2]],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Invalid signature");

    await expect(this.proxy.connect(this.signers.nonadmin).addSigner(this.eth_usd_id, this.provider3tobe.address)).to.be
      .reverted;
  });

  it("should let admin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    await this.proxy.connect(this.signers.admin).revokeSigner(this.eth_usd_id, this.provider2.address);

    // format signatures for new round
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Invalid signature");
  });

  it("doesn't let nonadmin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    await expect(this.proxy.connect(this.signers.nonadmin).revokeRole(this.eth_usd_id, this.provider2.address)).to.be
      .reverted;
  });

  it("should let admin transfer ownership to a new admin", async function () {
    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);
    await this.proxy.connect(this.signers.admin).transferOwner(this.eth_usd_id, this.provider3tobe.address);

    const eth_usd_addr = await this.proxy.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const PriceFeedContract = await ethers.getContractFactory("FluxPriceFeed");
    const pricefeed = await PriceFeedContract.attach(eth_usd_addr);
    await pricefeed.connect(this.provider3tobe).grantRole(VALIDATOR_ROLE, this.provider3tobe.address);
    await pricefeed.connect(this.provider3tobe).transmit(answers[0]);

    let latestAnswer = await pricefeed.connect(this.provider3tobe).latestAnswer();
    expect(latestAnswer).to.equal(answers[0]);
  });

  it("should only allow answers to be transmitted in order", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [4000, 3000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Not sorted");
  });

  it("should disallow multiple signatures from the same signer", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p1_2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p1_2_sig = await this.provider1.signMessage(arrayify(p1_2_msgHash));
    let sigs = [p1_sig, p1_2_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Duplicate signature");
  });

  it("will have providers be unable to sign current round after failed transmission", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answers = [3000, 4000];

    // deploy oracle
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    const PriceFeedContract = await ethers.getContractFactory("FluxPriceFeed");
    const eth_usd_addr = await this.proxy.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const pricefeed = PriceFeedContract.attach(eth_usd_addr);
    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    // transfer price feed owner to admin
    await this.proxy.connect(this.signers.admin).transferOwner(this.eth_usd_id, this.signers.admin.address);
    // increment price feed round by successfully transmitting an answer
    // so that duplicate signature will be checked
    await pricefeed.connect(this.signers.admin).grantRole(VALIDATOR_ROLE, this.signers.admin.address);
    await pricefeed.connect(this.signers.admin).transmit(1);
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    // step 1: revoke proxy's VALIDATOR_ROLE from price feed
    await pricefeed.connect(this.signers.admin).revokeRole(VALIDATOR_ROLE, this.proxy.address);
    // step 2: attempt transmission, will not revert but price feed would not have updated
    // await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);
    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    ).to.be.revertedWith("Transmit Failed");

    // same round
    expect(await this.proxy.latestRoundOfPricePair(this.eth_usd_id)).to.be.eq(Number(round));
    // step 3: re-grant proxy VALIDATOR_ROLE, re-attempt transmission
    // will revert
    await pricefeed.connect(this.signers.admin).grantRole(VALIDATOR_ROLE, this.proxy.address);
    // await expect(
    //   this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers),
    // ).to.be.revertedWith("Duplicate signature");
    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);
    let latestAnswer = await pricefeed.connect(this.signers.admin).latestAnswer();
    expect(latestAnswer).to.equal(3500);
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

    // sign answer 0 by provider1 and answer 1 by provider2
    let round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(status).to.equal(404);

    answers = [4000, 5000];
    round = await this.proxy.latestRoundOfPricePair(this.eth_usd_id);

    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[0]],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint32", "int192"],
      [pricePair, decimals, Number(round) + 1, answers[1]],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, Number(round) + 1, answers);

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(4500);
    expect(status).to.equal(200);
  });
}
