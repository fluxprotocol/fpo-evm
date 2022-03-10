import { expect } from "chai";

export function shouldBehaveLikeFluxPriceFeedFactory(): void {
  it("should transmit arrays and return values", async function () {
    let [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(0);
    expect(timeStamp).to.equal(0);
    expect(status).to.equal(404);
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);

    [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    [price, timeStamp, status] = await this.factory.connect(this.signers.admin).valueFor(this.btc_usd_id);
    expect(price).to.equal(37600);
    expect(status).to.equal(200);
  });
  it("should overwrite values", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    let answers = [3000, 37600];
    await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
    let [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(3000);
    expect(status).to.equal(200);
    answers = [2500, 37000];
    await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
    [price, , status] = await this.factory.connect(this.signers.admin).valueFor(this.eth_usd_id);
    expect(price).to.equal(2500);
    expect(status).to.equal(200);
  });

  it("should revert if caller is not a validator", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    await expect(this.factory.connect(this.signers.nonadmin).transmit(pricePairs, decimals, answers)).to.be.reverted;
  });

  it("should revert if transmitted arrays aren't equal", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000];
    await expect(this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers)).to.be.revertedWith(
      "Transmitted arrays must be equal",
    );
  });

  it("should fetch adress of price pair", async function () {
    const pricePairs = [this.eth_usd_str, this.btc_usd_str];
    const decimals = [3, 3];
    const answers = [3000, 37600];
    const tx = await this.factory.connect(this.signers.admin).transmit(pricePairs, decimals, answers);
    const eth_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.eth_usd_id);
    const btc_usd_addr = await this.factory.connect(this.signers.admin).addressOfPricePair(this.btc_usd_id);

    const receipt = await tx.wait();
    const fluxPriceFeedCreatedEvents = receipt.events?.filter((x: { event: string }) => {
      return x.event == "FluxPriceFeedCreated";
    });
    const createdOraclesIds = [];
    const createdOraclesAddresses = [];
    for (let i = 0; i < fluxPriceFeedCreatedEvents.length; i++) {
      createdOraclesIds.push(fluxPriceFeedCreatedEvents[i].args["id"]);
      createdOraclesAddresses.push(fluxPriceFeedCreatedEvents[i].args["oracle"]);
    }
    expect(createdOraclesAddresses[0]).to.equal(eth_usd_addr);
    expect(createdOraclesAddresses[1]).to.equal(btc_usd_addr);
  });

  it("should return type and version", async function () {
    const typeAndVersion = await this.factory.connect(this.signers.admin).typeAndVersion();
    expect(typeAndVersion).to.equal("FluxPriceFeedFactory 1.2.0");
  });
}
