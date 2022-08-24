import { task } from "hardhat/config";

task("getAnswer", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .addParam("round")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const decimals = await contract.decimals();
    const getAnswer = await contract.getAnswer(_taskArgs.round);
    const getTimestamp = await contract.getTimestamp(_taskArgs.round);

    const formattedAnswer = getAnswer.toString() / 10 ** decimals;
    const formattedTimestamp = new Date(getTimestamp.toNumber() * 1000);

    console.log(`Answer is ${formattedAnswer} (raw value: ${getAnswer.toString()}), updated at ${formattedTimestamp}`);
  });
