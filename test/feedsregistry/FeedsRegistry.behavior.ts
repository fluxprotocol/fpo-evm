import { expect } from "chai";
import { BigNumber } from "ethers";
import { int } from "hardhat/internal/core/params/argumentTypes";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFeedsRegistry(): void {
  it("should fetch price from usdFeed correctly", async function () {
    await this.oracles[0].connect(this.signers.admin).transmit(2760 * 10 ** 8); // 1 ETH = 2760 USD
    await this.feedsregistry.connect(this.signers.admin).addUsdFeed(this.eth, this.oracles[0].address);
    expect(await this.feedsregistry.connect(this.signers.admin).getPriceFromSymbol("ETH")).to.equal(2760 * 10 ** 8);
  });

  it("should multiply prices from TOKEN/ETH and ETH/USD feeds", async function () {
    const transmitAmount = (0.00025259 * 10 ** 20) / 100; // 0.00025259 * (10**18)
    // console.log("transmitAmount = ", transmitAmount)
    await this.oracles[2].connect(this.signers.admin).transmit(transmitAmount); // 1 FLX = 0.00025259 ETH ( =~ 0.7 USD)
    await this.feedsregistry.connect(this.signers.admin).addEthFeed(this.flx, this.oracles[2].address);
    // console.log(Number(await this.oracles[2].connect(this.signers.admin).latestAnswer()));
    // console.log(Number(await this.feedsregistry.connect(this.signers.admin).getPriceFromSymbol("FLX")));
    expect(await this.feedsregistry.connect(this.signers.admin).getPriceFromSymbol("FLX")).to.equal(
      2760 * 0.00025259 * 10 ** 8,
    );
  });

  it("should revert in case of no found feeds", async function () {
    await expect(this.feedsregistry.connect(this.signers.admin).getPriceFromSymbol("DAI")).to.be.revertedWith(
      "Couldn't find feeds",
    );
  });
}
