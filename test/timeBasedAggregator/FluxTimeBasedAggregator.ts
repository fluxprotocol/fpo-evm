import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxTimeBasedAggregator } from "../../src/types/FluxTimeBasedAggregator";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFluxTimeBasedAggregator } from "./FluxTimeBasedAggregator.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.oracles = [] as FluxPriceFeed[];
  });

  describe("FluxTimeBasedAggregator", function () {
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
      // console.log("time based aggreg address = ", this.timeBasedAggregator)
    });

    shouldBehaveLikeFluxTimeBasedAggregator();
  });
});
