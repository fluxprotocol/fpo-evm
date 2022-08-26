import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFluxRelayerFeedConsumer } from "./FluxRelayerOracle.behavior";
import { RelayerOracleConsumer } from "../../src/types/RelayerOracleConsumer";

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
      this.relayerfeed = <FluxPriceFeed>(
        await waffle.deployContract(this.signers.admin, pricefeedArtifact, [
          this.signers.admin.address,
          decimals,
          description,
        ])
      );
      const relayerConsumerArtifact: Artifact = await artifacts.readArtifact("RelayerOracleConsumer");
      this.relayerConsumer = <RelayerOracleConsumer>await waffle.deployContract(
        this.signers.admin,
        relayerConsumerArtifact,
        [
          this.pricefeed.address,
          this.relayerfeed.address,
          50, // deviationPercentage
          15 * 60, // maxDelay
        ],
      );
    });

    shouldBehaveLikeFluxRelayerFeedConsumer();
  });
});
