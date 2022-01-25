import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FeedsRegistry } from "../../src/types/FeedsRegistry";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import { Signers } from "../types";
import { shouldBehaveLikeFeedsRegistry } from "./FeedsRegistry.behavior";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.oracles = [] as FluxPriceFeed[];

    this.usd = "0x5553440000000000000000000000000000000000000000000000000000000000";
  });

  describe("FeedsRegistry", function () {
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

      // deploy feeds registry
      const frArtifact: Artifact = await artifacts.readArtifact("FeedsRegistry");
      this.feedsregistry = <FeedsRegistry>(
        await waffle.deployContract(this.signers.admin, frArtifact, [this.signers.admin.address])
      );
    });

    shouldBehaveLikeFeedsRegistry();
  });
});
