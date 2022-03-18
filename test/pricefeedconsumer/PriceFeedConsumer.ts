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
      // deploy three oracles
      for (let i = 0; i < 3; i++) {
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

      // deploy aggregator
      const decimals: number = 6;
      const description: string = "My description";
      const timeBasedAggregatorArtifact: Artifact = await artifacts.readArtifact("FluxTimeBasedAggregator");
      this.timeBasedAggregator = <FluxTimeBasedAggregator>(
        await waffle.deployContract(this.signers.admin, timeBasedAggregatorArtifact, [
          this.oracles[1].address,
          this.oracles[2].address,
          decimals,
          description,
        ])
      );

      // deploy consumers
      const consumerArtifact: Artifact = await artifacts.readArtifact("ExamplePriceFeedConsumer");
      this.pricefeedconsumer = <ExamplePriceFeedConsumer>(
        await waffle.deployContract(this.signers.admin, consumerArtifact, [this.oracles[0].address])
      );
      this.aggregatorconsumer = <ExamplePriceFeedConsumer>(
        await waffle.deployContract(this.signers.admin, consumerArtifact, [this.timeBasedAggregator.address])
      );

      // submit initial prices
      await this.oracles[0].connect(this.signers.admin).transmit(100);
      await this.oracles[1].connect(this.signers.admin).transmit(100);
      await this.oracles[2].connect(this.signers.admin).transmit(100);
    });

    shouldBehaveLikePriceFeedConsumer();
  });
});
