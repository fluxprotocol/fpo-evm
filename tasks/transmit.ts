import { task } from "hardhat/config";

task("transmit", "Submits an answer to a price feed")
  .addParam("contract", "The price feed contract to post to")
  .addParam("answer", "The answer to post")
  .setAction(async (_taskArgs, hre) => {
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.transmit(_taskArgs.answer);
    console.log("Transaction hash:", tx.hash);
  });
