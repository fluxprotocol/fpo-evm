import { expect } from "chai";
import { TEST_VALUE } from "../types";

export function shouldBehaveLikeFluxPriceAggregator(): void {
  it("should aggregate latest prices from oracles using updatePricesUsingQuickSort", async function () {
    await this.oracles[0].connect(this.signers.admin).transmit(100);
    await this.oracles[1].connect(this.signers.admin).transmit(150);
    await this.oracles[2].connect(this.signers.admin).transmit(300);

    expect(await this.priceaggregator.connect(this.signers.admin).latestTimestamp()).to.equal(0);
    await this.priceaggregator.connect(this.signers.admin).updatePricesUsingQuickSort();
    expect(await this.priceaggregator.connect(this.signers.admin).latestAnswer()).to.equal(150);
    expect((await this.priceaggregator.connect(this.signers.admin).latestTimestamp()).toNumber()).to.greaterThan(0);
  });
  it("should aggregate latest prices from oracles using updatePricesUsingMedianOfMedians", async function () {
    await this.oracles[0].connect(this.signers.admin).transmit(100);
    await this.oracles[1].connect(this.signers.admin).transmit(150);
    await this.oracles[2].connect(this.signers.admin).transmit(300);

    expect(await this.priceaggregator.connect(this.signers.admin).latestTimestamp()).to.equal(0);
    await this.priceaggregator.connect(this.signers.admin).updatePricesUsingMedianOfMedians();
    expect(await this.priceaggregator.connect(this.signers.admin).latestAnswer()).to.equal(150);
    expect((await this.priceaggregator.connect(this.signers.admin).latestTimestamp()).toNumber()).to.greaterThan(0);
  });

  it("should count uninitialized prices as zero", async function () {
    await this.oracles[0].connect(this.signers.admin).transmit(100);
    await this.oracles[1].connect(this.signers.admin).transmit(75);
    // await this.priceaggregator.connect(this.signers.admin).updatePricesUsingMedianOfMedians();
    // expect(await this.priceaggregator.connect(this.signers.admin).latestAnswer()).to.equal(75);
    await this.priceaggregator.connect(this.signers.admin).updatePricesUsingQuickSort();
    expect(await this.priceaggregator.connect(this.signers.admin).latestAnswer()).to.equal(75);
  });

  it("should allow deployer to change delay", async function () {
    await this.priceaggregator.connect(this.signers.admin).setDelay(12345);
    expect(await this.priceaggregator.connect(this.signers.admin).minDelay()).to.equal(12345);
  });
  it("should allow deployer to change oracles", async function () {
    // check oracle addresses
    expect(await this.priceaggregator.connect(this.signers.admin).oracles(0)).to.equal(this.oracles[0].address);
    expect(await this.priceaggregator.connect(this.signers.admin).oracles(1)).to.equal(this.oracles[1].address);
    expect(await this.priceaggregator.connect(this.signers.admin).oracles(2)).to.equal(this.oracles[2].address);

    // remove 3rd oracle
    const newOracles: string[] = [this.oracles[0].address, this.oracles[1].address];
    await this.priceaggregator.connect(this.signers.admin).setOracles(newOracles);

    // check oracle addresses again
    expect(await this.priceaggregator.connect(this.signers.admin).oracles(0)).to.equal(this.oracles[0].address);
    expect(await this.priceaggregator.connect(this.signers.admin).oracles(1)).to.equal(this.oracles[1].address);
    try {
      // third oracle should not exist anymore
      expect(await this.priceaggregator.connect(this.signers.admin).oracles(2)).to.equal(this.oracles[2].address);
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).to.equal(`Transaction reverted without a reason string`);
      }
    }
  });
}
