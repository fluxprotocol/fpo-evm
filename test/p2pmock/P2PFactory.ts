import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { FluxP2PFactory } from "../../src/types/FluxP2PFactory";
import { Signers } from "../types";
import { shouldBehaveLikeFluxP2PFactory } from "./P2PFactory.behavior";

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

    this.provider1 = signers[2];
    this.provider2 = signers[3];
  });

  describe("FluxP2PFactory", function () {
    beforeEach(async function () {
      const factoryArtifact: Artifact = await artifacts.readArtifact("FluxP2PFactory");
      this.factory = <FluxP2PFactory>(
        await waffle.deployContract(this.signers.admin, factoryArtifact, [this.provider1.address])
      );
    });
    shouldBehaveLikeFluxP2PFactory();
  });
});
