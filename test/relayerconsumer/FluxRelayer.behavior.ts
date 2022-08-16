import { expect } from "chai";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFluxRelayerFeedConsumer(): void {
  it("should let the relayer-consumer contract call latestAnswer()", async function () {
    await this.pricefeed.connect(this.signers.admin).transmit(TEST_VALUE);
    await this.relayerfeed.connect(this.signers.admin).transmit(TEST_VALUE);
    expect(await this.pricefeed.connect(this.signers.admin).latestAnswer()).to.equal(TEST_VALUE);
    expect(await this.relayerConsumer.connect(this.signers.admin).callStatic.getLatestPrice()).to.equal(TEST_VALUE);
  });

  it("should pause in case of deviation", async function () {
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
}
