import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { ExamplePriceFeedConsumer } from "../../src/types/ExamplePriceFeedConsumer";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import type { FluxTimeBasedAggregator } from "../../src/types/FluxTimeBasedAggregator";

import { Signers } from "../types";
import { shouldBehaveLikePriceFeedConsumer } from "./PriceFeedConsumer.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.oracles = [] as FluxPriceFeed[];
  });

  describe("ExamplePriceFeedConsumer", function () {
    beforeEach(async function () {
      // deploy two oracles
      for (let i = 0; i < 2; i++) {
        const decimals: number = 6;
        const description: string = "My description";
        const pricefeedArtifact: Artifact = await artifacts.readArtifact("FluxPriceFeed");
        this.oracles[i] = <FluxPriceFeed>(
          await waffle.deployContract(this.signers.admin, pricefeedArtifact, [
            this.signers.admin.address,
            decimals,
            description,
          ])
        );
      }
      console.log("oracle1 address = ", this.oracles[0].address);
      console.log("oracle2 address = ", this.oracles[1].address);

      // deploy aggregator
      const decimals: number = 6;
      const description: string = "My description";
      const timeBasedAggregatorArtifact: Artifact = await artifacts.readArtifact("FluxTimeBasedAggregator");
      this.timeBasedAggregator = <FluxTimeBasedAggregator>(
        await waffle.deployContract(this.signers.admin, timeBasedAggregatorArtifact, [
          this.oracles[0].address,
          this.oracles[1].address,
          decimals,
          description,
        ])
      );
      console.log("time-based aggregator address = ", this.timeBasedAggregator.address);

      const consumerArtifact: Artifact = await artifacts.readArtifact("ExamplePriceFeedConsumer");
      this.pricefeedconsumer = <ExamplePriceFeedConsumer>(
        await waffle.deployContract(this.signers.admin, consumerArtifact, [this.oracles[0].address])
      );
      console.log("pricefeed-consumer address = ", this.pricefeedconsumer.address);

      this.aggregatorconsumer = <ExamplePriceFeedConsumer>(
        await waffle.deployContract(this.signers.admin, consumerArtifact, [this.timeBasedAggregator.address])
      );
      console.log("aggregator-consumer address = ", this.aggregatorconsumer.address);
    });

    shouldBehaveLikePriceFeedConsumer();
  });
});
