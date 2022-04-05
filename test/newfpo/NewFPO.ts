/* eslint-disable @typescript-eslint/no-unused-vars */
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { NewFluxPriceFeedFactory } from "../../src/types/NewFluxPriceFeedFactory";
import { Signers } from "../types";
import { shouldBehaveLikeNewFluxPriceFeedFactory } from "./NewFPO.behavior";
import { getAddress } from "ethers/lib/utils";
import { utils } from "ethers";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.provider1 = signers[2];
    this.provider2 = signers[3];
    // let str = "Price-ETH/USD-3-"+getAddress(this.provider1.address);
    let str = "Price-ETH/USD-3-";

    // console.log("str: ", str);
    this.eth_usd_p1_id = utils.solidityKeccak256(["string", "address"], [str, this.provider1.address]);
    console.log("eth_usd_p1_id: ", this.eth_usd_p1_id);

    // this.eth_usd_p1_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    str = "Price-BTC/USD-3-";
    // this.btc_usd_p1_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    this.btc_usd_p1_id = utils.solidityKeccak256(["string", "address"], [str, this.provider1.address]);

    str = "Price-ETH/USD-3-";
    // this.eth_usd_p2_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    this.eth_usd_p2_id = utils.solidityKeccak256(["string", "address"], [str, this.provider2.address]);

    str = "Price-BTC/USD-3-";
    // this.btc_usd_p2_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(str));
    this.btc_usd_p2_id = utils.solidityKeccak256(["string", "address"], [str, this.provider2.address]);

    this.eth_usd_str = "ETH/USD";
    this.btc_usd_str = "BTC/USD";

    console.log("this.provider1 = ", this.provider1.address);
  });

  describe("NewFluxPriceFeedFactory", function () {
    beforeEach(async function () {
      const factoryArtifact: Artifact = await artifacts.readArtifact("NewFluxPriceFeedFactory");
      this.factory = <NewFluxPriceFeedFactory>await waffle.deployContract(this.signers.admin, factoryArtifact, []);
      console.log("fact", this.factory.address);
    });
    shouldBehaveLikeNewFluxPriceFeedFactory();
  });
});
