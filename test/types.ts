import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import type { FluxPriceFeed } from "../src/types/FluxPriceFeed";

export const TEST_VALUE = 12345;

declare module "mocha" {
  export interface Context {
    pricefeed: FluxPriceFeed;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  nonadmin: SignerWithAddress;
}
