import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFluxPriceFeed } from "./FluxPriceFeed.behavior";
import { ExamplePriceFeedConsumer } from "../../src/types/ExamplePriceFeedConsumer";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];
  });

  describe("FluxPriceFeed", function () {
    beforeEach(async function () {
      const decimals: number = 6;
      const description: string = "My description";
      const pricefeedArtifact: Artifact = await artifacts.readArtifact("FluxPriceFeed");
      this.pricefeed = <FluxPriceFeed>(
        await waffle.deployContract(this.signers.admin, pricefeedArtifact, [
          this.signers.admin.address,
          decimals,
          description,
        ])
      );
      const pricefeedconsumerArtifact: Artifact = await artifacts.readArtifact("ExamplePriceFeedConsumer");
      this.pricefeedconsumer = <ExamplePriceFeedConsumer>(
        await waffle.deployContract(this.signers.admin, pricefeedconsumerArtifact, [this.pricefeed.address])
      );
    });

    shouldBehaveLikeFluxPriceFeed();
  });
});
