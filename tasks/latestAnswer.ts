import { task } from "hardhat/config";

task("latestAnswer", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.latestAnswer();
    console.log(tx.toString());
  });
