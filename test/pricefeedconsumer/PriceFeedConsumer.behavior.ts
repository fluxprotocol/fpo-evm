/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// import { expect } from "chai";

// import { ethers } from "hardhat";

export function shouldBehaveLikePriceFeedConsumer(): void {
  it("should fetch correct latest answer", async function () {
    let tx1 = await this.oracles[0].connect(this.signers.admin).transmit(100);
    let tx2 = await this.oracles[1].connect(this.signers.admin).transmit(150);

    tx1 = await this.pricefeedconsumer.connect(this.signers.admin).fetchLatestPrice();
    tx2 = await this.aggregatorconsumer.connect(this.signers.admin).fetchLatestPrice();
    // let tx3 = await this.timeBasedAggregator.connect(this.signers.admin)["latestAnswer()"]();
    // let tx4 = await this.oracles[0].connect(this.signers.admin)["latestAnswer()"]()

    console.log("price feed consumer fetchLatestPrice cost: ", Number(tx1.gasPrice));
    console.log("aggregator consumer fetchLatestPrice cost: ", Number(tx2.gasPrice));
  });
}
