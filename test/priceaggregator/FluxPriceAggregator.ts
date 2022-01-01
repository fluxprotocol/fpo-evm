import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxPriceAggregator } from "../../src/types/FluxPriceAggregator";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFluxPriceAggregator } from "./FluxPriceAggregator.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.oracles = [] as FluxPriceFeed[];
  });

  describe("FluxPriceAggregator", function () {
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
      const priceaggregatorArtifact: Artifact = await artifacts.readArtifact("FluxPriceAggregator");
      this.priceaggregator = <FluxPriceAggregator>(
        await waffle.deployContract(this.signers.admin, priceaggregatorArtifact, [
          this.signers.admin.address,
          [this.oracles[0].address, this.oracles[1].address, this.oracles[2].address],
          decimals,
          description,
        ])
      );
    });

    shouldBehaveLikeFluxPriceAggregator();
  });
});
