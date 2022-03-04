import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxMultiPriceFeed } from "../../src/types/FluxMultiPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFluxMultiPriceFeed } from "./MultiPriceFeed.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.eth_usd = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Price-ETH/USD-3"));
    this.btc_usd = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Price-BTC/USD-3"));

    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];
  });

  describe("FluxMultiPriceFeed", function () {
    beforeEach(async function () {
      const multiPricefeedArtifact: Artifact = await artifacts.readArtifact("FluxMultiPriceFeed");
      this.multiPriceFeed = <FluxMultiPriceFeed>(
        await waffle.deployContract(this.signers.admin, multiPricefeedArtifact, [this.signers.admin.address])
      );
      // const pricefeedconsumerArtifact: Artifact = await artifacts.readArtifact("ExamplePriceFeedConsumer");
      // this.pricefeedconsumer = <ExamplePriceFeedConsumer>(
      //   await waffle.deployContract(this.signers.admin, pricefeedconsumerArtifact, [this.multiPriceFeed.address])
      // );
    });

    shouldBehaveLikeFluxMultiPriceFeed();
  });
});
