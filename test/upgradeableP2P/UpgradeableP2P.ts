import { ethers, upgrades } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { Signers } from "../types";
import { shouldBehaveLikeUpgradeableFluxP2PFactory } from "./UpgradeableP2P.behavior";
import { FluxP2PFactory__factory } from "../../src/types/factories/FluxP2PFactory__factory";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.nonadmin = signers[1];

    this.eth_usd_str = "ETH/USD";
    this.btc_usd_str = "BTC/USD";
    this.eth_usd_id = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`Price-${this.eth_usd_str}-3-${this.signers.admin.address.toLowerCase()}`),
    );
    this.btc_usd_id = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`Price-${this.btc_usd_str}-3-${this.signers.admin.address.toLowerCase()}`),
    );

    this.provider1 = signers[2];
    this.provider2 = signers[3];
    this.nonprovider = signers[4];
    this.provider3tobe = signers[5];
  });

  describe("UpgradeableFluxP2PFactoryV1", function () {
    beforeEach(async function () {
      const p2pFactory: FluxP2PFactory__factory = <FluxP2PFactory__factory>(
        await ethers.getContractFactory("FluxP2PFactory")
      );

      this.proxy = await upgrades.deployProxy(p2pFactory);
      await this.proxy.deployed();
      // console.log("proxy deployed to:", this.proxy.address);

      // const implementationAddress = await upgrades.erc1967.getImplementationAddress(this.proxy.address);
      // console.log("implementationAddress: ", implementationAddress); // p2pFactory address
    });
    shouldBehaveLikeUpgradeableFluxP2PFactory();
  });
});
