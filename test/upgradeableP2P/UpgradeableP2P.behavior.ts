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
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);
    let round;
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);

    // answer = [4000, 5000];
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 1, answer);

    [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
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
    ).to.be.revertedWith("Oracle already deployed");
  });

  it("should revert if signer isn't a validator", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));

    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let sigs = [p1_sig, p2_sig, p3tobe_sig];
    answer = 3000;

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer),
    ).to.be.revertedWith("Invalid signed message");
  });

  it("should revert if answer aren't valid", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.nonprovider.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    let invalid_answer = 4000;
    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, invalid_answer),
    ).to.be.revertedWith("Invalid signed message");
  });

  it("should revert if it received only one signature", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.nonprovider.signMessage(arrayify(p1_msgHash));
    let sigs = [p1_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer),
    ).to.be.revertedWith("Needs at least 2 signatures");
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

  it("should return type and version", async function () {
    const typeAndVersion = await this.proxy.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxP2PFactory 1.0.0");
  });

  it("should transmit providers with diff orders", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 2000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    // let sigs = [p1_sig, p2_sig];
    let sigs = [p2_sig, p1_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(2000);
    expect(status).to.equal(200);
  });

  it("should let admin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    // answer = 3000;
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    // format signatures for new round
    answer = 3000;
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 1, answer),
    ).to.be.revertedWith("Invalid signed message");

    await this.proxy.connect(this.signers.admin).addSigner(this.eth_usd_id, this.provider3tobe.address);
    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 1, answer);

    let [price, , status] = await this.proxy.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
  });

  it("doesn't let nonadmin add providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );

    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    let sigs = [p1_sig, p2_sig];
    answer = 3000;
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    // format signatures for new round
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p3tobe_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    p3tobe_sig = await this.provider3tobe.signMessage(arrayify(p3tobe_msgHash));
    sigs = [p1_sig, p2_sig, p3tobe_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 1, answer),
    ).to.be.revertedWith("Invalid signed message");

    await expect(this.proxy.connect(this.signers.nonadmin).addSigner(this.eth_usd_id, this.provider3tobe.address)).to.be
      .reverted;
  });

  it("should let admin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    await this.proxy.connect(this.signers.admin).revokeSigner(this.eth_usd_id, this.provider2.address);

    // format signatures for new round
    p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 1, answer],
    );
    p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    sigs = [p1_sig, p2_sig];

    await expect(
      this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 1, answer),
    ).to.be.revertedWith("Invalid signed message");
  });

  it("doesn't let nonadmin remove providers", async function () {
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);

    await expect(this.proxy.connect(this.signers.nonadmin).revokeRole(this.eth_usd_id, this.provider2.address)).to.be
      .reverted;
  });

  it("should let admin transfer ownership to a new admin", async function () {
    const VALIDATOR_ROLE = keccak256(ethers.utils.toUtf8Bytes("VALIDATOR_ROLE"));
    const pricePair = this.eth_usd_str;
    const decimals = 3;
    let answer = 3000;

    // sign answer 0 by provider1 and answer 1 by provider2
    let p1_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p2_msgHash = ethers.utils.solidityKeccak256(
      ["string", "uint8", "uint80", "int192"],
      [pricePair, decimals, 0, answer],
    );
    let p1_sig = await this.provider1.signMessage(arrayify(p1_msgHash));
    let p2_sig = await this.provider2.signMessage(arrayify(p2_msgHash));
    let sigs = [p1_sig, p2_sig];
    await this.proxy
      .connect(this.signers.admin)
      .deployOracle(this.eth_usd_str, decimals, [this.provider1.address, this.provider2.address]);

    await this.proxy.connect(this.signers.admin).transmit(sigs, pricePair, decimals, 0, answer);
    await this.proxy.connect(this.signers.admin).transferOwner(this.eth_usd_id, this.provider3tobe.address);

    const eth_usd_addr = await this.proxy.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const PriceFeedContract = await ethers.getContractFactory("FluxPriceFeed");
    const pricefeed = await PriceFeedContract.attach(eth_usd_addr);
    await pricefeed.connect(this.provider3tobe).grantRole(VALIDATOR_ROLE, this.provider3tobe.address);
    await pricefeed.connect(this.provider3tobe).transmit(answer);

    let latestAnswer = await pricefeed.connect(this.provider3tobe).latestAnswer();
    expect(latestAnswer).to.equal(answer);
  });
}
