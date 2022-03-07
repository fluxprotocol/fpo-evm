import { Signer } from "@ethersproject/abstract-signer";
import { task } from "hardhat/config";

task("typeAndVersion", "Fetches the type and version of the contract")
  .addParam("contract")
  .setAction(async (_taskArgs, hre) => {
    const accounts: Signer[] = await hre.ethers.getSigners();
    const FluxPriceFeed = await hre.ethers.getContractFactory("contracts/FluxPriceFeed.sol:FluxPriceFeed");
    const contract = await FluxPriceFeed.attach(_taskArgs.contract);

    const tx = await contract.typeAndVersion();
    console.log(tx.toString());
  });
