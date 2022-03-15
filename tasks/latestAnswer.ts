import { task } from "hardhat/config";

task("latestAnswer", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const decimals = await contract.decimals();
    const latestAnswer = await contract.latestAnswer();
    const latestTimestamp = await contract.latestTimestamp();

    const formattedAnswer = latestAnswer.toString() / 10 ** decimals;
    const formattedTimestamp = new Date(latestTimestamp.toNumber() * 1000);

    console.log(
      `Latest answer is ${formattedAnswer} (raw value: ${latestAnswer.toString()}), last updated at ${formattedTimestamp}`,
    );
  });
