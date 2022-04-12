/* eslint-disable @typescript-eslint/no-unused-vars */
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { FluxPriceFeedFactory } from "../../src/types/FluxPriceFeedFactory";
import { Signers } from "../types";
import { shouldBehaveLikeFluxPriceFeedFactory } from "./FluxPriceFeedFactory.behavior";
import { utils } from "ethers";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.provider1 = signers[2];
    this.provider2 = signers[3];
    let str = "Price-ETH/USD-3-";

    this.eth_usd_p1_id = utils.solidityKeccak256(["string", "address"], [str, this.provider1.address]);

    str = "Price-BTC/USD-3-";
    this.btc_usd_p1_id = utils.solidityKeccak256(["string", "address"], [str, this.provider1.address]);

    str = "Price-ETH/USD-3-";
    this.eth_usd_p2_id = utils.solidityKeccak256(["string", "address"], [str, this.provider2.address]);

    str = "Price-BTC/USD-3-";
    this.btc_usd_p2_id = utils.solidityKeccak256(["string", "address"], [str, this.provider2.address]);

    this.eth_usd_str = "ETH/USD";
    this.btc_usd_str = "BTC/USD";
  });

  describe("FluxPriceFeedFactory", function () {
    beforeEach(async function () {
      const factoryArtifact: Artifact = await artifacts.readArtifact("FluxPriceFeedFactory");
      this.factory = <FluxPriceFeedFactory>await waffle.deployContract(this.signers.admin, factoryArtifact, []);
    });
    shouldBehaveLikeFluxPriceFeedFactory();
  });
});
