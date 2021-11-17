import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("latestAnswer", "Fetches the latest answer")
  .addParam("contract", "The price feed contract to post to")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxPriceFeed = await hre.ethers.getContractFactory("FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.latestAnswer();
    console.log(tx.toString());
  });
