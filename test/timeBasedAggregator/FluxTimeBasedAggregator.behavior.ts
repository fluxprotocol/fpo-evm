import { expect } from "chai";

import { ethers } from "hardhat";

export function shouldBehaveLikeFluxTimeBasedAggregator(): void {
  it("should fetch correct latest answer", async function () {
    await this.oracles[0].connect(this.signers.admin).transmit(100);
    await this.oracles[1].connect(this.signers.admin).transmit(150);

    expect(await this.timeBasedAggregator.connect(this.signers.admin)["latestAnswer()"]()).to.equal(100);
    expect(await this.timeBasedAggregator.connect(this.signers.admin)["latestAnswer(uint256)"](5)).to.equal(100);
    expect((await this.timeBasedAggregator.connect(this.signers.admin).latestTimestamp()).toNumber()).to.equal(
      await this.oracles[0].connect(this.signers.admin).latestTimestamp(),
    );
    const sevenDays = 7 * 24 * 60 * 60;

    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;

    await ethers.provider.send("evm_increaseTime", [sevenDays]);
    await ethers.provider.send("evm_mine", []);

    const blockNumAfter = await ethers.provider.getBlockNumber();
    const blockAfter = await ethers.provider.getBlock(blockNumAfter);
    const timestampAfter = blockAfter.timestamp;

    expect(blockNumAfter).to.equal(blockNumBefore + 1);
    expect(timestampAfter).to.equal(timestampBefore + sevenDays);

    expect(await this.timeBasedAggregator.connect(this.signers.admin)["latestAnswer()"]()).to.equal(150);
    expect(await this.timeBasedAggregator.connect(this.signers.admin)["latestAnswer(uint256)"](5)).to.equal(150);
    expect((await this.timeBasedAggregator.connect(this.signers.admin).latestTimestamp()).toNumber()).to.equal(
      await this.oracles[1].connect(this.signers.admin).latestTimestamp(),
    );
  });
}
