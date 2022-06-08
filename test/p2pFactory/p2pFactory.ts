import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Signers } from "../types";
import { shouldBehaveLikeFluxP2PFactory } from "./p2pFactory.behavior";
import type { FluxP2PFactory } from "../../src/types/FluxP2PFactory";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.owner = this.signers.admin.address;

    this.eth_usd_str = "ETH/USD";
    this.btc_usd_str = "BTC/USD";
    this.eth_usd_id = ethers.utils.solidityKeccak256(
      ["string", "string", "string", "address"],
      ["Price-", this.eth_usd_str, "-3-", this.owner],
    );

    this.btc_usd_id = ethers.utils.solidityKeccak256(
      ["string", "string", "string", "address"],
      ["Price-", this.btc_usd_str, "-3-", this.owner],
    );

    this.provider1 = signers[2];
    this.provider2 = signers[3];
    this.nonprovider = signers[4];
    this.provider3tobe = signers[5];
  });

  describe("FluxP2PFactoryV1", function () {
    beforeEach(async function () {
      const p2pFactoryArtifact: Artifact = await artifacts.readArtifact("FluxP2PFactory");
      this.factory = <FluxP2PFactory>await waffle.deployContract(this.signers.admin, p2pFactoryArtifact);
    });
    shouldBehaveLikeFluxP2PFactory();
  });
});
