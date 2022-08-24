/* eslint-disable @typescript-eslint/no-unused-vars */
// main: 0x5d5d3493172Edec1748810287258c2eD09ad74A1
// relayer: 0x380A59AA2B6fb501750669fb50B5137b9107B06d

import { task } from "hardhat/config";
// npx hardhat fetchDeviation --network aurora-testnet --main 0x5d5d3493172Edec1748810287258c2eD09ad74A1 --relayer 0x380A59AA2B6fb501750669fb50B5137b9107B06d --roundIds 2
task("fetchDeviation", "Fetches the deviation for a given number of rounds")
  .addParam("main", "The main pricefeed contract address")
  .addParam("relayer", "The relayer contract address")
  .addParam("rounds", "Number of rounds we wanna fetch deviation for")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract1 = await FluxPriceFeed.attach(_taskArgs.main);
    const contract2 = await FluxPriceFeed.attach(_taskArgs.relayer);

    const decimals1 = await contract1.decimals();
    const decimals2 = await contract2.decimals();

    const lastRoundId1 = await contract1.latestRound();
    const lastRoundId2 = await contract2.latestRound();
    console.log(`main-feed last round = ${lastRoundId1}, relayer-feed last round = ${lastRoundId2}`);
    let index = 0;
    for (let i = Number(_taskArgs.rounds) - 1; i >= 0; i--) {
      index++;
      console.log(`Iteration #${index}`);
      if (lastRoundId1 - i <= 0 || lastRoundId2 - i <= 0) {
        console.log("   Not enough rounds -- fetching less rounds");
        continue;
      }
      const answer1 = await contract1.getAnswer(lastRoundId1 - i);
      const timestamp1 = await contract1.getTimestamp(lastRoundId1 - i);
      const formattedAnswer1 = answer1.toString() / 10 ** decimals1;
      const formattedTimestamp1 = new Date(timestamp1.toNumber() * 1000);

      const answer2 = await contract2.getAnswer(lastRoundId2 - i);
      const timestamp2 = await contract2.getTimestamp(lastRoundId2 - i);
      const formattedAnswer2 = answer2.toString() / 10 ** decimals2;
      const formattedTimestamp2 = new Date(timestamp2.toNumber() * 1000);

      console.log(
        `   main-feed: Answer is ${formattedAnswer1} (raw value: ${answer1.toString()}), updated at ${formattedTimestamp1}`,
      );
      console.log(
        `   relayer-feed: Answer is ${formattedAnswer2} (raw value: ${answer2.toString()}), updated at ${formattedTimestamp2}`,
      );
      console.log(`   Deviation = ${((answer1.toNumber() - answer2.toNumber()) / answer2.toNumber()) * 100}%`);
    }
  });
