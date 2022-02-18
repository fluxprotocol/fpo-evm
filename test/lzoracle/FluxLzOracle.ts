import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxLayerZeroOracle } from "../../src/types/FluxLayerZeroOracle";
import { Signers } from "../types";
import { shouldBehaveLikeFluxLayerZeroOracle } from "./FluxLzOracle.behavior";
import type { FluxPriceFeed } from "../../src/types/FluxPriceFeed";
import type { LayerZeroNetwork } from "../../src/types/LayerZeroNetwork";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];
    this.fpo;
    this.signers.lzn = signers[2];
  });

  describe("FluxLayerZeroOracle", function () {
    beforeEach(async function () {
      const decimals: number = 6;
      const description: string = "My description";
      const pricefeedArtifact: Artifact = await artifacts.readArtifact("FluxPriceFeed");
      this.fpo = <FluxPriceFeed>(
        await waffle.deployContract(this.signers.admin, pricefeedArtifact, [
          this.signers.admin.address,
          decimals,
          description,
        ])
      );

      const lzNetworkArtifact: Artifact = await artifacts.readArtifact("LayerZeroNetwork");
      this.lzNetwork = <LayerZeroNetwork>await waffle.deployContract(this.signers.admin, lzNetworkArtifact, []);

      const fluxLzOracleArtifact: Artifact = await artifacts.readArtifact("FluxLayerZeroOracle");
      this.fluxLzOracle = <FluxLayerZeroOracle>(
        await waffle.deployContract(this.signers.admin, fluxLzOracleArtifact, [
          this.signers.admin.address,
          this.signers.lzn.address,
        ])
      );
    });

    shouldBehaveLikeFluxLayerZeroOracle();
  });
});
