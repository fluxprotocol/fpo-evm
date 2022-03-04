import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxPriceFeedFactory } from "../../src/types/FluxPriceFeedFactory";
import { Signers } from "../types";
import { shouldBehaveLikeFluxPriceFeedFactory } from "./FluxPriceFeedFactory.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.eth_usd_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Price-ETH/USD-3"));
    this.btc_usd_id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Price-BTC/USD-3"));
    this.eth_usd_str = "ETH/USD";
    this.btc_usd_str = "BTC/USD";
  });

  describe("FluxPriceFeedFactory", function () {
    beforeEach(async function () {
      const factoryArtifact: Artifact = await artifacts.readArtifact("FluxPriceFeedFactory");
      this.factory = <FluxPriceFeedFactory>(
        await waffle.deployContract(this.signers.admin, factoryArtifact, [this.signers.admin.address])
      );
      // console.log("+validator = ", this.signers.admin.address);
      // const pricefeedconsumerArtifact: Artifact = await artifacts.readArtifact("ExamplePriceFeedConsumer");
      // this.pricefeedconsumer = <ExamplePriceFeedConsumer>(
      //   await waffle.deployContract(this.signers.admin, pricefeedconsumerArtifact, [this.factory.address])
      // );
    });

    shouldBehaveLikeFluxPriceFeedFactory();
  });
});
