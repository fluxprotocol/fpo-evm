export function shouldBehaveLikePriceFeedConsumer(): void {
  it("should compare gas price of fetching answer from FluxPriceFeed and FluxTimeBasedAggregator", async function () {
    let pricefeedConsumerAvgGas = 0;
    let aggregatorConsumerAvgGas = 0;
    const loops = 10;
    for (let i = 0; i < loops; i++) {
      pricefeedConsumerAvgGas = Number(
        (await this.pricefeedconsumer.connect(this.signers.admin).fetchLatestPrice()).gasPrice,
      );
      aggregatorConsumerAvgGas = Number(
        (await this.aggregatorconsumer.connect(this.signers.admin).fetchLatestPrice()).gasPrice,
      );
    }
    pricefeedConsumerAvgGas = Number(pricefeedConsumerAvgGas / loops);
    aggregatorConsumerAvgGas = Number(aggregatorConsumerAvgGas / loops);

    // console.log("price feed consumer fetchLatestPrice cost: ", pricefeedConsumerAvgGas);
    // console.log("aggregator consumer fetchLatestPrice cost: ", aggregatorConsumerAvgGas); // cheaper than price feed consumer
  });
}
