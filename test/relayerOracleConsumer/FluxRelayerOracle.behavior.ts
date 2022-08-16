import { expect } from "chai";
import { network } from "hardhat";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFluxRelayerFeedConsumer(): void {
  it("should let the relayer oracle consumer contract call latestAnswer()", async function () {
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    await this.relayerfeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.pricefeed.connect(this.signers.admin).latestAnswer()).to.equal(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
  });

  it("should revert in case of deviation", async function () {
    // expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(0);
    await this.relayerfeed.connect(this.signers.admin).transmit(TEST_VALUE);
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
    const deviatedValue = Math.floor(TEST_VALUE - 0.005 * TEST_VALUE);
    await this.pricefeed.connect(this.signers.admin).transmit(deviatedValue);
    await expect(this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.be.revertedWith(
      "Relayer/price feed deviation too large",
    );
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
  });

  it("should revert in case of no/old data", async function () {
    await expect(this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.be.revertedWith(
      "No/old data from price feed",
    );
    await this.relayerfeed.connect(this.signers.admin).transmit(TEST_VALUE);
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
    // 20 mins forward
    await network.provider.send("evm_increaseTime", [20 * 60]);
    await network.provider.send("evm_mine");
    // update the pricefeed without updating the relayer
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    await expect(this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.be.revertedWith(
      "No/old data from relayer",
    );
    await this.relayerfeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
  });
}
